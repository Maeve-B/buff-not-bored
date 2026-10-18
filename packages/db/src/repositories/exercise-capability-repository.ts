/**
 * Typed query functions over the `exercise_capabilities` table — return
 * domain `ExerciseCapability` types, never Prisma row types (same
 * convention as repositories/exercise-repository.ts). Kept entirely
 * separate from the `exercises` table/repository: capability is personal,
 * mutable state, not catalog data — see entities/exercise-capability.ts.
 *
 * Also owns the append-only `exercise_weight_logs` table (see
 * schema.prisma's `ExerciseWeightLog` doc comment): written only as a side
 * effect of `upsertExerciseCapability`, never on its own, so the current
 * value and its history can never disagree.
 */

import {
  startingWeightCapability,
  validateExerciseCapability,
  type ExerciseCapability,
  type ExerciseCapabilityInput,
} from "@buff-not-bored/domain";
import { prisma } from "../client.js";
import { toDomainExerciseCapability, toExerciseCapabilityRow } from "../mappers/exercise-capability-mapper.js";
import type { ExerciseWeightHistoryEntry } from "../types.js";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Upserts the capability and, if it includes a weight, appends one weight
 * log row, inside the caller's transaction. `logNote` is the history entry's
 * note: the capability's own note unless the caller says otherwise.
 */
async function writeCapability(tx: TransactionClient, input: ExerciseCapabilityInput, logNote: string | undefined) {
  const row = toExerciseCapabilityRow(input);
  const capability = await tx.exerciseCapability.upsert({
    where: { exerciseId: input.exerciseId },
    create: row,
    update: row,
  });
  // Validation already guarantees weight/weightUnit are present together — this just narrows the types.
  if (input.weight !== undefined && input.weightUnit !== undefined) {
    await tx.exerciseWeightLog.create({
      data: {
        exerciseId: input.exerciseId,
        weight: input.weight,
        weightUnit: input.weightUnit,
        source: input.source,
        note: logNote ?? null,
      },
    });
  }
  return capability;
}

/**
 * Creates or replaces the current capability for an exercise. Validates
 * against the shared `exerciseCapabilitySchema` first. If the save
 * includes a weight, also appends one `ExerciseWeightLog` row in the same
 * transaction — the capability row itself is still a strict singleton per
 * exercise (overwritten in place); only the log accumulates.
 */
export async function upsertExerciseCapability(input: ExerciseCapabilityInput): Promise<ExerciseCapability> {
  validateExerciseCapability(input);
  const saved = await prisma.$transaction((tx) => writeCapability(tx, input, input.note));
  return toDomainExerciseCapability(saved);
}

/** The weight-history note on an entry created by a first-use starting weight. */
export const STARTING_WEIGHT_LOG_NOTE = "Starting weight (first use)";

/**
 * Records a first-use starting weight (spec §10.1) unless the exercise
 * already has a weight, which is never overwritten (§3.3). The read and the
 * write share one serializable transaction, so two first-use saves racing
 * for the same exercise can't both write: the loser fails and writes
 * nothing. Returns whether a weight was saved.
 */
export async function recordStartingWeight(exerciseId: string, weight: number): Promise<boolean> {
  return prisma.$transaction(
    async (tx) => {
      const row = await tx.exerciseCapability.findUnique({ where: { exerciseId } });
      const input = startingWeightCapability(exerciseId, row ? toDomainExerciseCapability(row) : undefined, weight);
      if (!input) return false;
      validateExerciseCapability(input);
      await writeCapability(tx, input, STARTING_WEIGHT_LOG_NOTE);
      return true;
    },
    { isolationLevel: "Serializable" },
  );
}

/** Every saved capability, one per exercise that has one — the source of your current weights. */
export async function listExerciseCapabilities(): Promise<ExerciseCapability[]> {
  const rows = await prisma.exerciseCapability.findMany({ orderBy: { exerciseId: "asc" } });
  return rows.map(toDomainExerciseCapability);
}

/** The current capability for an exercise, or `undefined` if none has ever been set. */
export async function getExerciseCapability(exerciseId: string): Promise<ExerciseCapability | undefined> {
  const row = await prisma.exerciseCapability.findUnique({ where: { exerciseId } });
  return row ? toDomainExerciseCapability(row) : undefined;
}

/**
 * Every weight the user has ever saved for an exercise via a capability
 * save, oldest first — in the same origin-agnostic `{ dateIso, weight }`
 * shape as `getExerciseWeightHistory` (workout-derived, in
 * workout-repository.ts), so a caller can merge the two into one
 * timeline. `dateIso` here is a full ISO timestamp (not truncated to a
 * date) so same-day saves still sort correctly against each other.
 */
export async function getManualExerciseWeightLog(exerciseId: string): Promise<ExerciseWeightHistoryEntry[]> {
  const rows = await prisma.exerciseWeightLog.findMany({
    where: { exerciseId },
    orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
    select: { recordedAt: true, weight: true },
  });
  return rows.map((row) => ({ dateIso: row.recordedAt.toISOString(), weight: row.weight }));
}

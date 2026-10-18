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

import { validateExerciseCapability, type ExerciseCapability, type ExerciseCapabilityInput } from "@buff-not-bored/domain";
import { prisma } from "../client.js";
import { toDomainExerciseCapability, toExerciseCapabilityRow } from "../mappers/exercise-capability-mapper.js";
import type { ExerciseWeightHistoryEntry } from "../types.js";

/**
 * Creates or replaces the current capability for an exercise. Validates
 * against the shared `exerciseCapabilitySchema` first. If the save
 * includes a weight, also appends one `ExerciseWeightLog` row in the same
 * transaction — the capability row itself is still a strict singleton per
 * exercise (overwritten in place); only the log accumulates.
 */
export async function upsertExerciseCapability(input: ExerciseCapabilityInput): Promise<ExerciseCapability> {
  validateExerciseCapability(input);
  const row = toExerciseCapabilityRow(input);
  const saved = await prisma.$transaction(async (tx) => {
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
          note: input.note ?? null,
        },
      });
    }
    return capability;
  });
  return toDomainExerciseCapability(saved);
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

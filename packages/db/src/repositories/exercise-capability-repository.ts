/**
 * Typed query functions over the `exercise_capabilities` table — return
 * domain `ExerciseCapability` types, never Prisma row types (same
 * convention as repositories/exercise-repository.ts). Kept entirely
 * separate from the `exercises` table/repository: capability is personal,
 * mutable state, not catalog data — see entities/exercise-capability.ts.
 *
 * Not wired into apps/web or the progression engine yet — this is the
 * repository boundary a future profile/settings UI and a future
 * progression-confirmation flow would both call into.
 */

import { validateExerciseCapability, type ExerciseCapability, type ExerciseCapabilityInput } from "@buff-not-bored/domain";
import { prisma } from "../client.js";
import { toDomainExerciseCapability, toExerciseCapabilityRow } from "../mappers/exercise-capability-mapper.js";

/** Creates or replaces the current capability for an exercise. Validates against the shared `exerciseCapabilitySchema` first. */
export async function upsertExerciseCapability(input: ExerciseCapabilityInput): Promise<ExerciseCapability> {
  validateExerciseCapability(input);
  const row = toExerciseCapabilityRow(input);
  const saved = await prisma.exerciseCapability.upsert({
    where: { exerciseId: input.exerciseId },
    create: row,
    update: row,
  });
  return toDomainExerciseCapability(saved);
}

/** The current capability for an exercise, or `undefined` if none has ever been set. */
export async function getExerciseCapability(exerciseId: string): Promise<ExerciseCapability | undefined> {
  const row = await prisma.exerciseCapability.findUnique({ where: { exerciseId } });
  return row ? toDomainExerciseCapability(row) : undefined;
}

/**
 * Typed query functions over the `exercises` table — return domain `Exercise`
 * types, never Prisma row types (ARCHITECTURE.md §2/§4).
 */

import type { Exercise } from "@buff-not-bored/domain";
import { exerciseSchema } from "@buff-not-bored/domain";
import { prisma } from "../client.js";
import { toDomainExercise, toExerciseRow } from "../mappers/exercise-mapper.js";

/** Creates or replaces an exercise by id. Validates against the same `exerciseSchema` the domain catalog itself uses. */
export async function upsertExercise(exercise: Exercise): Promise<Exercise> {
  exerciseSchema.parse(exercise);
  const row = toExerciseRow(exercise);
  const saved = await prisma.exercise.upsert({
    where: { id: exercise.id },
    create: row,
    update: row,
  });
  return toDomainExercise(saved);
}

export async function findExerciseById(id: string): Promise<Exercise | undefined> {
  const row = await prisma.exercise.findUnique({ where: { id } });
  return row ? toDomainExercise(row) : undefined;
}

export async function listExercises(): Promise<Exercise[]> {
  const rows = await prisma.exercise.findMany({ orderBy: { id: "asc" } });
  return rows.map(toDomainExercise);
}

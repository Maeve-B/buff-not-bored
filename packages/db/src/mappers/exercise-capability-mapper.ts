/**
 * Prisma `ExerciseCapability` row <-> domain `ExerciseCapability`
 * (packages/domain/src/entities/exercise-capability.ts). Pure functions,
 * unit-testable without a database connection — same convention as
 * mappers/exercise-mapper.ts.
 */

import type { ExerciseCapability as ExerciseCapabilityRow } from "@prisma/client";
import type { CapabilitySource, ExerciseCapability, RepsUnit, WeightUnit } from "@buff-not-bored/domain";
import type { ExerciseCapabilityInput } from "@buff-not-bored/domain";

/** Prisma stores optional scalars as `null`; the domain type uses `undefined`. */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/** Row -> domain. Assumes the row already passed `exerciseCapabilitySchema` validation at write time. */
export function toDomainExerciseCapability(row: ExerciseCapabilityRow): ExerciseCapability {
  return {
    exerciseId: row.exerciseId,
    weight: nullToUndefined(row.weight),
    weightUnit: nullToUndefined(row.weightUnit) as WeightUnit | undefined,
    reps: nullToUndefined(row.reps),
    repsUnit: nullToUndefined(row.repsUnit) as RepsUnit | undefined,
    duration: nullToUndefined(row.duration),
    source: row.source as CapabilitySource,
    note: nullToUndefined(row.note),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Domain write-input -> Prisma create/update input. `undefined` fields become `null` for Prisma's optional scalars. `updatedAt` is never part of this — Prisma's `@updatedAt` manages it. */
export function toExerciseCapabilityRow(
  input: ExerciseCapabilityInput,
): Omit<ExerciseCapabilityRow, "id" | "createdAt" | "updatedAt"> {
  return {
    exerciseId: input.exerciseId,
    weight: input.weight ?? null,
    weightUnit: input.weightUnit ?? null,
    reps: input.reps ?? null,
    repsUnit: input.repsUnit ?? null,
    duration: input.duration ?? null,
    source: input.source,
    note: input.note ?? null,
  };
}

/**
 * Prisma `Exercise` row <-> domain `Exercise` (packages/domain/src/entities/exercise.ts).
 * Kept as pure functions so the mapping itself is unit-testable without a
 * database connection, per req. 15.
 */

import type { Exercise as ExerciseRow } from "@prisma/client";
import type {
  Equipment,
  Exercise,
  ExerciseType,
  Location,
  Muscle,
  ProgrammeGroup,
  RepsUnit,
  WeightUnit,
} from "@buff-not-bored/domain";

/** Prisma stores optional scalars as `null`; the domain type uses `undefined`. */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/** Row -> domain. Assumes the row already passed `exerciseSchema` validation (see validation/exercise-input.schema.ts) at write time. */
export function toDomainExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    programmeGroup: row.programmeGroup as ProgrammeGroup,
    primaryMuscles: row.primaryMuscles as Muscle[],
    secondaryMuscles: row.secondaryMuscles as Muscle[],
    movementPatterns: row.movementPatterns,
    exerciseType: row.exerciseType as ExerciseType,
    equipment: row.equipment as Equipment,
    location: row.location as Location,
    startingWeight: nullToUndefined(row.startingWeight),
    weightUnit: nullToUndefined(row.weightUnit) as WeightUnit | undefined,
    prescribedReps: nullToUndefined(row.prescribedReps),
    repsUnit: nullToUndefined(row.repsUnit) as RepsUnit | undefined,
    prescribedDuration: nullToUndefined(row.prescribedDuration),
    progressionPercentage: nullToUndefined(row.progressionPercentage),
    active: row.active,
    notes: nullToUndefined(row.notes),
    needsReview: row.needsReview,
  };
}

/** Domain -> Prisma create/update input. `undefined` fields become `null` for Prisma's optional scalars. */
export function toExerciseRow(exercise: Exercise): Omit<ExerciseRow, never> {
  return {
    id: exercise.id,
    name: exercise.name,
    programmeGroup: exercise.programmeGroup,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    movementPatterns: exercise.movementPatterns,
    exerciseType: exercise.exerciseType,
    equipment: exercise.equipment,
    location: exercise.location,
    startingWeight: exercise.startingWeight ?? null,
    weightUnit: exercise.weightUnit ?? null,
    prescribedReps: exercise.prescribedReps ?? null,
    repsUnit: exercise.repsUnit ?? null,
    prescribedDuration: exercise.prescribedDuration ?? null,
    progressionPercentage: exercise.progressionPercentage ?? null,
    active: exercise.active,
    notes: exercise.notes ?? null,
    needsReview: exercise.needsReview ?? false,
  };
}

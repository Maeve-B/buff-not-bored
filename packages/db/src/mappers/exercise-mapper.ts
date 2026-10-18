/**
 * Prisma `Exercise` row <-> domain `Exercise` (packages/domain/src/entities/exercise.ts).
 * Kept as pure functions so the mapping itself is unit-testable without a
 * database connection, per req. 15.
 */

import type { Exercise as ExerciseRow } from "@prisma/client";
import { findExerciseProfile } from "@buff-not-bored/domain";
import type {
  Equipment,
  Exercise,
  ExerciseClass,
  ExerciseLibraryProfile,
  ExerciseType,
  GymEquipment,
  JointStressTag,
  LoadDirection,
  LoadType,
  Location,
  Muscle,
  PrimaryPattern,
  ProgrammeGroup,
  ProgressionStrategy,
  RepsUnit,
  SkillLevel,
  Station,
  WeightUnit,
} from "@buff-not-bored/domain";

/** Prisma stores optional scalars as `null`; the domain type uses `undefined`. */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/** A column that toExerciseRow always fills; null here means the row was not written by it. */
function requireProfileColumn<T>(row: ExerciseRow, column: string, value: T | null): T {
  if (value === null) {
    throw new Error(`Exercise row "${row.id}" has no ${column}, but its other v2 library profile columns are set.`);
  }
  return value;
}

/**
 * The v2 library profile for a row. toExerciseRow writes every profile
 * column together, so a null movementPattern means the row was saved before
 * the profile columns existed. The library owns this data (each save copies
 * the current entry), so such a row takes its profile from the current
 * library rather than a guess. A pre-v2 row for an id the library no longer
 * has can't be completed and fails loudly.
 */
function toLibraryProfile(row: ExerciseRow): ExerciseLibraryProfile {
  if (row.movementPattern === null) {
    const current = findExerciseProfile(row.id);
    if (!current) {
      throw new Error(`Exercise row "${row.id}" predates the v2 library profile and the library has no such exercise.`);
    }
    return current;
  }
  return {
    movementPattern: row.movementPattern as PrimaryPattern,
    exerciseClass: requireProfileColumn(row, "exerciseClass", row.exerciseClass) as ExerciseClass,
    skillLevel: requireProfileColumn(row, "skillLevel", row.skillLevel) as SkillLevel,
    loadType: requireProfileColumn(row, "loadType", row.loadType) as LoadType,
    equipmentNeeded: row.equipmentNeeded as GymEquipment[],
    station: requireProfileColumn(row, "station", row.station) as Station,
    unilateral: requireProfileColumn(row, "unilateral", row.unilateral),
    perSide: requireProfileColumn(row, "perSide", row.perSide),
    incrementOptions: row.incrementOptions,
    loadDirection: requireProfileColumn(row, "loadDirection", row.loadDirection) as LoadDirection,
    progressionStrategyDefault: requireProfileColumn(
      row,
      "progressionStrategyDefault",
      row.progressionStrategyDefault,
    ) as ProgressionStrategy,
    lightAlternativeIds: row.lightAlternativeIds,
    swapGroup: nullToUndefined(row.swapGroup),
    regressionId: nullToUndefined(row.regressionId),
    progressionId: nullToUndefined(row.progressionId),
    jointStressTags: row.jointStressTags as JointStressTag[],
    cues: { setup: requireProfileColumn(row, "cueSetup", row.cueSetup), form: row.cueForm },
  };
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
    ...toLibraryProfile(row),
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
    movementPattern: exercise.movementPattern,
    exerciseClass: exercise.exerciseClass,
    skillLevel: exercise.skillLevel,
    loadType: exercise.loadType,
    equipmentNeeded: exercise.equipmentNeeded,
    station: exercise.station,
    unilateral: exercise.unilateral,
    perSide: exercise.perSide,
    incrementOptions: exercise.incrementOptions,
    loadDirection: exercise.loadDirection,
    progressionStrategyDefault: exercise.progressionStrategyDefault,
    lightAlternativeIds: exercise.lightAlternativeIds,
    swapGroup: exercise.swapGroup ?? null,
    regressionId: exercise.regressionId ?? null,
    progressionId: exercise.progressionId ?? null,
    jointStressTags: exercise.jointStressTags,
    cueSetup: exercise.cues.setup,
    cueForm: exercise.cues.form,
  };
}

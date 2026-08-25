/**
 * The `Exercise` entity and its supporting enums, matching the structured
 * fields defined in PRODUCT_SPEC.md §5 ("Initial Exercise Database").
 *
 * Field names are camelCase here (idiomatic TypeScript); the spec's prose
 * uses snake_case for the same concepts (e.g. `programme_group` -> `programmeGroup`).
 */

/** The seven programme groups a full-body session is organised around (spec §3). */
export const PROGRAMME_GROUPS = [
  "legs",
  "back",
  "chest",
  "triceps",
  "shoulders",
  "biceps",
  "core",
] as const;
export type ProgrammeGroup = (typeof PROGRAMME_GROUPS)[number];

/**
 * Physiological muscles, independent of programme group.
 *
 * This is deliberately a *separate* concept from ProgrammeGroup — spec §3 is
 * explicit that an exercise's programme group (organisational) and its actual
 * muscles (physiological) can diverge, e.g. the Bulgarian Split Squat is
 * grouped under "chest" for equipment/setup reasons but trains quads/glutes.
 */
export const MUSCLES = [
  "quadriceps",
  "glutes",
  "adductors",
  "hamstrings",
  "calves",
  "spinal_erectors",
  "back",
  "upper_back",
  "shoulders",
  "lateral_deltoids",
  "anterior_deltoids",
  "chest",
  "upper_chest",
  "triceps",
  "biceps",
  "brachialis",
  "forearms",
  "abdominals",
  "obliques",
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const EXERCISE_TYPES = ["compound", "isolation", "bodyweight", "core"] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const EQUIPMENT_TYPES = ["barbell", "dumbbell", "bodyweight"] as const;
export type Equipment = (typeof EQUIPMENT_TYPES)[number];

/** Where in the gym the exercise is performed — relevant later to equipment/faff optimisation (spec §13). */
export const LOCATIONS = ["rack", "bench", "standing", "floor", "bench_or_floor"] as const;
export type Location = (typeof LOCATIONS)[number];

export const WEIGHT_UNITS = ["kg"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const REPS_UNITS = ["reps", "per_side"] as const;
export type RepsUnit = (typeof REPS_UNITS)[number];

/**
 * Movement patterns are descriptive tags (e.g. "squat", "hinge", "horizontal push").
 * The spec's exercise library uses a free-form (not fixed) set of these, so this
 * is typed as `string` rather than a closed enum to avoid churn as the library grows.
 */
export type MovementPattern = string;

/**
 * A single exercise in the catalog, matching PRODUCT_SPEC.md §5 field-for-field.
 *
 * Not every field applies to every exercise: bodyweight/timed exercises
 * (e.g. Plank, Superman Holds) have `prescribedDuration` instead of
 * `prescribedReps`/`startingWeight`/`progressionPercentage`.
 */
export interface Exercise {
  id: string;
  name: string;
  programmeGroup: ProgrammeGroup;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  movementPatterns: MovementPattern[];
  exerciseType: ExerciseType;
  equipment: Equipment;
  location: Location;

  /** Absent for bodyweight-only exercises with no external load. */
  startingWeight?: number;
  weightUnit?: WeightUnit;

  /** Rep-based exercises set this; duration-based exercises leave it unset. */
  prescribedReps?: number;
  repsUnit?: RepsUnit;

  /** Duration-based exercises (e.g. Plank) set this instead of prescribedReps. Seconds. */
  prescribedDuration?: number;

  /** Absent where the spec gives no progression percentage (bodyweight exercises with no load). */
  progressionPercentage?: number;

  active: boolean;
  notes?: string;
}

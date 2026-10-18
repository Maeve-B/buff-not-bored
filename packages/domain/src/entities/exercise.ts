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
 * grouped under "legs" physiologically regardless of any equipment-driven
 * organisational placement.
 *
 * Per the 2026 taxonomy correction: `ProgrammeGroup` (Legs/Back/Chest/
 * Triceps/Shoulders/Biceps/Core — programme/body-area categories) and
 * `Muscle` (physiological coverage) must never share generic values that
 * compete with more specific ones. Generic `back` and `shoulders` were
 * removed from this list for exactly that reason — they collided with the
 * more specific `lats`/`upper_back`/`trapezius` and `lateral_deltoids`/
 * `anterior_deltoids` values, which is exactly what optimisation questions
 * like "have I trained my lats twice this week?" need to be unambiguous.
 * Kept at moderate, programming-useful granularity — no anatomical
 * subdivisions (e.g. no upper/middle/lower trapezius) unless a distinction
 * materially affects exercise selection.
 */
export const MUSCLES = [
  "quads",
  "glutes",
  "adductors",
  "hamstrings",
  "calves",
  "spinal_erectors",
  "lats",
  "upper_back",
  "trapezius",
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

// ---------------------------------------------------------------------------
// Library v2 vocabularies (PRODUCT_SPEC.md v2 §9.1). These sit alongside the
// v1 fields above rather than replacing them: the v1 refresh, reduction and
// equipment engines still run on programmeGroup/equipment/location until
// their v2 rebuilds land (DECISIONS.md D-002, S-001).
// ---------------------------------------------------------------------------

/** One primary movement pattern per exercise (§9.1). Distinct from the free-form v1 `movementPatterns` tags. */
export const PRIMARY_PATTERNS = [
  "squat",
  "hinge",
  "lunge_unilateral",
  "hip_extension",
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "elbow_flexion",
  "elbow_extension",
  "shoulder_raise",
  "calf",
  "anti_extension",
  "anti_rotation",
  "lateral_flexion",
  "rotation",
  "carry",
] as const;
export type PrimaryPattern = (typeof PRIMARY_PATTERNS)[number];

/** §6.3: compound = large muscle areas, two or more primary joints; isolation = one primary joint. */
export const EXERCISE_CLASSES = ["compound", "isolation"] as const;
export type ExerciseClass = (typeof EXERCISE_CLASSES)[number];

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const LOAD_TYPES = [
  "barbell",
  "dumbbell_pair",
  "dumbbell_single",
  "kettlebell",
  "cable",
  "machine",
  "bodyweight",
  "band",
  "assisted_machine",
] as const;
export type LoadType = (typeof LOAD_TYPES)[number];

/** Everything an exercise needs to be available (§6.1's equipment list) — v1's `equipment` holds only the load implement. */
export const GYM_EQUIPMENT = [
  "barbell",
  "rack",
  "dumbbells",
  "kettlebell",
  "bench",
  "cable",
  "machine",
  "pull_up_bar",
  "band",
  "bodyweight",
] as const;
export type GymEquipment = (typeof GYM_EQUIPMENT)[number];

/** Where the exercise is done (§9.1), for faff scoring and "equipment taken → swap". */
export const STATIONS = ["rack", "bench", "cable_stack", "floor", "pull_up_bar", "machine", "open_space"] as const;
export type Station = (typeof STATIONS)[number];

/** `reduce_assistance`: the logged value is assistance in kg and a lower number is progress (§9.1). */
export const LOAD_DIRECTIONS = ["add_load", "reduce_assistance"] as const;
export type LoadDirection = (typeof LOAD_DIRECTIONS)[number];

/** §6.5. `percentage` is for circuits only. */
export const PROGRESSION_STRATEGIES = ["load_nudge", "double_progression", "ladder", "percentage", "technique"] as const;
export type ProgressionStrategy = (typeof PROGRESSION_STRATEGIES)[number];

export const JOINT_STRESS_TAGS = ["knee", "lower_back", "shoulder", "wrist", "elbow", "hip"] as const;
export type JointStressTag = (typeof JOINT_STRESS_TAGS)[number];

/** A setup cue plus one or two form cues, in our own words, for audio and the UI. */
export interface ExerciseCues {
  setup: string;
  form: string[];
}

/** The §9.1 library fields added in v2. Authored per exercise in data/exercise-profiles.ts. */
export interface ExerciseLibraryProfile {
  movementPattern: PrimaryPattern;
  exerciseClass: ExerciseClass;
  skillLevel: SkillLevel;
  loadType: LoadType;
  equipmentNeeded: GymEquipment[];
  station: Station;
  unilateral: boolean;
  /** Reps or seconds are counted per side. Only meaningful when `unilateral`. */
  perSide: boolean;
  /** Real available jumps in kg, smallest first. Empty for unloaded bodyweight exercises. */
  incrementOptions: number[];
  loadDirection: LoadDirection;
  progressionStrategyDefault: ProgressionStrategy;
  /** Less fatiguing variants in the same movement pattern (§6.6). May be empty until the Phase 1 library expansion. */
  lightAlternativeIds: string[];
  /** Exercises sharing a swap group are equivalent-stimulus alternatives. */
  swapGroup?: string;
  /** Ladder neighbours (§10.3). */
  regressionId?: string;
  progressionId?: string;
  jointStressTags: JointStressTag[];
  cues: ExerciseCues;
}

/**
 * A single exercise in the catalog, matching PRODUCT_SPEC.md §5 field-for-field.
 *
 * Not every field applies to every exercise: bodyweight/timed exercises
 * (e.g. Plank, Superman Holds) have `prescribedDuration` instead of
 * `prescribedReps`/`startingWeight`/`progressionPercentage`.
 */
export interface Exercise extends ExerciseLibraryProfile {
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

  /**
   * Circuits only (v2 §9.1, §3.3): strength work never progresses by
   * percentage. Absent where no percentage is given (unloaded bodyweight).
   */
  progressionPercentage?: number;

  active: boolean;
  notes?: string;

  /**
   * True when some part of this exercise's data — typically startingWeight/
   * prescribedReps/equipment/location, but occasionally muscle
   * classification (e.g. Overhead Press, reclassified as a side effect of
   * retiring the generic "shoulders" muscle value) — is a placeholder/
   * assumed value rather than one confirmed by the user. See the `notes`
   * field on the same exercise for which part is unconfirmed. Absent/false
   * means the data is confirmed.
   */
  needsReview?: boolean;
}

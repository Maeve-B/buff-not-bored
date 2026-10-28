// Entities
export * from "./entities/constraints.js";
export * from "./entities/exercise.js";
export * from "./entities/display-unit.js";
export * from "./entities/needs-profile.js";
export * from "./entities/exercise-capability.js";
export * from "./entities/current-weights.js";
export * from "./entities/muscle-coverage.js";
export * from "./entities/programme.js";
export * from "./entities/strength.js";
export * from "./entities/preset-programme.js";
export * from "./entities/training-programme.js";
export * from "./entities/weight-adjustment.js";
export * from "./entities/workout.js";
export * from "./entities/workout-session.js";
export * from "./entities/workout-type.js";

// Seed data
export { EXERCISES, CLASSIC_EXERCISES } from "./data/exercises.js";
export { EXERCISE_PROFILES, findExerciseProfile } from "./data/exercise-profiles.js";
export { PRESET_PROGRAMME_1 } from "./data/preset-programme-1.js";
export { WARMUP_PLAN } from "./data/warmup.js";
export { COOLDOWN_PLAN } from "./data/cooldown.js";
export { PROGRAMME_TEMPLATE, PROGRAMME_ALLOCATION } from "./data/programme-template.js";
export { EIGHT_WEEK_STRENGTH_PROGRAMME, TRAINING_PROGRAMMES } from "./data/training-programme.js";

// Validation
export { exerciseSchema, validateCatalog, CatalogValidationError } from "./validation/exercise.schema.js";
export {
  exerciseCapabilitySchema,
  validateExerciseCapability,
  CapabilityValidationError,
  type ExerciseCapabilityInput,
} from "./validation/exercise-capability.schema.js";
export {
  scheduledWorkoutSchema,
  trainingProgrammeSchema,
  trainingProgrammeWeekSchema,
  validateTrainingProgramme,
  TrainingProgrammeValidationError,
} from "./validation/training-programme.schema.js";

// Engine
export {
  buildDefaultSession,
  buildSessionFromTemplate,
  buildWorkout,
  buildWorkoutWithDetails,
  prescribeCurrentWeights,
  TARGET_SESSION_DURATION,
  WorkoutBuilderError,
  type BuildWorkoutOptions,
  type BuildWorkoutResult,
} from "./engine/workout-builder.js";

export {
  scoreEquipmentAlignment,
  countTransitions,
  rankByEquipmentAlignment,
  distinctEquipment,
  distinctLocations,
  type EquipmentScore,
} from "./engine/equipment-optimiser.js";

export {
  refreshWorkout,
  type RefreshOptions,
  type RefreshResult,
  type ReplacementDecision,
  type RejectedCandidate,
} from "./engine/refresh-engine.js";

export {
  reduceExerciseCount,
  ReductionError,
  type ReduceExerciseCountOptions,
  type ReductionResult,
  type ReductionGroupDecision,
  type ExerciseRedundancyScore,
  type CoverageGapWarning,
} from "./engine/reduction-engine.js";

export {
  recommendProgression,
  FEEDBACK_OPTIONS,
  PROGRESSION_RECOMMENDATION_TYPES,
  type Feedback,
  type ProgressionInput,
  type ProgressionRecommendation,
  type ProgressionRecommendationType,
} from "./engine/progression-engine.js";

export {
  buildDefaultStrengthSession,
  buildPresetStrengthSession,
  applyStartingWeight,
  buildStrengthSessionFromTemplate,
  prescribeStrengthWeights,
  DEFAULT_SETS_PER_EXERCISE,
  DEFAULT_REST_SECONDS,
  StrengthBuilderError,
  type BuildStrengthSessionOptions,
} from "./engine/strength-builder.js";

export { assessReadiness, readinessFromLastTime, type LastTimeOnExercise, type Readiness } from "./engine/readiness.js";

export {
  buildWorkoutForScheduledWorkout,
  resolveTodaysWorkout,
  ProgrammeResolverError,
} from "./engine/programme-resolver.js";

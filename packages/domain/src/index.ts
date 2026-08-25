// Entities
export * from "./entities/constraints.js";
export * from "./entities/exercise.js";
export * from "./entities/muscle-coverage.js";
export * from "./entities/programme.js";
export * from "./entities/workout-session.js";

// Seed data
export { EXERCISES } from "./data/exercises.js";
export { WARMUP_PLAN } from "./data/warmup.js";
export { COOLDOWN_PLAN } from "./data/cooldown.js";
export { PROGRAMME_TEMPLATE, PROGRAMME_ALLOCATION } from "./data/programme-template.js";

// Validation
export { exerciseSchema, validateCatalog, CatalogValidationError } from "./validation/exercise.schema.js";

// Engine
export {
  buildDefaultSession,
  buildSessionFromTemplate,
  buildWorkout,
  buildWorkoutWithDetails,
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

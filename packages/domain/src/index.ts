// Entities
export * from "./entities/exercise.js";
export * from "./entities/muscle-coverage.js";
export * from "./entities/programme.js";
export * from "./entities/workout-session.js";

// Seed data
export { EXERCISES } from "./data/exercises.js";
export { WARMUP_PLAN } from "./data/warmup.js";
export { COOLDOWN_PLAN } from "./data/cooldown.js";

// Validation
export { exerciseSchema, validateCatalog, CatalogValidationError } from "./validation/exercise.schema.js";

// Engine
export {
  buildDefaultSession,
  buildSessionFromTemplate,
  TARGET_SESSION_DURATION,
  WorkoutBuilderError,
} from "./engine/workout-builder.js";

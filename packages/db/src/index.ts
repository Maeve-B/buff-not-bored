export { prisma } from "./client.js";

// Types (the persistence-facing DTO shape — see src/types.ts's doc comment)
export type {
  LoggedSetInput,
  LoggedSetRecord,
  LoggedWorkoutExerciseInput,
  LoggedWorkoutExerciseRecord,
  LoggedWorkoutInput,
  LoggedWorkoutRecord,
  LoggedWorkoutSummary,
} from "./types.js";

// Validation
export { loggedWorkoutSchema, validateLoggedWorkout, LoggedWorkoutValidationError } from "./validation/logged-workout.schema.js";

// Mappers (exported for testing / advanced callers; repositories are the normal entry point)
export { toDomainExercise, toExerciseRow } from "./mappers/exercise-mapper.js";
export { toDomainLoggedWorkout, toWorkoutUpsertInput } from "./mappers/workout-mapper.js";

// Repositories
export { upsertExercise, findExerciseById, listExercises } from "./repositories/exercise-repository.js";
export {
  saveWorkoutSnapshot,
  getWorkoutById,
  listWorkoutSummaries,
  WorkoutStatusRegressionError,
} from "./repositories/workout-repository.js";

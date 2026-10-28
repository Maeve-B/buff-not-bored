export { prisma } from "./client.js";

// Types (the persistence-facing DTO shape — see src/types.ts's doc comment)
export type {
  ExerciseWeightHistoryEntry,
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
export { toDomainExerciseCapability, toExerciseCapabilityRow } from "./mappers/exercise-capability-mapper.js";

// Repositories
export {
  getNeedsConversationDraft,
  saveNeedsConversationDraft,
  clearNeedsConversationDraft,
} from "./repositories/needs-conversation-repository.js";
export { getNeedsProfile, saveNeedsProfile } from "./repositories/needs-profile-repository.js";
export { getAppSettings, saveWeightUnit, type AppSettings } from "./repositories/settings-repository.js";
export { upsertExercise, findExerciseById, listExercises } from "./repositories/exercise-repository.js";
export {
  saveWorkoutSnapshot,
  getWorkoutById,
  listWorkoutSummaries,
  getExerciseWeightHistory,
  findLastTrainedProgrammeSession,
  findLastLoggedStrengthExercises,
  WorkoutStatusRegressionError,
} from "./repositories/workout-repository.js";
export {
  upsertExerciseCapability,
  listExerciseCapabilities,
  recordStartingWeight,
  STARTING_WEIGHT_LOG_NOTE,
  getExerciseCapability,
  getManualExerciseWeightLog,
} from "./repositories/exercise-capability-repository.js";

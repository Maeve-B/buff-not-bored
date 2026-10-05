import type { ExerciseCapability, StrengthSession, WorkoutSession, WorkoutStatus, WorkoutType } from "@buff-not-bored/domain";

/** One exercise's logged performance for a Circuit session (one set per exercise, matching PlannedExercise's shape). */
export interface SetLog {
  exerciseId: string;
  actualWeight?: number;
  actualReps?: number;
  actualDuration?: number;
  completed: boolean;
  loggedAt: number;
}

export interface CompletedWorkout {
  id: string;
  dateIso: string;
  workoutName: string;
  workoutType: "circuit";
  durationMs: number;
  totalExercises: number;
  exercisesCompleted: number;
  /** Snapshot of the session as actually performed (post any swaps/refresh), for Progress calculations. */
  session: WorkoutSession;
  setLogs: SetLog[];
}

export interface CompletedStrengthWorkout {
  id: string;
  dateIso: string;
  workoutName: string;
  workoutType: "classic_strength";
  durationMs: number;
  /** Sets, not exercises, are the unit of "completion" for Classic Strength. */
  totalSets: number;
  setsCompleted: number;
  /** Snapshot of the session including every set's logged performance. */
  session: StrengthSession;
}

/**
 * The minimal shared projection both workout types reduce to for display —
 * used only by the History screen to merge two differently-shaped stores
 * into one chronological list. Each store keeps its own richer type
 * (CompletedWorkout / CompletedStrengthWorkout) for its own screens; this
 * is not a replacement for either.
 */
export interface HistoryEntry {
  id: string;
  dateIso: string;
  workoutName: string;
  workoutType: WorkoutType;
  durationMs: number;
  completedLabel: string; // e.g. "22/25 exercises" or "18/24 sets" — unit differs by type, so it's pre-formatted here
}

/** Result of persisting a workout snapshot (lib/actions/save-workout.ts) — a typed outcome, never a silent success on failure. */
export type SaveWorkoutResult = { ok: true; id: string } | { ok: false; error: string };

/** Result of saving an exercise capability edit (lib/actions/exercise-capability.ts) — same typed-outcome convention as SaveWorkoutResult. */
export type SaveCapabilityResult = { ok: true; capability: ExerciseCapability } | { ok: false; error: string };

/** Status of the most recent persistence attempt for the current workout — "idle" before a workout has started. Shared by both stores. */
export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * A point-in-time snapshot of the current session, built fresh from live
 * store state at every meaningful moment (start, each logged set,
 * completion) and sent to persistence — then discarded. Deliberately NOT
 * the same type as `CompletedWorkout`/`CompletedStrengthWorkout`: those are
 * built only once, at real completion, and feed History/Progress display;
 * mixing an in-progress record into that same shape/array would leak into
 * display logic this feature isn't touching. `id` is the stable session id
 * (generated once per workout attempt, at Start) that every snapshot for
 * that attempt shares — the mechanism that prevents duplicate saves.
 */
export interface CircuitWorkoutSnapshot {
  id: string;
  dateIso: string;
  workoutName: string;
  workoutType: "circuit";
  status: WorkoutStatus;
  session: WorkoutSession;
  setLogs: SetLog[];
}

export interface StrengthWorkoutSnapshot {
  id: string;
  dateIso: string;
  workoutName: string;
  workoutType: "classic_strength";
  status: WorkoutStatus;
  session: StrengthSession;
}

export type WorkoutSnapshot = CircuitWorkoutSnapshot | StrengthWorkoutSnapshot;

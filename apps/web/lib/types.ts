import type { StrengthSession, WorkoutSession, WorkoutType } from "@buff-not-bored/domain";

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

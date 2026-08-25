import type { WorkoutSession } from "@buff-not-bored/domain";

/** One exercise's logged performance for the current session. One log per exercise — the seeded programme is one working set per exercise, matching PlannedExercise's shape (no sets array in the domain model). */
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
  durationMs: number;
  totalExercises: number;
  exercisesCompleted: number;
  /** Snapshot of the session as actually performed (post any swaps/refresh), for Progress calculations. */
  session: WorkoutSession;
  setLogs: SetLog[];
}

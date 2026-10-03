/**
 * The persistence-facing shape of a workout: flatter than domain's `Workout`
 * union on purpose. `Workout`/`WorkoutSession`/`StrengthSession` carry
 * UI/engine-only content (warm-up steps, cool-down target areas, target
 * session duration) that nothing needs to persist yet — this phase only
 * needs enough to reconstruct "what was performed," per requirement 4.
 *
 * One shape serves both workout types uniformly (req. 6): Circuit produces
 * exactly one `LoggedSetInput` per exercise; Classic Strength produces N.
 * Nothing here privileges either as the "real" shape.
 */

import type { RepsUnit, SlotRole, WeightAdjustment, WorkoutStatus, WorkoutType } from "@buff-not-bored/domain";

export interface LoggedSetInput {
  setNumber: number;
  targetReps?: number;
  repsUnit?: RepsUnit;
  targetDuration?: number;
  targetWeight?: number;
  actualWeight?: number;
  actualReps?: number;
  actualDuration?: number;
  completed: boolean;
  loggedAt?: string;
}

export interface LoggedWorkoutExerciseInput {
  exerciseId: string;
  role: SlotRole;
  restSeconds?: number;
  /**
   * The session's weight recommendation for this exercise, split exactly as
   * packages/domain's `WeightRecommendation` keeps it: base weight,
   * ordered adjustments, and the derived final weight — never collapsed
   * into one number. Absent for bodyweight-only exercises with nothing to
   * recommend.
   */
  baseWeight?: number;
  adjustments?: WeightAdjustment[];
  finalWeight?: number;
  sets: LoggedSetInput[];
}

export interface LoggedWorkoutInput {
  workoutType: WorkoutType;
  name: string;
  status: WorkoutStatus;
  /** ISO date — session context, matching domain WorkoutBase.dateIso. */
  dateIso: string;
  programmeId?: string;
  weekNumber?: number;
  scheduledWorkoutId?: string;
  exercises: LoggedWorkoutExerciseInput[];
}

export interface LoggedSetRecord extends LoggedSetInput {
  id: string;
}

export interface LoggedWorkoutExerciseRecord extends Omit<LoggedWorkoutExerciseInput, "sets"> {
  id: string;
  order: number;
  sets: LoggedSetRecord[];
}

export interface LoggedWorkoutRecord extends Omit<LoggedWorkoutInput, "exercises"> {
  id: string;
  exercises: LoggedWorkoutExerciseRecord[];
}

/** Lightweight projection for list views — no per-set detail, matching apps/web's HistoryEntry pattern of a display-only shape. */
export interface LoggedWorkoutSummary {
  id: string;
  workoutType: WorkoutType;
  name: string;
  status: WorkoutStatus;
  dateIso: string;
}

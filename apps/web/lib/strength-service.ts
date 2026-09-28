/**
 * The thin application layer for Classic Strength — the same pattern as
 * lib/workout-service.ts (Circuit), talking to @buff-not-bored/domain and
 * reshaping its output, never deciding sets/targets/progression itself.
 */

import {
  buildDefaultStrengthSession,
  EXERCISES,
  recommendProgression,
  type ProgressionRecommendation,
  type StrengthExercise,
  type StrengthSession,
  type StrengthSet,
} from "@buff-not-bored/domain";
import type { CompletedStrengthWorkout, HistoryEntry } from "./types";

export const STRENGTH_WORKOUT_NAME = "Full Body Strength";

/** Today's Classic Strength session — same library/template as Circuit, different session shape. */
export function getTodayStrengthSession(): StrengthSession {
  return buildDefaultStrengthSession(EXERCISES);
}

export interface StrengthSetLogInput {
  actualWeight?: number;
  actualReps?: number;
  actualDuration?: number;
}

function deriveSetCompleted(set: StrengthSet, input: StrengthSetLogInput): boolean {
  if (set.targetReps !== undefined && input.actualReps !== undefined) {
    return input.actualReps >= set.targetReps;
  }
  if (set.targetDuration !== undefined && input.actualDuration !== undefined) {
    return input.actualDuration >= set.targetDuration;
  }
  return true;
}

/** Returns a new StrengthSession with one set's logged performance recorded — immutable update, original session untouched. */
export function logStrengthSet(
  session: StrengthSession,
  exerciseId: string,
  setNumber: number,
  input: StrengthSetLogInput,
): StrengthSession {
  return {
    exercises: session.exercises.map((strengthExercise) => {
      if (strengthExercise.exercise.id !== exerciseId) return strengthExercise;
      return {
        ...strengthExercise,
        sets: strengthExercise.sets.map((set) => {
          if (set.setNumber !== setNumber) return set;
          return { ...set, ...input, completed: deriveSetCompleted(set, input) };
        }),
      };
    }),
  };
}

/** Progression recommendation for one logged set, via the existing progression engine — no second system. */
export function computeProgressionForSet(strengthExercise: StrengthExercise, set: StrengthSet): ProgressionRecommendation {
  return recommendProgression({
    exercise: strengthExercise.exercise,
    prescribedWeight: set.targetWeight,
    prescribedReps: set.targetReps,
    actualWeight: set.actualWeight,
    actualReps: set.actualReps,
    completed: set.completed,
  });
}

export function toHistoryEntry(workout: CompletedStrengthWorkout): HistoryEntry {
  return {
    id: workout.id,
    dateIso: workout.dateIso,
    workoutName: workout.workoutName,
    workoutType: workout.workoutType,
    durationMs: workout.durationMs,
    completedLabel: `${workout.setsCompleted}/${workout.totalSets} sets`,
  };
}

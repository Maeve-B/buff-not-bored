/**
 * The thin application layer for Classic Strength — the same pattern as
 * lib/workout-service.ts (Circuit), talking to @buff-not-bored/domain and
 * reshaping its output, never deciding sets/targets/progression itself.
 */

import {
  applyStartingWeight,
  buildDefaultStrengthSession,
  CLASSIC_EXERCISES,
  prescribeStrengthWeights,
  startingWeightToRecord,
  type CurrentWeights,
  recommendProgression,
  type ProgressionRecommendation,
  type StrengthExercise,
  type StrengthSession,
  type StrengthSet,
} from "@buff-not-bored/domain";
import type { CompletedStrengthWorkout, HistoryEntry } from "./types";

export const STRENGTH_WORKOUT_NAME = "Full Body Strength";

/** Today's Classic Strength session — same library/template as Circuit, different session shape, prescribed your weights. */
export function getTodayStrengthSession(currentWeights: CurrentWeights = {}): StrengthSession {
  return buildDefaultStrengthSession(CLASSIC_EXERCISES, { currentWeights });
}

/** The session re-prescribed from your weights: everything if it hasn't started, only blank weights if it has (§3.3). */
export function prescribeSessionWeights(session: StrengthSession, currentWeights: CurrentWeights, started: boolean): StrengthSession {
  return prescribeStrengthWeights(session, currentWeights, started ? "blanks" : "all");
}

/**
 * After a set is logged: the first-use starting weight to record for that
 * exercise (if any), and the session with its remaining sets filled in.
 */
export function resolveStartingWeight(
  session: StrengthSession,
  exerciseId: string,
  currentWeights: CurrentWeights,
  loggedWeight: number | undefined,
): { weight: number; session: StrengthSession } | undefined {
  const exercise = session.exercises.find((se) => se.exercise.id === exerciseId)?.exercise;
  if (!exercise) return undefined;
  const weight = startingWeightToRecord(exercise, currentWeights, loggedWeight);
  return weight === undefined ? undefined : { weight, session: applyStartingWeight(session, exerciseId, weight) };
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

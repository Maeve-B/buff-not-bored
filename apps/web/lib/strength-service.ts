/**
 * The thin application layer for Classic Strength — the same pattern as
 * lib/workout-service.ts (Circuit), talking to @buff-not-bored/domain and
 * reshaping its output, never deciding sets/targets/progression itself.
 */

import {
  applyStartingWeight,
  buildPresetStrengthSession,
  EXERCISES,
  findPresetSession,
  nextPresetSession,
  PRESET_PROGRAMME_1,
  presetSessionName,
  prescribeStrengthWeights,
  type PresetSession,
  startingWeightToRecord,
  type CurrentWeights,
  type StrengthExercise,
  type StrengthSession,
  type StrengthSet,
} from "@buff-not-bored/domain";
import type { CompletedStrengthWorkout, HistoryEntry } from "./types";

/** Strength runs Preset Programme 1 (spec §10.1, DECISIONS.md D-010). */
export const STRENGTH_PROGRAMME = PRESET_PROGRAMME_1;

/** The programme's session with this id; an unknown id (say, from an older save) falls back to the first. */
export function strengthSessionPlan(sessionId: string): PresetSession {
  return findPresetSession(STRENGTH_PROGRAMME, sessionId) ?? STRENGTH_PROGRAMME.sessions[0]!;
}

/** "Monday · Squat and push". */
export function strengthWorkoutName(sessionId: string): string {
  return presetSessionName(strengthSessionPlan(sessionId));
}

/** The session after this one in the rotation (D-011). */
export function nextStrengthSessionId(sessionId: string | undefined): string {
  return nextPresetSession(STRENGTH_PROGRAMME, sessionId).id;
}

/** One of the programme's sessions, built and prescribed your weights. */
export function buildStrengthSession(sessionId: string, currentWeights: CurrentWeights = {}): StrengthSession {
  return buildPresetStrengthSession(EXERCISES, strengthSessionPlan(sessionId), { currentWeights });
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

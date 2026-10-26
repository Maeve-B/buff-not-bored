/**
 * Converts a `WorkoutSnapshot` (lib/types.ts — a point-in-time view of the
 * current session, built at start/log/complete) into the `LoggedWorkoutInput`
 * DTO `packages/db`'s repository layer expects. Pure, no Prisma/DB import —
 * this file is safe to unit test without a database and safe to import
 * from either side of the server boundary.
 *
 * Circuit's `PlannedExercise` carries only a single `prescribedWeight` (no
 * base/adjustment/final split exists for Circuit today — nothing in this
 * app ever adjusts a Circuit weight), so it maps to a `WeightRecommendation`
 * with no adjustments: base and final both equal the prescription. Classic
 * Strength already *is* a `WeightRecommendation` per exercise, so that maps
 * through directly. Either way the three concepts stay structurally
 * distinct fields, never collapsed into one number.
 */

import type { LoggedSetInput, LoggedWorkoutExerciseInput, LoggedWorkoutInput } from "@buff-not-bored/db";
import { EXERCISES } from "@buff-not-bored/domain";
import type { Exercise, PlannedExercise, StrengthExercise } from "@buff-not-bored/domain";
import type { SetLog, WorkoutSnapshot } from "./types";

function circuitExerciseToLoggedExercise(planned: PlannedExercise, log: SetLog | undefined): LoggedWorkoutExerciseInput {
  const set: LoggedSetInput = {
    setNumber: 1,
    targetReps: planned.prescribedReps,
    repsUnit: planned.repsUnit,
    targetDuration: planned.prescribedDuration,
    targetWeight: planned.prescribedWeight,
    actualWeight: log?.actualWeight,
    actualReps: log?.actualReps,
    actualDuration: log?.actualDuration,
    completed: log?.completed ?? false,
    loggedAt: log ? new Date(log.loggedAt).toISOString() : undefined,
  };

  return {
    exerciseId: planned.exercise.id,
    role: planned.role,
    // No adjustment mechanism exists for Circuit yet — base and final both equal the single prescription.
    baseWeight: planned.prescribedWeight,
    adjustments: [],
    finalWeight: planned.prescribedWeight,
    sets: [set],
  };
}

function strengthExerciseToLoggedExercise(strengthExercise: StrengthExercise): LoggedWorkoutExerciseInput {
  return {
    exerciseId: strengthExercise.exercise.id,
    role: strengthExercise.role,
    restSeconds: strengthExercise.restSeconds,
    baseWeight: strengthExercise.recommendation?.baseWeight,
    adjustments: strengthExercise.recommendation?.adjustments ?? [],
    finalWeight: strengthExercise.recommendation?.finalWeight,
    sets: strengthExercise.sets.map((set) => ({
      setNumber: set.setNumber,
      targetReps: set.targetReps,
      repsUnit: set.repsUnit,
      targetDuration: set.targetDuration,
      targetWeight: set.targetWeight,
      actualWeight: set.actualWeight,
      actualReps: set.actualReps,
      actualDuration: set.actualDuration,
      completed: set.completed,
    })),
  };
}

export function toLoggedWorkoutInput(snapshot: WorkoutSnapshot): LoggedWorkoutInput {
  if (snapshot.workoutType === "circuit") {
    return {
      workoutType: "circuit",
      name: snapshot.workoutName,
      status: snapshot.status,
      dateIso: snapshot.dateIso,
      exercises: snapshot.session.mainExercises.map((planned) =>
        circuitExerciseToLoggedExercise(planned, snapshot.setLogs.find((log) => log.exerciseId === planned.exercise.id)),
      ),
    };
  }

  return {
    workoutType: "classic_strength",
    name: snapshot.workoutName,
    status: snapshot.status,
    dateIso: snapshot.dateIso,
    programmeId: snapshot.programmeId,
    scheduledWorkoutId: snapshot.scheduledWorkoutId,
    exercises: snapshot.session.exercises.map(strengthExerciseToLoggedExercise),
  };
}

const LIBRARY_BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));

/**
 * Every exercise a snapshot references, deduplicated by id, as the catalog
 * entry to save. Library exercises are taken from the current library, not
 * the snapshot's copy: a session restored from before a library change
 * (for example, one held in localStorage) carries an older shape that would
 * fail validation. Exercises the library doesn't know are saved as sent.
 */
export function catalogEntriesFor(snapshot: WorkoutSnapshot): Exercise[] {
  const all =
    snapshot.workoutType === "circuit"
      ? snapshot.session.mainExercises.map((pe) => pe.exercise)
      : snapshot.session.exercises.map((se) => se.exercise);
  return Array.from(new Map(all.map((exercise) => [exercise.id, LIBRARY_BY_ID.get(exercise.id) ?? exercise])).values());
}

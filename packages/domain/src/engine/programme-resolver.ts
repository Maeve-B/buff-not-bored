/**
 * "Given the current programme and today's date, what workout should I do?"
 * — the domain/application-level answer, so this is explicitly NOT React
 * logic (per the brief). Resolves which ScheduledWorkout applies (pure date
 * math, entities/training-programme.ts), then builds the actual Workout by
 * dispatching to the Circuit or Classic Strength builder — both of which
 * read from the same exercise library and template, so which exercises get
 * selected never depends on workout type or programme scheduling.
 */

import type { Exercise } from "../entities/exercise.js";
import {
  resolveCurrentWeekNumber,
  resolveTodaysScheduledWorkout,
  type ScheduledWorkout,
  type TrainingProgramme,
} from "../entities/training-programme.js";
import type { CircuitWorkout, ClassicStrengthWorkout, Workout } from "../entities/workout.js";
import { buildDefaultStrengthSession } from "./strength-builder.js";
import { buildDefaultSession } from "./workout-builder.js";

export class ProgrammeResolverError extends Error {}

/** Builds the concrete Workout for one ScheduledWorkout, dispatching by workoutType — exercise selection is identical either way; only the produced session shape differs. */
export function buildWorkoutForScheduledWorkout(
  scheduled: ScheduledWorkout,
  library: Exercise[],
  todayIso: string,
  programmeContext?: { programmeId: string; weekNumber: number },
): Workout {
  const base = {
    id: `workout-${scheduled.id}-${todayIso}`,
    name: scheduled.name,
    status: "not_started" as const,
    dateIso: todayIso,
    programmeContext: programmeContext
      ? { programmeId: programmeContext.programmeId, weekNumber: programmeContext.weekNumber, scheduledWorkoutId: scheduled.id }
      : undefined,
  };

  switch (scheduled.workoutType) {
    case "circuit":
      return { ...base, workoutType: "circuit", session: buildDefaultSession(library) } satisfies CircuitWorkout;
    case "classic_strength":
      return {
        ...base,
        workoutType: "classic_strength",
        session: buildDefaultStrengthSession(library),
      } satisfies ClassicStrengthWorkout;
    default: {
      const exhaustiveCheck: never = scheduled.workoutType;
      throw new ProgrammeResolverError(`Unhandled workout type: ${String(exhaustiveCheck)}`);
    }
  }
}

/**
 * Resolves and builds today's workout from a programme, or undefined if
 * nothing is scheduled (rest day, or todayIso outside the programme's
 * weeks). `todayIso` is always an explicit argument, never read from the
 * clock internally, so this stays pure and deterministic for a given date.
 */
export function resolveTodaysWorkout(programme: TrainingProgramme, todayIso: string, library: Exercise[]): Workout | undefined {
  const scheduled = resolveTodaysScheduledWorkout(programme, todayIso);
  if (!scheduled) return undefined;
  const weekNumber = resolveCurrentWeekNumber(programme, todayIso);
  return buildWorkoutForScheduledWorkout(scheduled, library, todayIso, { programmeId: programme.id, weekNumber });
}

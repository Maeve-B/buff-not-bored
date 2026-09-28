/**
 * Thin application layer for TrainingProgramme resolution. `todayIso()` is
 * the one place in the UI layer allowed to read the real clock — every
 * domain function it calls takes that date as an explicit argument, so the
 * domain layer itself stays pure and deterministic (see
 * entities/training-programme.ts's doc comment).
 */

import {
  EIGHT_WEEK_STRENGTH_PROGRAMME,
  resolveCurrentWeekNumber,
  resolveTodaysScheduledWorkout,
  TRAINING_PROGRAMMES,
  type ScheduledWorkout,
  type TrainingProgramme,
} from "@buff-not-bored/domain";

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTrainingProgrammes(): TrainingProgramme[] {
  return TRAINING_PROGRAMMES;
}

export interface TodaysProgrammePlan {
  programme: TrainingProgramme;
  weekNumber: number;
  scheduled?: ScheduledWorkout;
}

/** Which programme week a given date falls in, for a specific programme — used by the Programmes list to show every programme's current week, not just the default one. */
export function getCurrentWeekNumberFor(programme: TrainingProgramme, today: string = todayIso()): number {
  return resolveCurrentWeekNumber(programme, today);
}

/** "What's today's plan?" for the Home screen's programme card — resolution only; building the actual Workout happens once the user picks a screen to enter. */
export function getTodaysProgrammePlan(
  programme: TrainingProgramme = EIGHT_WEEK_STRENGTH_PROGRAMME,
  today: string = todayIso(),
): TodaysProgrammePlan {
  return {
    programme,
    weekNumber: resolveCurrentWeekNumber(programme, today),
    scheduled: resolveTodaysScheduledWorkout(programme, today),
  };
}

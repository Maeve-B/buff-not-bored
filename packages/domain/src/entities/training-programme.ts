/**
 * TrainingProgramme: the minimum domain architecture for multi-week plans.
 *
 * Named `TrainingProgramme` (not `Programme`) deliberately — `ProgrammeGroup`/
 * `ProgrammeTemplate`/`ProgrammeAllocation` (entities/programme.ts) already
 * mean something else entirely: the body-area structure of a single Circuit
 * workout ("Legs: 5, Back: 5, ..."), established in Phase 1. A multi-week
 * plan is a different concept at a different level, so it gets a distinct
 * name rather than overloading "Programme" across two unrelated ideas.
 *
 * Programme -> ProgrammeWeek -> ScheduledWorkout, matching the brief's
 * "8 Week Strength / Week 1: Monday, Wednesday / ..." example. A
 * ScheduledWorkout names only a `workoutType` (+ display label) — it does
 * NOT embed a built `Workout`; the actual session is generated on demand
 * (see engine/programme-resolver.ts) from the same exercise library and
 * template every other builder uses, so programme scheduling stays a
 * separate concern from exercise selection, per the brief's layering.
 */

import type { WorkoutType } from "./workout-type.js";

export interface ScheduledWorkout {
  id: string;
  /** ISO weekday: 1 = Monday ... 7 = Sunday. */
  dayOfWeek: number;
  /** Display label, e.g. "Monday" — free text so it doesn't have to be derived/re-localised from dayOfWeek. */
  label: string;
  workoutType: WorkoutType;
  name: string;
}

export interface TrainingProgrammeWeek {
  weekNumber: number;
  workouts: ScheduledWorkout[];
}

export interface TrainingProgramme {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  totalWeeks: number;
  /** The date week 1 begins — resolution below is relative to this, never to "now" internally (todayIso is always passed in explicitly, so resolution stays pure/testable). */
  startDateIso: string;
  weeks: TrainingProgrammeWeek[];
}

const MS_PER_DAY = 86_400_000;

function startOfDayUtc(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** ISO weekday for a date: 1 = Monday ... 7 = Sunday. */
export function isoWeekday(dateIso: string): number {
  const jsDay = new Date(dateIso).getUTCDay(); // 0 = Sunday ... 6 = Saturday
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Which programme week a given date falls in, relative to `startDateIso`.
 * Week 1 covers days 0-6 after the start date, week 2 covers 7-13, etc.
 * Pure — always given `todayIso` explicitly, never reads the clock itself.
 * Returns a week number even past `totalWeeks`/before day 0 — callers
 * (resolveTodaysScheduledWorkout) decide what "out of range" means.
 */
export function resolveCurrentWeekNumber(programme: Pick<TrainingProgramme, "startDateIso">, todayIso: string): number {
  const diffDays = Math.floor((startOfDayUtc(todayIso) - startOfDayUtc(programme.startDateIso)) / MS_PER_DAY);
  return Math.floor(diffDays / 7) + 1;
}

/**
 * "Given the current programme and today's date, what workout should I do?"
 * — the scheduling half of that question (which ScheduledWorkout, if any).
 * Turning that into an actual built Workout is engine/programme-resolver.ts,
 * which needs the exercise library; this stays a pure data lookup.
 */
export function resolveTodaysScheduledWorkout(programme: TrainingProgramme, todayIso: string): ScheduledWorkout | undefined {
  const weekNumber = resolveCurrentWeekNumber(programme, todayIso);
  if (weekNumber < 1 || weekNumber > programme.totalWeeks) return undefined;
  const week = programme.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week) return undefined;
  return week.workouts.find((w) => w.dayOfWeek === isoWeekday(todayIso));
}

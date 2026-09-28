/**
 * A single seeded example TrainingProgramme — "8 Week Strength" — enough to
 * exercise the multi-week architecture end to end (resolveTodaysWorkout,
 * the Programmes screen) without building a programme-authoring product.
 * Every week schedules the same two Classic Strength sessions (Monday,
 * Wednesday), matching the brief's example exactly; a future programme
 * could mix workout types per week without any architecture change.
 *
 * `startDateIso` is set to "today" at the time this was authored so a fresh
 * checkout resolves an actual workout for today out of the box — this is
 * seed/demo data, not meant to represent a real elapsed programme.
 */

import type { ScheduledWorkout, TrainingProgramme, TrainingProgrammeWeek } from "../entities/training-programme.js";

const TOTAL_WEEKS = 8;

function weekWorkouts(weekNumber: number): ScheduledWorkout[] {
  return [
    { id: `w${weekNumber}-mon`, dayOfWeek: 1, label: "Monday", workoutType: "classic_strength", name: "Full Body Strength" },
    { id: `w${weekNumber}-wed`, dayOfWeek: 3, label: "Wednesday", workoutType: "classic_strength", name: "Full Body Strength" },
  ];
}

const WEEKS: TrainingProgrammeWeek[] = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
  const weekNumber = i + 1;
  return { weekNumber, workouts: weekWorkouts(weekNumber) };
});

export const EIGHT_WEEK_STRENGTH_PROGRAMME: TrainingProgramme = {
  id: "8-week-strength",
  name: "8 Week Strength",
  description: "Twice-weekly full-body strength training, classic sets-and-reps style.",
  goal: "Build a strength baseline across all major movement patterns.",
  totalWeeks: TOTAL_WEEKS,
  startDateIso: "2026-09-28",
  weeks: WEEKS,
};

/** Every seeded programme — a Programmes list screen reads from here; adding a second programme is one array entry. */
export const TRAINING_PROGRAMMES: TrainingProgramme[] = [EIGHT_WEEK_STRENGTH_PROGRAMME];

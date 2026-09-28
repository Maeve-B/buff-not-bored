/**
 * Workout: a first-class domain concept, not "a list of exercises". A
 * discriminated union on `workoutType` — Circuit and Classic Strength share
 * one outer envelope (id, name, status, date/session context, optional
 * programme association) but carry genuinely different session content,
 * per `entities/workout-type.ts`'s doc comment. This is the "shared workout
 * concepts with workout-type-specific configuration" the architecture calls
 * for, not two unrelated models: both are members of the same `Workout`
 * union and both flow through the same outer contract (status, completion,
 * programme context) — only `session` differs in shape.
 *
 * `CircuitWorkout.session` is the EXISTING `WorkoutSession` type
 * (entities/workout-session.ts), untouched — every engine that already
 * operates on `WorkoutSession` (workout-builder, refresh-engine,
 * reduction-engine, muscle-coverage, equipment-optimiser) keeps working on
 * it exactly as before, with zero changes. This wrapper is additive.
 */

import type { WorkoutType } from "./workout-type.js";
import type { WorkoutSession } from "./workout-session.js";
import type { StrengthSession } from "./strength.js";

export const WORKOUT_STATUSES = ["not_started", "in_progress", "completed"] as const;
export type WorkoutStatus = (typeof WORKOUT_STATUSES)[number];

/** Present when this Workout was generated from a TrainingProgramme's schedule (entities/training-programme.ts) rather than built ad hoc. */
export interface WorkoutProgrammeContext {
  programmeId: string;
  weekNumber: number;
  scheduledWorkoutId: string;
}

interface WorkoutBase {
  id: string;
  name: string;
  status: WorkoutStatus;
  /** ISO date this workout is/was for — session context, not a precise timestamp log. */
  dateIso: string;
  programmeContext?: WorkoutProgrammeContext;
}

export interface CircuitWorkout extends WorkoutBase {
  workoutType: "circuit";
  session: WorkoutSession;
}

export interface ClassicStrengthWorkout extends WorkoutBase {
  workoutType: "classic_strength";
  session: StrengthSession;
}

export type Workout = CircuitWorkout | ClassicStrengthWorkout;

/** Narrows a Workout to its Circuit variant, or undefined if it's a different type — avoids `as` casts at call sites. */
export function asCircuitWorkout(workout: Workout): CircuitWorkout | undefined {
  return workout.workoutType === "circuit" ? workout : undefined;
}

/** Narrows a Workout to its Classic Strength variant, or undefined if it's a different type. */
export function asClassicStrengthWorkout(workout: Workout): ClassicStrengthWorkout | undefined {
  return workout.workoutType === "classic_strength" ? workout : undefined;
}

export type { WorkoutType };

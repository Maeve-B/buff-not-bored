/**
 * Classic Strength: genuinely different session semantics from Circuit, not
 * the same shape with different styling. Where Circuit's `PlannedExercise`
 * (entities/workout-session.ts) is one exercise = one prescription = one
 * logged attempt, Classic Strength is one exercise = N sets, each with its
 * own target and its own logged outcome, sharing one weight recommendation
 * (base -> adjustments -> final) across the exercise's sets.
 */

import type { Exercise, RepsUnit } from "./exercise.js";
import type { SlotRole } from "./programme.js";
import type { WeightRecommendation } from "./weight-adjustment.js";

/**
 * One working set. `targetReps`/`targetDuration` and `targetWeight` are
 * snapshotted onto the set at build time (same convention as
 * `PlannedExercise` in the Circuit model) — they don't change if the
 * exercise's library data changes later. `actualWeight`/`actualReps` and
 * `completed` are the logged performance — entirely separate from the
 * target, and from the `WeightRecommendation` that produced the target.
 */
export interface StrengthSet {
  setNumber: number;
  targetReps?: number;
  repsUnit?: RepsUnit;
  targetDuration?: number;
  /** Snapshot of the exercise's WeightRecommendation.finalWeight at build time — undefined for bodyweight-only exercises. */
  targetWeight?: number;
  actualWeight?: number;
  actualReps?: number;
  actualDuration?: number;
  completed: boolean;
}

export interface StrengthExercise {
  exercise: Exercise;
  /** "main" counts toward the session's exercise selection; "finisher" mirrors the same distinction Circuit uses, from the same template slot. */
  role: SlotRole;
  sets: StrengthSet[];
  restSeconds?: number;
  /** Absent for bodyweight-only exercises with no weight to recommend. */
  recommendation?: WeightRecommendation;
}

export interface StrengthSession {
  exercises: StrengthExercise[];
}

/** True once every set on every exercise has been logged (regardless of whether each hit its target — that's `completed` per set). */
export function isStrengthSessionFullyLogged(session: StrengthSession): boolean {
  return session.exercises.every((se) => se.sets.every((set) => set.actualReps !== undefined || set.actualDuration !== undefined));
}

/** Total sets across the session that are marked `completed` (hit their target), vs. the total set count. */
export function countCompletedSets(session: StrengthSession): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  for (const se of session.exercises) {
    for (const set of se.sets) {
      total += 1;
      if (set.completed) completed += 1;
    }
  }
  return { completed, total };
}

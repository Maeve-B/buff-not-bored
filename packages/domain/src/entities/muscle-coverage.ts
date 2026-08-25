/**
 * Muscle coverage: the actual physiological muscles an exercise trains,
 * derived strictly from `primaryMuscles` / `secondaryMuscles` — never from
 * `programmeGroup`.
 *
 * This module is the concrete enforcement of spec §3's "important distinction":
 * programme groups and muscle groups are different concepts, and any future
 * optimisation logic (boredom substitution, coverage checks) must use this,
 * not `exercise.programmeGroup`.
 */

import type { Exercise, Muscle } from "./exercise.js";

export type MuscleRole = "primary" | "secondary";

export interface MuscleCoverage {
  muscle: Muscle;
  role: MuscleRole;
}

/** Derives the full muscle coverage of an exercise, primary muscles first. */
export function getMuscleCoverage(exercise: Exercise): MuscleCoverage[] {
  const primary: MuscleCoverage[] = exercise.primaryMuscles.map((muscle) => ({
    muscle,
    role: "primary",
  }));
  const secondary: MuscleCoverage[] = exercise.secondaryMuscles.map((muscle) => ({
    muscle,
    role: "secondary",
  }));
  return [...primary, ...secondary];
}

/** All muscles (primary or secondary) an exercise trains, deduplicated. */
export function getAllMusclesTrained(exercise: Exercise): Muscle[] {
  return Array.from(new Set([...exercise.primaryMuscles, ...exercise.secondaryMuscles]));
}

/** Whether an exercise's primary muscles include the given muscle. */
export function hasPrimaryMuscle(exercise: Exercise, muscle: Muscle): boolean {
  return exercise.primaryMuscles.includes(muscle);
}

/**
 * Aggregate muscle coverage across a set of exercises (e.g. a full session),
 * counting how many exercises train each muscle at each role. Useful for
 * checking a session provides "meaningful training exposure" per spec §3,
 * independent of how those exercises are organised into programme groups.
 */
export function aggregateMuscleCoverage(
  exercises: Exercise[],
): Map<Muscle, { primaryCount: number; secondaryCount: number }> {
  const coverage = new Map<Muscle, { primaryCount: number; secondaryCount: number }>();

  for (const exercise of exercises) {
    for (const { muscle, role } of getMuscleCoverage(exercise)) {
      const entry = coverage.get(muscle) ?? { primaryCount: 0, secondaryCount: 0 };
      if (role === "primary") {
        entry.primaryCount += 1;
      } else {
        entry.secondaryCount += 1;
      }
      coverage.set(muscle, entry);
    }
  }

  return coverage;
}

/**
 * One muscle's coverage across a set of exercises, with enough detail to
 * *explain* an optimisation decision (spec Phase 2 §8) — not just a count,
 * but which specific exercises are responsible for it.
 */
export interface MuscleCoverageEntry {
  muscle: Muscle;
  primaryExposures: number;
  secondaryExposures: number;
  /** Total distinct exercises contributing to this muscle at any role. */
  totalExposures: number;
  primaryExerciseIds: string[];
  secondaryExerciseIds: string[];
}

/**
 * A full coverage report over a set of exercises — the answer to "which
 * muscles are trained, how many exercises contribute to each, and how many
 * of those are primary vs. secondary stimulus".
 *
 * Deliberately takes `Exercise[]`, not a `WorkoutSession` — this is the
 * primitive. A single session's report is `calculateMuscleCoverage(session
 * .mainExercises.filter(pe => pe.role === "main").map(pe => pe.exercise))`;
 * a two-session weekly report is the same call with both sessions'
 * exercises concatenated. No separate "weekly" type is needed — the
 * aggregation already generalises, per the correction's requirement to keep
 * this extensible for future weekly/two-session calculations.
 */
export interface MuscleCoverageReport {
  /** Every muscle trained by at least one exercise, in first-encountered order. */
  musclesTrained: Muscle[];
  entries: Map<Muscle, MuscleCoverageEntry>;
}

/** Builds a full, explainable coverage report over a set of exercises. */
export function calculateMuscleCoverage(exercises: Exercise[]): MuscleCoverageReport {
  const entries = new Map<Muscle, MuscleCoverageEntry>();
  const musclesTrained: Muscle[] = [];

  for (const exercise of exercises) {
    for (const { muscle, role } of getMuscleCoverage(exercise)) {
      let entry = entries.get(muscle);
      if (!entry) {
        entry = {
          muscle,
          primaryExposures: 0,
          secondaryExposures: 0,
          totalExposures: 0,
          primaryExerciseIds: [],
          secondaryExerciseIds: [],
        };
        entries.set(muscle, entry);
        musclesTrained.push(muscle);
      }
      if (role === "primary") {
        entry.primaryExposures += 1;
        entry.primaryExerciseIds.push(exercise.id);
      } else {
        entry.secondaryExposures += 1;
        entry.secondaryExerciseIds.push(exercise.id);
      }
      entry.totalExposures += 1;
    }
  }

  return { musclesTrained, entries };
}

/** Convenience: total exposures (primary + secondary) for one muscle, 0 if untrained. */
export function getExposureCount(report: MuscleCoverageReport, muscle: Muscle): number {
  return report.entries.get(muscle)?.totalExposures ?? 0;
}

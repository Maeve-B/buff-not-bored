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

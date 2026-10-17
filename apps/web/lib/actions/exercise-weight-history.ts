"use server";

/**
 * The app/server boundary for reading an exercise's recorded weight
 * history. Same convention as lib/actions/exercise-capability.ts: this is
 * the ONLY place in apps/web allowed to import `@buff-not-bored/db` for
 * this feature — read-only, no new persistence concern.
 *
 * Merges two independent sources into ONE chronological timeline: weights
 * actually lifted in completed workouts (`getExerciseWeightHistory`) and
 * weights saved manually via the capability form, independent of any
 * workout (`getManualExerciseWeightLog`). Both already return the same
 * origin-agnostic `{ dateIso, weight }` shape, so the display component
 * never needs to know — or care — which source an entry came from.
 */

import { getExerciseWeightHistory, getManualExerciseWeightLog } from "@buff-not-bored/db";
import type { ExerciseWeightHistoryEntry } from "@buff-not-bored/db";

/** Plain code-unit comparison: both the date-only ("2026-10-17") and full-ISO-timestamp strings the two sources produce sort chronologically as-is. */
function byDateIso(a: ExerciseWeightHistoryEntry, b: ExerciseWeightHistoryEntry): number {
  return a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0;
}

export async function loadExerciseWeightHistory(exerciseId: string): Promise<ExerciseWeightHistoryEntry[]> {
  const [workoutEntries, manualEntries] = await Promise.all([
    getExerciseWeightHistory(exerciseId),
    getManualExerciseWeightLog(exerciseId),
  ]);
  return [...workoutEntries, ...manualEntries].sort(byDateIso);
}

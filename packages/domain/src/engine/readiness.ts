/**
 * Readiness to progress (spec v2 §7.4, §6.5, §10.1) — the engine half of
 * the progression nudge. It only reports: whether you're ready, why, and
 * the increment options to choose from. It never changes a weight (§3.3);
 * you adjust your weight yourself (DECISIONS.md D-014).
 *
 * Rule for a rep (or seconds) range — double progression, judged on one
 * session (D-014): every set reached the top of the range, at no less than
 * your current weight (no more than your current assistance). Reps or
 * seconds only, until set feedback exists (D-006).
 */

import { isLoaded, lowerIsProgress } from "../entities/exercise.js";
import { isSetLogged, type StrengthExercise, type StrengthSet } from "../entities/strength.js";
import { buildWeightRecommendation } from "../entities/weight-adjustment.js";

export type Readiness =
  | {
      kind: "ready";
      /** "add_load" offers more weight; "reduce_assistance" offers less assistance. */
      direction: "add_load" | "reduce_assistance";
      /**
       * Jumps in kg from the exercise's real options, smallest first. Empty for
       * unloaded bodyweight work. For assistance, only cuts you still have
       * assistance for (never below zero).
       */
      incrementOptions: number[];
      top: number;
    }
  | {
      kind: "not_yet";
      /**
       * Why not: not every set reached the top; a set was lighter (or more
       * assisted) than your current weight; a set was logged with no weight;
       * or a weighted exercise has no weight yet, so there's nothing to go up from.
       */
      reason: "below_top" | "below_current_weight" | "missing_weight" | "no_weight";
      setsAtTop: number;
      totalSets: number;
      top: number;
      /** Your current weight (or assistance), if the exercise takes one. */
      currentWeight?: number;
    };

function achieved(set: StrengthSet): number | undefined {
  return set.actualReps ?? set.actualDuration;
}

/**
 * Readiness for one exercise in a finished (or in-progress) session, or
 * undefined when there's nothing to judge: no range, or no set logged.
 * Every prescribed set counts, so a set you skipped means "not yet".
 */
export function assessReadiness(strengthExercise: StrengthExercise): Readiness | undefined {
  const { exercise, sets, targetRange } = strengthExercise;
  if (!targetRange || !sets.some(isSetLogged)) return undefined;

  const top = targetRange.max;
  const setsAtTop = sets.filter((set) => (achieved(set) ?? 0) >= top).length;
  const currentWeight = isLoaded(exercise) ? strengthExercise.recommendation?.finalWeight : undefined;

  const assisted = lowerIsProgress(exercise);
  const missingWeight = currentWeight !== undefined && sets.some((set) => set.actualWeight === undefined);
  const belowCurrent =
    currentWeight !== undefined &&
    sets.some((set) => set.actualWeight !== undefined && (assisted ? set.actualWeight > currentWeight : set.actualWeight < currentWeight));

  if (setsAtTop < sets.length) {
    return { kind: "not_yet", reason: "below_top", setsAtTop, totalSets: sets.length, top, currentWeight };
  }
  if (isLoaded(exercise) && currentWeight === undefined) {
    return { kind: "not_yet", reason: "no_weight", setsAtTop, totalSets: sets.length, top };
  }
  if (missingWeight) {
    return { kind: "not_yet", reason: "missing_weight", setsAtTop, totalSets: sets.length, top, currentWeight };
  }
  if (belowCurrent) {
    return { kind: "not_yet", reason: "below_current_weight", setsAtTop, totalSets: sets.length, top, currentWeight };
  }
  return {
    kind: "ready",
    direction: assisted ? "reduce_assistance" : "add_load",
    incrementOptions: assisted
      ? exercise.incrementOptions.filter((jump) => jump <= (currentWeight ?? 0))
      : [...exercise.incrementOptions],
    top,
  };
}

/** What you did on an exercise the last time you logged it: enough to judge readiness again next time. */
export interface LastTimeOnExercise {
  /** The workout it came from, so the one you're in now can be told apart. */
  workoutId: string;
  /** The session's date (YYYY-MM-DD), to tell which of two records is newer. */
  dateIso: string;
  /** Your own weight (or assistance) then, before any session adjustment. */
  weight?: number;
  /** Every prescribed set, logged or not. */
  sets: Array<Pick<StrengthSet, "actualReps" | "actualDuration" | "actualWeight">>;
}

/**
 * "Ready to go up" carried into the next time you do the exercise (§7.4:
 * the nudge belongs at session start). Ready only if last time was ready
 * against today's range, and you haven't changed the weight since: once
 * you've acted on it, there's nothing to say. Only a ready result is
 * returned; it never changes a weight (§3.3).
 */
export function readinessFromLastTime(current: StrengthExercise, last: LastTimeOnExercise): Extract<Readiness, { kind: "ready" }> | undefined {
  const currentWeight = isLoaded(current.exercise) ? current.recommendation?.baseWeight : undefined;
  const lastWeight = isLoaded(current.exercise) ? last.weight : undefined;
  if (currentWeight !== lastWeight) return undefined;

  const then: StrengthExercise = {
    ...current,
    recommendation: lastWeight !== undefined ? buildWeightRecommendation(lastWeight) : undefined,
    sets: last.sets.map((set, i) => ({ ...set, setNumber: i + 1, completed: isSetLogged(set) })),
  };
  const readiness = assessReadiness(then);
  return readiness?.kind === "ready" ? readiness : undefined;
}

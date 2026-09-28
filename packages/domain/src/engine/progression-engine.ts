/**
 * Deterministic progression recommendation (spec §11). Operates on a single
 * logged performance observation and the exercise's own data — critically,
 * `exercise.progressionPercentage`, never a hard-coded global percentage
 * (spec: "progression belongs to the exercise/programme data").
 *
 * When `exercise.needsReview` is true, the exercise's baseline weight/reps
 * are placeholder estimates, not confirmed historical performance (see
 * EXERCISE_AUDIT.md). This module never treats that baseline as trustworthy
 * history — it still computes a recommendation from the actual logged
 * performance handed to it, but caps `confidence` at "low" and says so in
 * the rationale, so nothing downstream mistakes a provisional number for a
 * confirmed one.
 */

import type { Exercise } from "../entities/exercise.js";

export const FEEDBACK_OPTIONS = ["easy", "good", "hard", "too_hard", "failed"] as const;
export type Feedback = (typeof FEEDBACK_OPTIONS)[number];

export const PROGRESSION_RECOMMENDATION_TYPES = ["increase", "maintain", "reduce", "insufficient_data"] as const;
export type ProgressionRecommendationType = (typeof PROGRESSION_RECOMMENDATION_TYPES)[number];

export interface ProgressionInput {
  exercise: Exercise;
  prescribedWeight?: number;
  prescribedReps?: number;
  actualWeight?: number;
  actualReps?: number;
  /** Did they complete the prescribed work at all (distinct from feedback quality)? */
  completed?: boolean;
  feedback?: Feedback;
}

export interface ProgressionRecommendation {
  type: ProgressionRecommendationType;
  /** Only present for "increase"/"reduce" when a base weight and the exercise's progressionPercentage are both available. */
  suggestedWeight?: number;
  rationale: string[];
  confidence: "high" | "low";
}

function roundToNearestHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

type Directive = "increase" | "maintain" | "reduce";

function directiveFromFeedback(
  feedback: Feedback,
  completed: boolean | undefined,
  exceededReps: boolean,
): { directive: Directive; rationale: string } {
  switch (feedback) {
    case "easy":
      return { directive: "increase", rationale: `feedback "easy" -> consider progression (spec §11)` };
    case "good":
      return exceededReps
        ? { directive: "increase", rationale: `feedback "good" and actual reps exceeded prescribed -> cautious progress (spec §11)` }
        : { directive: "maintain", rationale: `feedback "good" -> maintain (spec §11: "maintain or cautiously progress")` };
    case "hard":
      return { directive: "maintain", rationale: `feedback "hard" -> maintain (spec §11)` };
    case "too_hard":
      return completed === false
        ? { directive: "reduce", rationale: `feedback "too_hard" and prescribed work not completed -> reduce (spec §11: "reduce or maintain")` }
        : { directive: "maintain", rationale: `feedback "too_hard" but prescribed work was completed -> maintain (spec §11: "reduce or maintain")` };
    case "failed":
      return { directive: "reduce", rationale: `feedback "failed" -> reduce (spec §11)` };
  }
}

function directiveFromPerformance(
  completed: boolean | undefined,
  actualReps: number | undefined,
  prescribedReps: number | undefined,
): { directive: Directive; rationale: string } {
  if (completed === false) {
    return { directive: "reduce", rationale: "prescribed work was not completed -> reduce" };
  }
  if (actualReps !== undefined && prescribedReps !== undefined) {
    if (actualReps > prescribedReps) {
      return { directive: "increase", rationale: `actual reps (${actualReps}) exceeded prescribed (${prescribedReps}) -> increase` };
    }
    if (actualReps < prescribedReps * 0.7) {
      return {
        directive: "reduce",
        rationale: `actual reps (${actualReps}) fell well short of prescribed (${prescribedReps}) -> reduce`,
      };
    }
    return { directive: "maintain", rationale: `actual reps (${actualReps}) met prescribed (${prescribedReps}) -> maintain` };
  }
  return { directive: "maintain", rationale: "completed with no reps comparison available -> maintain (weak signal)" };
}

/**
 * Recommends a progression action for one logged performance against one
 * exercise's prescription. Deterministic — no randomness, no implicit
 * global progression rate.
 */
export function recommendProgression(input: ProgressionInput): ProgressionRecommendation {
  const { exercise, prescribedWeight, prescribedReps, actualWeight, actualReps, completed, feedback } = input;

  const hasFeedback = feedback !== undefined;
  const hasCompletion = completed !== undefined;
  const hasRepsComparison = actualReps !== undefined && prescribedReps !== undefined;

  if (!hasFeedback && !hasCompletion && !hasRepsComparison) {
    return {
      type: "insufficient_data",
      rationale: ["no performance data provided (feedback, completion, or actual vs. prescribed reps) — cannot recommend progression"],
      confidence: "low",
    };
  }

  const rationale: string[] = [];
  const exceededReps = hasRepsComparison && actualReps! > prescribedReps!;

  let directive: Directive;
  if (hasFeedback) {
    const result = directiveFromFeedback(feedback!, completed, exceededReps);
    directive = result.directive;
    rationale.push(result.rationale);
  } else {
    const result = directiveFromPerformance(completed, actualReps, prescribedReps);
    directive = result.directive;
    rationale.push(result.rationale);
  }

  // Cross-check against reps performance even when feedback drove the primary directive,
  // for transparency — this never overrides the feedback-driven directive, only annotates it.
  if (hasFeedback && hasRepsComparison) {
    rationale.push(
      `performance check: actual reps ${actualReps} vs. prescribed ${prescribedReps} (informational, feedback is the primary signal)`,
    );
  }

  const confidence: "high" | "low" = exercise.needsReview ? "low" : "high";
  if (exercise.needsReview) {
    rationale.push(
      `"${exercise.id}" is flagged needsReview — its baseline weight/reps are placeholder estimates, not confirmed historical performance; treat this recommendation as provisional`,
    );
  }

  let suggestedWeight: number | undefined;
  if (directive !== "maintain") {
    const baseWeight = actualWeight ?? prescribedWeight;
    if (baseWeight === undefined) {
      rationale.push(`no weight data available (this may be a bodyweight/duration exercise) — cannot compute a suggested weight`);
    } else if (exercise.progressionPercentage === undefined) {
      rationale.push(
        `"${exercise.id}" has no progressionPercentage configured — recommending "${directive}" qualitatively, but not fabricating a global default percentage to compute an amount`,
      );
    } else {
      const multiplier = directive === "increase" ? 1 + exercise.progressionPercentage / 100 : 1 - exercise.progressionPercentage / 100;
      suggestedWeight = roundToNearestHalf(baseWeight * multiplier);
      rationale.push(
        `suggested weight: ${baseWeight}kg -> ${suggestedWeight}kg (${directive === "increase" ? "+" : "-"}${exercise.progressionPercentage}%, this exercise's own progression rate)`,
      );
    }
  }

  return { type: directive, suggestedWeight, rationale, confidence };
}

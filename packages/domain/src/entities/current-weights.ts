/**
 * Your current working weight per exercise — user exercise state (spec v2
 * §9.1, §2), kept out of the shared library. Sourced from
 * `ExerciseCapability.weight`; an exercise with no entry has no weight yet
 * and is entered at first use (§10.1, DECISIONS.md D-003).
 *
 * The rule that matters (§3.3): once a weight exists, nothing here changes
 * it. A different weight logged in a session is that session's fact only.
 * The only automatic write is the very first weight, which fills a blank
 * rather than replacing a prescription.
 */

import type { ExerciseCapability } from "./exercise-capability.js";
import { isLoaded, WEIGHT_STEP_KG, type Exercise } from "./exercise.js";
import type { ExerciseCapabilityInput } from "../validation/exercise-capability.schema.js";

/** Exercise id → current weight in kg. A plain record so it can cross the server/client boundary. */
export type CurrentWeights = Readonly<Record<string, number>>;

/** Collects current weights from saved capabilities. Capabilities without a weight contribute nothing. */
export function currentWeightsFromCapabilities(capabilities: ExerciseCapability[]): CurrentWeights {
  const weights: Record<string, number> = {};
  for (const capability of capabilities) {
    if (capability.weight !== undefined) weights[capability.exerciseId] = capability.weight;
  }
  return weights;
}

/**
 * A weight typed by the person, as kg rounded to the 0.25 kg step (D-007),
 * or undefined if it isn't a positive number. Zero, negative, blank and
 * non-numeric entries never become a logged or starting weight.
 */
export function parseEnteredWeight(text: string): number | undefined {
  const value = Number(text);
  if (text.trim() === "" || !Number.isFinite(value) || value <= 0) return undefined;
  const rounded = Math.round(value / WEIGHT_STEP_KG) * WEIGHT_STEP_KG;
  return rounded > 0 ? rounded : undefined;
}

/** The weight to prescribe for an exercise: your current weight if it's loaded and you have one, otherwise none. */
export function currentWeightFor(exercise: Exercise, weights: CurrentWeights): number | undefined {
  return isLoaded(exercise) ? weights[exercise.id] : undefined;
}

/** True when a loaded exercise has no weight yet, so the first logged weight becomes its starting point. */
export function needsStartingWeight(exercise: Exercise, weights: CurrentWeights): boolean {
  return isLoaded(exercise) && weights[exercise.id] === undefined;
}

/**
 * The starting weight to record when a set is logged, or undefined when
 * nothing should be recorded: the exercise is unloaded, already has a
 * weight, or no weight was logged.
 */
export function startingWeightToRecord(
  exercise: Exercise,
  weights: CurrentWeights,
  loggedWeight: number | undefined,
): number | undefined {
  if (loggedWeight === undefined || loggedWeight <= 0) return undefined;
  return needsStartingWeight(exercise, weights) ? loggedWeight : undefined;
}

/**
 * The capability save that records a first-use starting weight, keeping
 * anything else already saved for the exercise (reps, duration, note).
 * Persistence gives the weight-history entry its own note rather than
 * reusing the capability's (see packages/db recordStartingWeight).
 * Returns undefined when the exercise already has a weight: a starting
 * weight never overwrites one (§3.3).
 */
export function startingWeightCapability(
  exerciseId: string,
  existing: ExerciseCapability | undefined,
  weight: number,
): ExerciseCapabilityInput | undefined {
  if (existing?.weight !== undefined) return undefined;
  return {
    exerciseId,
    reps: existing?.reps,
    repsUnit: existing?.repsUnit,
    duration: existing?.duration,
    note: existing?.note,
    weight,
    weightUnit: "kg",
    source: "manual",
  };
}

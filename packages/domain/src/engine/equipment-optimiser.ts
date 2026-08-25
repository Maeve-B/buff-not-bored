/**
 * Equipment/location scoring — one of the core product differentiators
 * (spec §4.2/§13): minimising gym faff. This module is pure scoring and
 * ranking; it never filters out a candidate (that's what HardConstraints
 * are for, in entities/constraints.ts) — it only ever influences ORDER
 * among candidates that already passed hard-constraint filtering.
 *
 * Every score returned here comes with an explanation string, so a caller
 * (refresh-engine, reduction-engine) can report *why* a candidate ranked
 * where it did, per spec Phase 2 §8 (no mysterious single number with no
 * explanation).
 */

import type { SoftPreferences } from "../entities/constraints.js";
import type { Exercise, Equipment, Location } from "../entities/exercise.js";

export interface EquipmentScore {
  /** Higher is better. Not normalised to any fixed range — only meaningful relative to other candidates in the same call. */
  score: number;
  explanation: string[];
}

/**
 * Scores one candidate exercise against the soft equipment/location
 * preferences and (optionally) the exercise it would replace — rewarding
 * alignment with `preferredLocation`/`preferredEquipment` and continuity
 * with the previous exercise's equipment/location/weight.
 */
export function scoreEquipmentAlignment(
  candidate: Exercise,
  soft: SoftPreferences | undefined,
  previousExercise?: Exercise,
): EquipmentScore {
  let score = 0;
  const explanation: string[] = [];

  if (!soft) {
    return { score: 0, explanation: ["no equipment/location preference supplied — neutral score"] };
  }

  if (soft.preferredLocation) {
    if (candidate.location === soft.preferredLocation) {
      score += 2;
      explanation.push(`+2: at preferred location "${soft.preferredLocation}"`);
    } else {
      explanation.push(`+0: not at preferred location "${soft.preferredLocation}" (candidate is "${candidate.location}")`);
    }
  }

  if (soft.preferredEquipment) {
    if (candidate.equipment === soft.preferredEquipment) {
      score += 2;
      explanation.push(`+2: uses preferred equipment "${soft.preferredEquipment}"`);
    } else {
      explanation.push(`+0: doesn't use preferred equipment "${soft.preferredEquipment}" (candidate uses "${candidate.equipment}")`);
    }
  }

  if (previousExercise) {
    if (soft.minimizeEquipmentChanges) {
      if (candidate.equipment === previousExercise.equipment) {
        score += 1;
        explanation.push(`+1: same equipment as the exercise it replaces ("${candidate.equipment}")`);
      } else {
        explanation.push(`+0: equipment change from "${previousExercise.equipment}" to "${candidate.equipment}"`);
      }
    }
    if (soft.minimizeLocationChanges) {
      if (candidate.location === previousExercise.location) {
        score += 1;
        explanation.push(`+1: same location as the exercise it replaces ("${candidate.location}")`);
      } else {
        explanation.push(`+0: location change from "${previousExercise.location}" to "${candidate.location}"`);
      }
    }
    if (soft.minimizeWeightChanges && previousExercise.startingWeight !== undefined && candidate.startingWeight !== undefined) {
      const delta = Math.abs(candidate.startingWeight - previousExercise.startingWeight);
      // Inverse-distance bonus, capped at +1, so small weight changes score close to a full point.
      const weightScore = 1 / (1 + delta);
      score += weightScore;
      explanation.push(
        `+${weightScore.toFixed(2)}: weight change of ${delta}kg from the exercise it replaces (${previousExercise.startingWeight}kg -> ${candidate.startingWeight}kg)`,
      );
    }
  }

  return { score, explanation };
}

/** Counts equipment and location transitions across a sequence of exercises, in order. */
export function countTransitions(sequence: Exercise[]): { equipmentChanges: number; locationChanges: number } {
  let equipmentChanges = 0;
  let locationChanges = 0;
  for (let i = 1; i < sequence.length; i++) {
    const prev = sequence[i - 1]!;
    const curr = sequence[i]!;
    if (prev.equipment !== curr.equipment) equipmentChanges += 1;
    if (prev.location !== curr.location) locationChanges += 1;
  }
  return { equipmentChanges, locationChanges };
}

/**
 * Ranks candidates by equipment/location alignment (highest score first),
 * with a final deterministic tie-break on exercise id so ordering never
 * depends on array/object iteration order.
 */
export function rankByEquipmentAlignment(
  candidates: Exercise[],
  soft: SoftPreferences | undefined,
  previousExercise?: Exercise,
): { exercise: Exercise; score: number; explanation: string[] }[] {
  return candidates
    .map((exercise) => {
      const { score, explanation } = scoreEquipmentAlignment(exercise, soft, previousExercise);
      return { exercise, score, explanation };
    })
    .sort((a, b) => b.score - a.score || a.exercise.id.localeCompare(b.exercise.id));
}

/** Distinct equipment types used across a set of exercises, e.g. for reporting "this workout needs: barbell, dumbbell". */
export function distinctEquipment(exercises: Exercise[]): Equipment[] {
  return Array.from(new Set(exercises.map((e) => e.equipment)));
}

/** Distinct locations used across a set of exercises. */
export function distinctLocations(exercises: Exercise[]): Location[] {
  return Array.from(new Set(exercises.map((e) => e.location)));
}

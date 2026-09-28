/**
 * Weight recommendation adjustments — the general mechanism behind "reduce
 * recommended weight by 20%", designed so future adjustment kinds (use
 * previous weight, cap weight, change rep target, equipment preference,
 * programme-specific modification, temporary user preference, ...) slot in
 * as new union members, never as one-off functions named after what they do
 * (there is deliberately no `reduceWeightBy20Percent()` anywhere).
 *
 * The four concepts this module keeps distinct, per the brief:
 *   1. Base recommendation   — WeightRecommendation.baseWeight, immutable
 *      once set (usually the exercise's startingWeight, or a future
 *      progression-engine suggestion — this module doesn't care which).
 *   2. Adjustment(s)         — WeightRecommendation.adjustments, an ordered
 *      list, applied in sequence, never mutating the base.
 *   3. Final recommendation  — WeightRecommendation.finalWeight, always
 *      DERIVED from base+adjustments (recomputed, not hand-set) so it can
 *      never drift from what the adjustments actually say.
 *   4. Actual logged performance — lives on StrengthSet (entities/strength.ts),
 *      a completely separate record; this module never sees or touches it.
 *
 * Deterministic and explainable: applying the same base + adjustments always
 * yields the same final weight, and every adjustment can be inspected
 * (type, magnitude, optional reason) rather than folded into an opaque number.
 */

export const WEIGHT_ADJUSTMENT_TYPES = ["percentage"] as const;
export type WeightAdjustmentType = (typeof WEIGHT_ADJUSTMENT_TYPES)[number];

/**
 * "+10%", "-20%", etc. `percent` is signed: -20 means reduce by 20%.
 * The only adjustment kind implemented now — the union below is where
 * `use_previous_weight` | `cap_weight` | `rep_target_change` | ... would be
 * added later, each its own variant, without touching this one.
 */
export interface PercentageAdjustment {
  type: "percentage";
  percent: number;
  reason?: string;
}

/** Extend this union, not this file's logic, to add a new adjustment kind. */
export type WeightAdjustment = PercentageAdjustment;

export interface WeightRecommendation {
  baseWeight: number;
  adjustments: WeightAdjustment[];
  /** Derived — see applyWeightAdjustments. Stored for convenient display, but always recomputable from the two fields above. */
  finalWeight: number;
}

function roundToNearestHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function applyOneAdjustment(weight: number, adjustment: WeightAdjustment): number {
  switch (adjustment.type) {
    case "percentage":
      return weight * (1 + adjustment.percent / 100);
    default: {
      const exhaustiveCheck: never = adjustment.type;
      throw new Error(`Unhandled weight adjustment type: ${exhaustiveCheck}`);
    }
  }
}

/** Applies a list of adjustments to a base weight, in order. Pure — same inputs always produce the same output. */
export function applyWeightAdjustments(baseWeight: number, adjustments: WeightAdjustment[]): number {
  const raw = adjustments.reduce((weight, adjustment) => applyOneAdjustment(weight, adjustment), baseWeight);
  return roundToNearestHalf(raw);
}

/** Builds a WeightRecommendation with `finalWeight` derived from `baseWeight`/`adjustments` — never hand-set. */
export function buildWeightRecommendation(baseWeight: number, adjustments: WeightAdjustment[] = []): WeightRecommendation {
  return { baseWeight, adjustments, finalWeight: applyWeightAdjustments(baseWeight, adjustments) };
}

/** Returns a new recommendation with one more adjustment appended — the original is untouched (adjustments are additive, not overwritten). */
export function addWeightAdjustment(recommendation: WeightRecommendation, adjustment: WeightAdjustment): WeightRecommendation {
  return buildWeightRecommendation(recommendation.baseWeight, [...recommendation.adjustments, adjustment]);
}

/** Convenience constructor for the one adjustment kind implemented so far — still just data, not a dedicated "reduce by 20%" function. */
export function percentageAdjustment(percent: number, reason?: string): PercentageAdjustment {
  return { type: "percentage", percent, reason };
}

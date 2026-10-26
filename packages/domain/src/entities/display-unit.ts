/**
 * How weights are shown and entered: kg or lb, one choice everywhere
 * (S-006). Weights are always stored in kg; lb is only ever a view of them,
 * so switching back and forth never changes anything saved.
 *
 * kg moves in 0.25 kg steps (D-007). lb moves in 0.5 lb steps, which are
 * finer than 0.25 kg, so a weight entered in lb is stored to the gram rather
 * than rounded to 0.25 kg: 45.5 lb stays 45.5 lb (DECISIONS.md D-015).
 */

import { WEIGHT_STEP_KG } from "./exercise.js";

export const DISPLAY_UNITS = ["kg", "lb"] as const;
export type DisplayUnit = (typeof DISPLAY_UNITS)[number];

export const KG_PER_LB = 0.45359237;

/** The finest step in lb. */
export const WEIGHT_STEP_LB = 0.5;

/** The jumps offered in lb, whatever the exercise's kg options (S-006, confirmed by Maeve). */
export const LB_INCREMENT_OPTIONS = [0.5, 1, 2.5, 5] as const;

export function isDisplayUnit(value: unknown): value is DisplayUnit {
  return value === "kg" || value === "lb";
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** A stored kg weight as shown in `unit`: kg to the 0.25 kg step, lb to the nearest 0.5 lb. */
export function toDisplayWeight(kg: number, unit: DisplayUnit): number {
  const value = unit === "kg" ? roundTo(kg, WEIGHT_STEP_KG) : roundTo(kg / KG_PER_LB, WEIGHT_STEP_LB);
  return Number(value.toFixed(2));
}

/** A weight in `unit` as kg to store: kg to the 0.25 kg step, lb converted to the gram. */
export function fromDisplayWeight(value: number, unit: DisplayUnit): number {
  if (unit === "kg") return roundTo(value, WEIGHT_STEP_KG);
  return Number((roundTo(value, WEIGHT_STEP_LB) * KG_PER_LB).toFixed(3));
}

/**
 * A weight typed in `unit`, as kg, or undefined if it isn't a positive
 * number. When it reads the same as `knownKg` does in this unit (say, a
 * pre-filled target left as it was), that exact kg is kept, so showing a
 * weight in lb and logging it back never shifts it by a rounding step.
 */
export function parseDisplayedWeight(text: string, unit: DisplayUnit, knownKg?: number): number | undefined {
  const value = Number(text);
  if (text.trim() === "" || !Number.isFinite(value) || value <= 0) return undefined;
  if (knownKg !== undefined && toDisplayWeight(knownKg, unit) === toDisplayWeight(fromDisplayWeight(value, unit), unit)) return knownKg;
  const kg = fromDisplayWeight(value, unit);
  return kg > 0 ? kg : undefined;
}

/** The step a typed weight box moves in. */
export function displayWeightStep(unit: DisplayUnit): number {
  return unit === "kg" ? WEIGHT_STEP_KG : WEIGHT_STEP_LB;
}

/** Circuit's +/− tap size: 2.5 kg / 0.5 kg (D-007), or 5 lb / 1 lb, for a barbell or anything else. */
export function tapWeightStep(barbell: boolean, unit: DisplayUnit): number {
  if (unit === "lb") return barbell ? 5 : 1;
  return barbell ? 2.5 : 0.5;
}

/**
 * The increment options to offer, in `unit`. In kg, the exercise's real
 * jumps; in lb, the standard lb jumps. For assistance, never more than you
 * have (`limitKg`).
 */
export function incrementOptionsIn(unit: DisplayUnit, kgOptions: readonly number[], limitKg?: number): number[] {
  if (kgOptions.length === 0) return [];
  if (unit === "kg") return [...kgOptions];
  const limit = limitKg !== undefined ? toDisplayWeight(limitKg, "lb") : Infinity;
  return LB_INCREMENT_OPTIONS.filter((jump) => jump <= limit);
}

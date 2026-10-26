import { describe, expect, it } from "vitest";
import { buildWeightRecommendation } from "../src/entities/weight-adjustment.js";
import {
  fromDisplayWeight,
  incrementOptionsIn,
  isDisplayUnit,
  parseDisplayedWeight,
  tapWeightStep,
  toDisplayWeight,
} from "../src/entities/display-unit.js";

describe("kg or lb (S-006): stored in kg, shown in your unit", () => {
  it("shows kg as stored, in 0.25 kg steps", () => {
    expect(toDisplayWeight(20.25, "kg")).toBe(20.25);
    expect(fromDisplayWeight(20.25, "kg")).toBe(20.25);
  });

  it("shows lb to the nearest 0.5 lb", () => {
    expect(toDisplayWeight(20, "lb")).toBe(44);
    expect(toDisplayWeight(20.25, "lb")).toBe(44.5);
    expect(toDisplayWeight(40, "lb")).toBe(88);
  });

  it("keeps a weight entered in lb exactly as entered, every 0.5 lb (D-015)", () => {
    for (let lb = 0.5; lb <= 400; lb += 0.5) {
      expect(toDisplayWeight(fromDisplayWeight(lb, "lb"), "lb")).toBe(lb);
    }
  });

  it("never changes a saved weight by showing it in lb and logging it back", () => {
    for (const kg of [10, 20.25, 37.5, 42.75, 100]) {
      const shown = String(toDisplayWeight(kg, "lb"));
      expect(parseDisplayedWeight(shown, "lb", kg)).toBe(kg);
    }
  });

  it("converts a different lb entry rather than keeping the known weight", () => {
    expect(parseDisplayedWeight("50", "lb", 20)).toBeCloseTo(22.68, 2);
  });

  it("rejects blank, zero, negative and non-numeric entries", () => {
    for (const text of ["", "0", "-5", "abc"]) expect(parseDisplayedWeight(text, "lb")).toBeUndefined();
  });

  it("switching back to kg shows the same kg as before", () => {
    expect(toDisplayWeight(20.25, "kg")).toBe(20.25);
    expect(toDisplayWeight(fromDisplayWeight(44.5, "lb"), "kg")).toBe(20.25);
  });

  it("offers the lb jumps in lb, the exercise's jumps in kg, and never more assistance than you have", () => {
    expect(incrementOptionsIn("kg", [0.25, 0.5, 1, 2.5, 5])).toEqual([0.25, 0.5, 1, 2.5, 5]);
    expect(incrementOptionsIn("lb", [0.25, 0.5, 1, 2.5, 5])).toEqual([0.5, 1, 2.5, 5]);
    expect(incrementOptionsIn("lb", [0.25, 0.5, 1, 2.5, 5], 1)).toEqual([0.5, 1]); // 1 kg of assistance is about 2 lb
    expect(incrementOptionsIn("lb", [])).toEqual([]);
  });

  it("recognises the two units", () => {
    expect(isDisplayUnit("lb")).toBe(true);
    expect(isDisplayUnit("stone")).toBe(false);
  });

  it("prescribes a weight entered in lb exactly, without rounding it to 0.25 kg", () => {
    const kg = fromDisplayWeight(88, "lb");
    expect(buildWeightRecommendation(kg).finalWeight).toBe(kg);
    expect(toDisplayWeight(buildWeightRecommendation(kg).finalWeight, "lb")).toBe(88);
  });

  it("taps Circuit's weight by about the same amount in either unit", () => {
    expect([tapWeightStep(true, "kg"), tapWeightStep(false, "kg")]).toEqual([2.5, 0.5]);
    expect([tapWeightStep(true, "lb"), tapWeightStep(false, "lb")]).toEqual([5, 1]);
  });
});

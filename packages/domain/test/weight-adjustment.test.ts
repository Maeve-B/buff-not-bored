import { describe, expect, it } from "vitest";
import {
  addWeightAdjustment,
  applyWeightAdjustments,
  buildWeightRecommendation,
  percentageAdjustment,
} from "../src/entities/weight-adjustment.js";

describe("weight adjustments", () => {
  it("base recommendation remains unchanged after an adjustment is applied", () => {
    const rec = buildWeightRecommendation(32.5, [percentageAdjustment(-20)]);
    expect(rec.baseWeight).toBe(32.5);
  });

  it("-20% adjustment produces the correct adjusted recommendation", () => {
    const rec = buildWeightRecommendation(32.5, [percentageAdjustment(-20)]);
    // 32.5 * 0.8 = 26 exactly
    expect(rec.finalWeight).toBe(26);
  });

  it("final recommendation is calculated deterministically", () => {
    const a = buildWeightRecommendation(32.5, [percentageAdjustment(-20)]);
    const b = buildWeightRecommendation(32.5, [percentageAdjustment(-20)]);
    expect(a.finalWeight).toBe(b.finalWeight);
  });

  it("+10% increases the base weight", () => {
    const rec = buildWeightRecommendation(30, [percentageAdjustment(10)]);
    expect(rec.finalWeight).toBe(33);
  });

  it("with no adjustments, final equals base", () => {
    const rec = buildWeightRecommendation(30);
    expect(rec.finalWeight).toBe(30);
    expect(rec.adjustments).toEqual([]);
  });

  it("multiple adjustments are represented as a list, applied in order, without overwriting the base", () => {
    const rec = buildWeightRecommendation(100, [percentageAdjustment(10), percentageAdjustment(-20)]);
    expect(rec.baseWeight).toBe(100);
    expect(rec.adjustments).toHaveLength(2);
    // 100 * 1.10 = 110, then 110 * 0.80 = 88
    expect(rec.finalWeight).toBe(88);
  });

  it("addWeightAdjustment appends without mutating the original recommendation", () => {
    const original = buildWeightRecommendation(32.5, [percentageAdjustment(-20)]);
    const withSecond = addWeightAdjustment(original, percentageAdjustment(10));

    // Original untouched.
    expect(original.adjustments).toHaveLength(1);
    expect(original.finalWeight).toBe(26);

    // New recommendation has both adjustments, base still unchanged.
    expect(withSecond.baseWeight).toBe(32.5);
    expect(withSecond.adjustments).toHaveLength(2);
    // 32.5 * 0.8 = 26, then 26 * 1.10 = 28.6
    expect(withSecond.finalWeight).toBe(28.5); // rounded to nearest 0.5
  });

  it("applyWeightAdjustments is a pure function usable standalone", () => {
    expect(applyWeightAdjustments(50, [percentageAdjustment(-20)])).toBe(40);
    expect(applyWeightAdjustments(50, [])).toBe(50);
  });

  it("carries an optional human-readable reason without affecting the math", () => {
    const rec = buildWeightRecommendation(30, [percentageAdjustment(-20, "felt too heavy last session")]);
    expect(rec.adjustments[0]?.reason).toBe("felt too heavy last session");
    expect(rec.finalWeight).toBe(24);
  });
});

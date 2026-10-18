import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import {
  currentWeightFor,
  currentWeightsFromCapabilities,
  needsStartingWeight,
  parseEnteredWeight,
  startingWeightCapability,
  startingWeightToRecord,
} from "../src/entities/current-weights.js";
import type { ExerciseCapability } from "../src/entities/exercise-capability.js";
import { isLoaded } from "../src/entities/exercise.js";

const squats = EXERCISES.find((e) => e.id === "squats")!;
const plank = EXERCISES.find((e) => e.id === "plank")!;

const capability = (overrides: Partial<ExerciseCapability>): ExerciseCapability => ({
  exerciseId: "squats",
  source: "manual",
  updatedAt: "2026-10-18T10:00:00.000Z",
  ...overrides,
});

describe("isLoaded", () => {
  it("treats every load type except unloaded bodyweight as taking a weight", () => {
    expect(isLoaded(squats)).toBe(true);
    expect(isLoaded(plank)).toBe(false);
    expect(isLoaded({ loadType: "assisted_machine" })).toBe(true);
  });
});

describe("currentWeightsFromCapabilities", () => {
  it("keeps only capabilities that have a weight", () => {
    const weights = currentWeightsFromCapabilities([
      capability({ exerciseId: "squats", weight: 40, weightUnit: "kg" }),
      capability({ exerciseId: "plank", duration: 60 }),
    ]);
    expect(weights).toEqual({ squats: 40 });
  });
});

describe("currentWeightFor / needsStartingWeight", () => {
  it("returns your weight for a loaded exercise, and nothing before you've set one", () => {
    expect(currentWeightFor(squats, { squats: 40 })).toBe(40);
    expect(currentWeightFor(squats, {})).toBeUndefined();
    expect(needsStartingWeight(squats, {})).toBe(true);
    expect(needsStartingWeight(squats, { squats: 40 })).toBe(false);
  });

  it("never asks for a weight on an unloaded bodyweight exercise", () => {
    expect(needsStartingWeight(plank, {})).toBe(false);
    expect(currentWeightFor(plank, { plank: 5 })).toBeUndefined();
  });
});

describe("startingWeightToRecord", () => {
  it("records the first weight logged for a blank loaded exercise", () => {
    expect(startingWeightToRecord(squats, {}, 20.25)).toBe(20.25);
  });

  it("records nothing once a weight exists, so a different lift never changes it (§3.3)", () => {
    expect(startingWeightToRecord(squats, { squats: 40 }, 45)).toBeUndefined();
  });

  it("records nothing without a positive logged weight, or for bodyweight work", () => {
    expect(startingWeightToRecord(squats, {}, undefined)).toBeUndefined();
    expect(startingWeightToRecord(squats, {}, 0)).toBeUndefined();
    expect(startingWeightToRecord(plank, {}, 10)).toBeUndefined();
  });
});

describe("startingWeightCapability", () => {
  it("creates a manual kg capability when nothing is saved", () => {
    expect(startingWeightCapability("squats", undefined, 20)).toEqual({
      exerciseId: "squats",
      weight: 20,
      weightUnit: "kg",
      source: "manual",
      reps: undefined,
      repsUnit: undefined,
      duration: undefined,
      note: undefined,
    });
  });

  it("keeps reps, duration and note already saved for the exercise", () => {
    const existing = capability({ reps: 5, repsUnit: "reps", note: "felt solid" });
    expect(startingWeightCapability("squats", existing, 20)).toMatchObject({ weight: 20, reps: 5, repsUnit: "reps", note: "felt solid" });
  });

  it("never overwrites a saved weight", () => {
    expect(startingWeightCapability("squats", capability({ weight: 40, weightUnit: "kg" }), 20)).toBeUndefined();
  });
});

describe("parseEnteredWeight", () => {
  it("accepts positive weights, rounded to the 0.25 kg step", () => {
    expect(parseEnteredWeight("20.25")).toBe(20.25);
    expect(parseEnteredWeight("20.3")).toBe(20.25);
    expect(parseEnteredWeight(" 40 ")).toBe(40);
  });

  it("rejects blank, zero, negative and non-numeric entries", () => {
    for (const text of ["", "  ", "0", "-5", "abc", "0.1"]) {
      expect(parseEnteredWeight(text), JSON.stringify(text)).toBeUndefined();
    }
  });
});

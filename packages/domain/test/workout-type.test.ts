import { describe, expect, it } from "vitest";
import { WORKOUT_TYPES, WORKOUT_TYPE_LABELS } from "../src/entities/workout-type.js";

describe("WorkoutType", () => {
  it("supports circuit and classic_strength", () => {
    expect(WORKOUT_TYPES).toContain("circuit");
    expect(WORKOUT_TYPES).toContain("classic_strength");
  });

  it("has a human label for every workout type", () => {
    for (const type of WORKOUT_TYPES) {
      expect(WORKOUT_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});

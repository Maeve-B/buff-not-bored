import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { recommendProgression } from "../src/engine/progression-engine.js";

const squats = EXERCISES.find((e) => e.id === "squats")!; // 20kg, 20 reps, 5% progression, needsReview undefined
const lunges = EXERCISES.find((e) => e.id === "lunges")!; // needsReview: true
const pushUps = EXERCISES.find((e) => e.id === "push-ups")!; // bodyweight, no startingWeight, no progressionPercentage

describe("recommendProgression — successful performance", () => {
  it("recommends increase on 'easy' feedback", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 20,
      completed: true,
      feedback: "easy",
    });
    expect(result.type).toBe("increase");
    expect(result.suggestedWeight).toBe(21); // 20 * 1.05 = 21
    expect(result.confidence).toBe("high");
  });

  it("recommends increase when reps clearly exceed prescribed, even without feedback", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 25,
      completed: true,
    });
    expect(result.type).toBe("increase");
  });
});

describe("recommendProgression — borderline performance maintains weight", () => {
  it("recommends maintain on 'hard' feedback", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 18,
      completed: true,
      feedback: "hard",
    });
    expect(result.type).toBe("maintain");
    expect(result.suggestedWeight).toBeUndefined();
  });

  it("recommends maintain on 'good' feedback without a clear excess", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 20,
      completed: true,
      feedback: "good",
    });
    expect(result.type).toBe("maintain");
  });

  it("recommends maintain when actual reps roughly meet prescribed with no feedback", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 19,
      completed: true,
    });
    expect(result.type).toBe("maintain");
  });
});

describe("recommendProgression — poor performance recommends reduction", () => {
  it("recommends reduce on 'failed' feedback", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 10,
      completed: false,
      feedback: "failed",
    });
    expect(result.type).toBe("reduce");
    expect(result.suggestedWeight).toBe(19); // 20 * 0.95 = 19
  });

  it("recommends reduce on 'too_hard' feedback when the work wasn't completed", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 12,
      completed: false,
      feedback: "too_hard",
    });
    expect(result.type).toBe("reduce");
  });

  it("maintains on 'too_hard' if the prescribed work was still completed", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 20,
      completed: true,
      feedback: "too_hard",
    });
    expect(result.type).toBe("maintain");
  });

  it("recommends reduce when reps fall well short of prescribed with no feedback", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 8, // well under 70% of 20
      completed: true,
    });
    expect(result.type).toBe("reduce");
  });
});

describe("recommendProgression — missing data", () => {
  it("returns insufficient_data when nothing at all is supplied", () => {
    const result = recommendProgression({ exercise: squats });
    expect(result.type).toBe("insufficient_data");
    expect(result.confidence).toBe("low");
  });
});

describe("recommendProgression — exercise-specific progression percentage", () => {
  it("uses the exercise's own progressionPercentage, not a hard-coded global rate", () => {
    const flatDbPress = EXERCISES.find((e) => e.id === "flat-db-press")!; // 2.5%, 8kg
    const result = recommendProgression({
      exercise: flatDbPress,
      prescribedWeight: 8,
      prescribedReps: 20,
      actualWeight: 8,
      actualReps: 20,
      completed: true,
      feedback: "easy",
    });
    expect(result.type).toBe("increase");
    expect(result.suggestedWeight).toBe(8); // 8 * 1.025 = 8.2, rounded to the nearest 0.5 -> 8
  });

  it("recommends increase qualitatively but no suggestedWeight when there's no weight data at all (bodyweight exercise)", () => {
    const result = recommendProgression({
      exercise: pushUps,
      prescribedReps: 15,
      actualReps: 20,
      completed: true,
      feedback: "easy",
    });
    expect(result.type).toBe("increase");
    expect(result.suggestedWeight).toBeUndefined();
    expect(result.rationale.some((line) => line.includes("no weight data available"))).toBe(true);
  });

  it("recommends increase qualitatively but no suggestedWeight when the exercise has weight but no progressionPercentage", () => {
    const noProgressionPercentExercise = { ...squats, id: "no-progression-percent-test", progressionPercentage: undefined };
    const result = recommendProgression({
      exercise: noProgressionPercentExercise,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 20,
      actualReps: 20,
      completed: true,
      feedback: "easy",
    });
    expect(result.type).toBe("increase");
    expect(result.suggestedWeight).toBeUndefined();
    expect(result.rationale.some((line) => line.includes("no progressionPercentage"))).toBe(true);
  });

  it("flags low confidence and a provisional-data warning for a needsReview exercise", () => {
    const result = recommendProgression({
      exercise: lunges,
      prescribedWeight: 20,
      prescribedReps: 16,
      actualWeight: 20,
      actualReps: 16,
      completed: true,
      feedback: "easy",
    });
    expect(result.confidence).toBe("low");
    expect(result.rationale.some((line) => line.includes("needsReview"))).toBe(true);
    // Still computes a real recommendation — needsReview lowers confidence, doesn't block the call.
    expect(result.type).toBe("increase");
  });

  it("bases the suggested weight on actualWeight, not prescribedWeight, when they differ", () => {
    const result = recommendProgression({
      exercise: squats,
      prescribedWeight: 20,
      prescribedReps: 20,
      actualWeight: 22.5, // the user had already self-adjusted up
      actualReps: 20,
      completed: true,
      feedback: "easy",
    });
    expect(result.suggestedWeight).toBe(23.5); // 22.5 * 1.05 = 23.625 -> rounded to nearest 0.5
  });
});

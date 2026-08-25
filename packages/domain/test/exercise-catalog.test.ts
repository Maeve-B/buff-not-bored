import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { validateCatalog } from "../src/validation/exercise.schema.js";

describe("exercise library", () => {
  it("contains all exercises from the current template plus library-only alternates", () => {
    // 24 from the original spec + 9 introduced by the PROGRAMME MODEL CORRECTION
    // (Lunges, Flat Bench Press, Bench Flyes, Bent-Over Row, Single-Arm Dumbbell Row,
    // Good Mornings, Close-Grip Bench Press, Barbell Curl, Upright Row).
    expect(EXERCISES).toHaveLength(33);
  });

  it("has unique ids", () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("passes structural validation", () => {
    expect(() => validateCatalog(EXERCISES)).not.toThrow();
  });

  it("distinguishes programme group from muscle group for the Bulgarian Split Squat (spec §3)", () => {
    const bss = EXERCISES.find((e) => e.id === "bulgarian-split-squat");
    expect(bss).toBeDefined();

    // Corrected: grouped under legs, matching its actual physiology — no cross-group special case.
    expect(bss?.programmeGroup).toBe("legs");
    expect(bss?.primaryMuscles).toEqual(["glutes", "quadriceps"]);
    expect(bss?.secondaryMuscles).toEqual(["hamstrings", "adductors"]);
    expect(bss?.primaryMuscles).not.toContain("chest");
    expect(bss?.secondaryMuscles).not.toContain("chest");
  });

  it("classifies Bent-Over Row per the user-confirmed muscle breakdown", () => {
    const bentOverRow = EXERCISES.find((e) => e.id === "bent-over-row");
    expect(bentOverRow?.primaryMuscles).toEqual(["lats"]);
    expect(bentOverRow?.secondaryMuscles).toEqual(["upper_back", "biceps"]);
  });

  it("has at least one active exercise per programme group", () => {
    const groups = ["legs", "back", "chest", "triceps", "shoulders", "biceps", "core"] as const;
    for (const group of groups) {
      const found = EXERCISES.some((e) => e.programmeGroup === group && e.active);
      expect(found, `expected an active exercise for group "${group}"`).toBe(true);
    }
  });

  it("flags newly-introduced exercises with placeholder data as needing review", () => {
    const newExerciseIds = [
      "lunges",
      "flat-bench-press",
      "bench-flyes",
      "bent-over-row",
      "single-arm-dumbbell-row",
      "good-mornings",
      "close-grip-bench-press",
      "barbell-curl",
      "upright-row",
    ];
    for (const id of newExerciseIds) {
      const exercise = EXERCISES.find((e) => e.id === id);
      expect(exercise, `expected exercise "${id}" to exist`).toBeDefined();
      expect(exercise?.needsReview, `expected "${id}" to be flagged needsReview`).toBe(true);
    }
  });

  it("keeps exercises no longer in the current template as active library alternates", () => {
    const retainedAlternates = [
      "rdl-upright-row",
      "incline-db-press",
      "front-raises",
      "concentration-curl",
      "close-grip-push-ups",
    ];
    for (const id of retainedAlternates) {
      const exercise = EXERCISES.find((e) => e.id === id);
      expect(exercise, `expected alternate "${id}" to still exist in the library`).toBeDefined();
      expect(exercise?.active).toBe(true);
    }
  });
});

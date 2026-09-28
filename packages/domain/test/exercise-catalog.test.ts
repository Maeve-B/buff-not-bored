import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { MUSCLES } from "../src/entities/exercise.js";
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
    expect(bss?.primaryMuscles).toEqual(["glutes", "quads"]);
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

describe("muscle taxonomy correction", () => {
  it("retires the generic 'back' and 'shoulders' muscle values in favour of specific ones", () => {
    expect(MUSCLES).not.toContain("back");
    expect(MUSCLES).not.toContain("shoulders");
  });

  it("includes 'trapezius' and 'quads' (renamed from 'quadriceps')", () => {
    expect(MUSCLES).toContain("trapezius");
    expect(MUSCLES).toContain("quads");
    expect(MUSCLES).not.toContain("quadriceps");
  });

  it("no exercise in the library uses a retired muscle value", () => {
    const retired = new Set(["back", "shoulders", "quadriceps"]);
    for (const exercise of EXERCISES) {
      for (const muscle of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) {
        expect(retired.has(muscle), `exercise "${exercise.id}" uses retired muscle value "${muscle}"`).toBe(false);
      }
    }
  });

  it("classifies Upright Row per the user-confirmed breakdown", () => {
    const uprightRow = EXERCISES.find((e) => e.id === "upright-row");
    expect(uprightRow?.primaryMuscles).toEqual(["lateral_deltoids", "trapezius"]);
    expect(uprightRow?.secondaryMuscles).toEqual(["biceps", "upper_back"]);
  });

  it("classifies Close-Grip Bench Press per the user-confirmed breakdown", () => {
    const closeGripBenchPress = EXERCISES.find((e) => e.id === "close-grip-bench-press");
    expect(closeGripBenchPress?.primaryMuscles).toEqual(["triceps", "chest"]);
    expect(closeGripBenchPress?.secondaryMuscles).toEqual(["anterior_deltoids"]);
  });

  it("classifies Flat Bench Press and Bench Flyes per the user-confirmed breakdown", () => {
    const flatBenchPress = EXERCISES.find((e) => e.id === "flat-bench-press");
    expect(flatBenchPress?.primaryMuscles).toEqual(["chest"]);
    expect(flatBenchPress?.secondaryMuscles).toEqual(["triceps", "anterior_deltoids"]);

    const benchFlyes = EXERCISES.find((e) => e.id === "bench-flyes");
    expect(benchFlyes?.primaryMuscles).toEqual(["chest"]);
    expect(benchFlyes?.secondaryMuscles).toEqual(["anterior_deltoids"]);
  });

  it("classifies Lunges, Single-Arm Dumbbell Row, and Good Mornings per the user-confirmed breakdown", () => {
    const lunges = EXERCISES.find((e) => e.id === "lunges");
    expect(lunges?.primaryMuscles).toEqual(["quads", "glutes"]);
    expect(lunges?.secondaryMuscles).toEqual(["hamstrings", "adductors"]);

    const singleArmRow = EXERCISES.find((e) => e.id === "single-arm-dumbbell-row");
    expect(singleArmRow?.primaryMuscles).toEqual(["lats"]);
    expect(singleArmRow?.secondaryMuscles).toEqual(["upper_back", "biceps"]);

    const goodMornings = EXERCISES.find((e) => e.id === "good-mornings");
    expect(goodMornings?.primaryMuscles).toEqual(["hamstrings", "glutes"]);
    expect(goodMornings?.secondaryMuscles).toEqual(["spinal_erectors"]);
  });

  it("reclassifies Overhead Press away from the retired generic 'shoulders' value and flags it for review", () => {
    // Not explicitly given by the user — a necessary consequence of retiring "shoulders".
    const overheadPress = EXERCISES.find((e) => e.id === "overhead-press");
    expect(overheadPress?.primaryMuscles).toEqual(["anterior_deltoids"]);
    expect(overheadPress?.secondaryMuscles).toEqual(["lateral_deltoids", "triceps"]);
    expect(overheadPress?.needsReview).toBe(true);
  });
});

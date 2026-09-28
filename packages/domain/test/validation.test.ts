import { describe, expect, it } from "vitest";
import type { Exercise } from "../src/entities/exercise.js";
import { CatalogValidationError, exerciseSchema, validateCatalog } from "../src/validation/exercise.schema.js";

const validExercise: Exercise = {
  id: "test-exercise",
  name: "Test Exercise",
  programmeGroup: "core",
  primaryMuscles: ["abdominals"],
  secondaryMuscles: [],
  movementPatterns: ["flexion"],
  exerciseType: "core",
  equipment: "bodyweight",
  location: "floor",
  prescribedReps: 10,
  repsUnit: "reps",
  active: true,
};

describe("exerciseSchema", () => {
  it("accepts a well-formed exercise", () => {
    expect(exerciseSchema.safeParse(validExercise).success).toBe(true);
  });

  it("rejects an exercise with no primary muscles", () => {
    const result = exerciseSchema.safeParse({ ...validExercise, primaryMuscles: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an exercise with neither prescribedReps nor prescribedDuration", () => {
    const { prescribedReps, repsUnit, ...rest } = validExercise;
    const result = exerciseSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an exercise with both prescribedReps and prescribedDuration", () => {
    const result = exerciseSchema.safeParse({ ...validExercise, prescribedDuration: 30 });
    expect(result.success).toBe(false);
  });

  it("rejects startingWeight without weightUnit", () => {
    const result = exerciseSchema.safeParse({ ...validExercise, startingWeight: 10 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid programmeGroup", () => {
    const result = exerciseSchema.safeParse({ ...validExercise, programmeGroup: "arms" });
    expect(result.success).toBe(false);
  });
});

describe("validateCatalog", () => {
  it("passes for a valid catalog", () => {
    expect(() => validateCatalog([validExercise])).not.toThrow();
  });

  it("throws CatalogValidationError on a duplicate id", () => {
    expect(() => validateCatalog([validExercise, validExercise])).toThrow(CatalogValidationError);
  });

  it("throws CatalogValidationError collecting issues from an invalid exercise", () => {
    const invalid = { ...validExercise, primaryMuscles: [] };
    try {
      validateCatalog([invalid]);
      expect.unreachable("expected validateCatalog to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).issues.length).toBeGreaterThan(0);
    }
  });
});

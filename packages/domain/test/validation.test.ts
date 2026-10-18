import { EXERCISE_PROFILES } from "../src/data/exercise-profiles.js";
import { describe, expect, it } from "vitest";
import type { Exercise } from "../src/entities/exercise.js";
import { CatalogValidationError, exerciseSchema, validateCatalog } from "../src/validation/exercise.schema.js";

const validExercise: Exercise = {
  ...EXERCISE_PROFILES.plank,
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

describe("exerciseSchema — library v2 profile (§9.1)", () => {
  const loaded: Exercise = { ...validExercise, loadType: "dumbbell_pair", incrementOptions: [1, 2, 2.5] };

  it("accepts a loaded exercise with ascending increments", () => {
    expect(exerciseSchema.safeParse(loaded).success).toBe(true);
  });

  it("rejects a movement pattern outside the §9.1 list", () => {
    expect(exerciseSchema.safeParse({ ...validExercise, movementPattern: "flexion" }).success).toBe(false);
  });

  it("rejects perSide on an exercise that isn't unilateral", () => {
    expect(exerciseSchema.safeParse({ ...validExercise, unilateral: false, perSide: true }).success).toBe(false);
  });

  it("requires perSide to agree with a per_side repsUnit", () => {
    const unilateral = { ...validExercise, unilateral: true };
    expect(exerciseSchema.safeParse({ ...unilateral, repsUnit: "per_side", perSide: false }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...unilateral, repsUnit: "reps", perSide: true }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...unilateral, repsUnit: "per_side", perSide: true }).success).toBe(true);
  });

  it("requires an assisted machine to progress by reducing assistance", () => {
    const assisted = { ...loaded, loadType: "assisted_machine" as const };
    expect(exerciseSchema.safeParse(assisted).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...assisted, loadDirection: "reduce_assistance" }).success).toBe(true);
  });

  it("requires a loaded exercise to offer at least one increment", () => {
    expect(exerciseSchema.safeParse({ ...loaded, incrementOptions: [] }).success).toBe(false);
  });

  it("rejects increments on an unloaded bodyweight exercise", () => {
    expect(exerciseSchema.safeParse({ ...validExercise, loadType: "bodyweight", incrementOptions: [1] }).success).toBe(false);
  });

  it("rejects increments that aren't strictly ascending", () => {
    expect(exerciseSchema.safeParse({ ...loaded, incrementOptions: [2, 1] }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...loaded, incrementOptions: [1, 1] }).success).toBe(false);
  });

  it("rejects percentage as a default progression strategy (circuits only, §3.3)", () => {
    expect(exerciseSchema.safeParse({ ...validExercise, progressionStrategyDefault: "percentage" }).success).toBe(false);
  });

  it("requires one or two form cues", () => {
    expect(exerciseSchema.safeParse({ ...validExercise, cues: { setup: "Set up.", form: [] } }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...validExercise, cues: { setup: "Set up.", form: ["a", "b", "c"] } }).success).toBe(
      false,
    );
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

describe("validateCatalog — library references", () => {
  const sibling: Exercise = { ...validExercise, id: "sibling", lightAlternativeIds: [] };

  function issuesFor(catalog: Exercise[]): string[] {
    try {
      validateCatalog(catalog);
      return [];
    } catch (error) {
      return (error as CatalogValidationError).issues;
    }
  }

  it("accepts a light alternative in the same movement pattern", () => {
    expect(issuesFor([{ ...validExercise, lightAlternativeIds: ["sibling"] }, sibling])).toEqual([]);
  });

  it("rejects a light alternative that doesn't exist", () => {
    expect(issuesFor([{ ...validExercise, lightAlternativeIds: ["ghost"] }])).toEqual([
      '[test-exercise] lightAlternativeIds: unknown exercise "ghost"',
    ]);
  });

  it("rejects an exercise listing itself as its light alternative", () => {
    expect(issuesFor([{ ...validExercise, lightAlternativeIds: ["test-exercise"] }])).toHaveLength(1);
  });

  it("rejects a light alternative in a different movement pattern (§6.6)", () => {
    const otherPattern: Exercise = { ...sibling, movementPattern: "rotation", swapGroup: undefined };
    expect(issuesFor([{ ...validExercise, lightAlternativeIds: ["sibling"] }, otherPattern])).toHaveLength(1);
  });

  it("rejects a swap group that mixes movement patterns", () => {
    const issues = issuesFor([
      { ...validExercise, swapGroup: "core" },
      { ...sibling, swapGroup: "core", movementPattern: "rotation" },
    ]);
    expect(issues).toEqual(['swap group "core" mixes movement patterns: anti_extension, rotation']);
  });

  it("rejects a ladder neighbour that points to the exercise itself", () => {
    expect(issuesFor([{ ...validExercise, progressionId: "test-exercise" }])).toEqual([
      "[test-exercise] progressionId: cannot point to itself",
    ]);
  });

  it("rejects an unknown regression or progression id", () => {
    expect(issuesFor([{ ...validExercise, regressionId: "ghost", progressionId: "ghost" }])).toHaveLength(2);
  });
});

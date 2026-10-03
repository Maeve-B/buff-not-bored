import { describe, expect, it } from "vitest";
import type { ExerciseCapabilityInput } from "../src/validation/exercise-capability.schema.js";
import { CapabilityValidationError, exerciseCapabilitySchema, validateExerciseCapability } from "../src/validation/exercise-capability.schema.js";

const loadedCapability: ExerciseCapabilityInput = {
  exerciseId: "db-bench-press",
  weight: 8,
  weightUnit: "kg",
  reps: 12,
  repsUnit: "reps",
  source: "manual",
};

const bodyweightCapability: ExerciseCapabilityInput = {
  exerciseId: "pull-up",
  reps: 15,
  repsUnit: "reps",
  source: "manual",
};

const timedCapability: ExerciseCapabilityInput = {
  exerciseId: "plank",
  duration: 90,
  source: "manual",
};

describe("exerciseCapabilitySchema", () => {
  it("accepts a well-formed loaded capability (weight + reps)", () => {
    expect(exerciseCapabilitySchema.safeParse(loadedCapability).success).toBe(true);
  });

  it("accepts a bodyweight capability (reps only, no weight)", () => {
    expect(exerciseCapabilitySchema.safeParse(bodyweightCapability).success).toBe(true);
  });

  it("accepts a duration-only capability (e.g. a plank hold)", () => {
    expect(exerciseCapabilitySchema.safeParse(timedCapability).success).toBe(true);
  });

  it("accepts source: progression (a confirmed progression suggestion)", () => {
    const result = exerciseCapabilitySchema.safeParse({ ...loadedCapability, source: "progression" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty capability — nothing recorded at all", () => {
    const result = exerciseCapabilitySchema.safeParse({ exerciseId: "db-bench-press", source: "manual" });
    expect(result.success).toBe(false);
  });

  it("rejects weight without weightUnit", () => {
    const { weightUnit, ...rest } = loadedCapability;
    const result = exerciseCapabilitySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects weightUnit without weight", () => {
    const { weight, ...rest } = loadedCapability;
    const result = exerciseCapabilitySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects repsUnit without reps", () => {
    const result = exerciseCapabilitySchema.safeParse({ ...timedCapability, repsUnit: "reps" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid source", () => {
    const result = exerciseCapabilitySchema.safeParse({ ...loadedCapability, source: "auto" });
    expect(result.success).toBe(false);
  });

  it("accepts an optional note alongside a manual edit", () => {
    const result = exerciseCapabilitySchema.safeParse({ ...loadedCapability, note: "felt strong today" });
    expect(result.success).toBe(true);
  });

  it("does not require (or accept as meaningful) an updatedAt field — that's database-managed", () => {
    // updatedAt isn't part of the write schema at all; passing it through is simply an unknown extra key to Zod's default (non-strict) object parsing, not a validation target.
    expect(exerciseCapabilitySchema.safeParse(loadedCapability).success).toBe(true);
  });
});

describe("validateExerciseCapability", () => {
  it("does not throw for a valid capability", () => {
    expect(() => validateExerciseCapability(loadedCapability)).not.toThrow();
  });

  it("throws CapabilityValidationError collecting every issue, not just the first", () => {
    // Two independent violations at once: weight with no weightUnit, and repsUnit with no reps.
    const invalid = { exerciseId: "db-bench-press", weight: 8, repsUnit: "reps", source: "manual" } as unknown as ExerciseCapabilityInput;
    try {
      validateExerciseCapability(invalid);
      expect.unreachable("expected validateExerciseCapability to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CapabilityValidationError);
      expect((error as CapabilityValidationError).issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});

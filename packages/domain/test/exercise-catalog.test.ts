import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { validateCatalog } from "../src/validation/exercise.schema.js";

describe("exercise catalog", () => {
  it("contains all 24 exercises from PRODUCT_SPEC.md §6", () => {
    expect(EXERCISES).toHaveLength(24);
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

    // Organisationally grouped under chest...
    expect(bss?.programmeGroup).toBe("chest");

    // ...but its actual muscles are lower-body, not chest.
    expect(bss?.primaryMuscles).toEqual(["quadriceps", "glutes"]);
    expect(bss?.primaryMuscles).not.toContain("chest");
    expect(bss?.secondaryMuscles).not.toContain("chest");
  });

  it("has at least one active exercise per programme group", () => {
    const groups = ["legs", "back", "chest", "triceps", "shoulders", "biceps", "core"] as const;
    for (const group of groups) {
      const found = EXERCISES.some((e) => e.programmeGroup === group && e.active);
      expect(found, `expected an active exercise for group "${group}"`).toBe(true);
    }
  });
});

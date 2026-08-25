import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { PROGRAMME_ALLOCATION, PROGRAMME_TEMPLATE } from "../src/data/programme-template.js";
import {
  assertTemplateMatchesAllocation,
  countMainSlotsByGroup,
  PROGRAMME_ORDER,
  ProgrammeTemplateError,
  resolveWorkoutAllocation,
  templateMatchesAllocation,
  validateTemplateAgainstLibrary,
  type ProgrammeTemplate,
} from "../src/entities/programme.js";

describe("PROGRAMME_TEMPLATE (the current, hand-authored programme)", () => {
  it("matches PROGRAMME_ALLOCATION's main-slot counts per group", () => {
    expect(templateMatchesAllocation(PROGRAMME_TEMPLATE, PROGRAMME_ALLOCATION)).toBe(true);
    expect(() => assertTemplateMatchesAllocation(PROGRAMME_TEMPLATE, PROGRAMME_ALLOCATION)).not.toThrow();
  });

  it("every slot references a real, active, correctly-grouped library exercise", () => {
    expect(() => validateTemplateAgainstLibrary(PROGRAMME_TEMPLATE, EXERCISES)).not.toThrow();
  });

  it("has exactly one finisher slot (legs), which is not counted in the allocation", () => {
    const finishers = PROGRAMME_TEMPLATE.slots.filter((s) => s.role === "finisher");
    expect(finishers).toHaveLength(1);
    expect(finishers[0]).toMatchObject({ programmeGroup: "legs", exerciseId: "bodyweight-squat-pulses" });
  });

  it("does not include Bulgarian Split Squat (library alternate only, per the correction)", () => {
    expect(PROGRAMME_TEMPLATE.slots.some((s) => s.exerciseId === "bulgarian-split-squat")).toBe(false);
  });
});

describe("countMainSlotsByGroup", () => {
  it("excludes finisher slots from the count", () => {
    const counts = countMainSlotsByGroup(PROGRAMME_TEMPLATE);
    expect(counts.legs).toBe(5); // 5 main + 1 finisher, finisher excluded
    expect(counts.back).toBe(5);
    expect(counts.chest).toBe(3);
  });
});

describe("resolveWorkoutAllocation", () => {
  it("returns the base allocation unchanged when there is no override", () => {
    expect(resolveWorkoutAllocation(PROGRAMME_ALLOCATION)).toEqual(PROGRAMME_ALLOCATION);
  });

  it("overrides only the groups specified, leaving the rest at their base value", () => {
    const resolved = resolveWorkoutAllocation(PROGRAMME_ALLOCATION, { legs: 3, core: 2 });
    expect(resolved.legs).toBe(3);
    expect(resolved.core).toBe(2);
    expect(resolved.back).toBe(PROGRAMME_ALLOCATION.back);
    expect(resolved.chest).toBe(PROGRAMME_ALLOCATION.chest);
  });

  it("does not mutate the base allocation", () => {
    const baseCopy = { ...PROGRAMME_ALLOCATION };
    resolveWorkoutAllocation(PROGRAMME_ALLOCATION, { legs: 1 });
    expect(PROGRAMME_ALLOCATION).toEqual(baseCopy);
  });
});

describe("template/library validation failures", () => {
  it("throws when a slot references an unknown exercise id", () => {
    const badTemplate: ProgrammeTemplate = {
      slots: [{ programmeGroup: "legs", exerciseId: "does-not-exist", role: "main" }],
    };
    expect(() => validateTemplateAgainstLibrary(badTemplate, EXERCISES)).toThrow(ProgrammeTemplateError);
  });

  it("throws when a slot's declared group doesn't match the exercise's group", () => {
    const badTemplate: ProgrammeTemplate = {
      slots: [{ programmeGroup: "legs", exerciseId: "deadlifts", role: "main" }],
    };
    expect(() => validateTemplateAgainstLibrary(badTemplate, EXERCISES)).toThrow(ProgrammeTemplateError);
  });

  it("throws when the template's counts don't match a given allocation", () => {
    const wrongAllocation = { ...PROGRAMME_ALLOCATION, legs: 3 };
    expect(() => assertTemplateMatchesAllocation(PROGRAMME_TEMPLATE, wrongAllocation)).toThrow(
      ProgrammeTemplateError,
    );
  });
});

describe("PROGRAMME_ORDER", () => {
  it("is the fixed session order from spec §9", () => {
    expect(PROGRAMME_ORDER).toEqual(["legs", "back", "chest", "triceps", "shoulders", "biceps", "core"]);
  });
});

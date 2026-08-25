import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import type { Exercise } from "../src/entities/exercise.js";
import { deriveDefaultProgrammeTemplate, PROGRAMME_ORDER, ProgrammeTemplateError } from "../src/entities/programme.js";

describe("deriveDefaultProgrammeTemplate", () => {
  it("produces one slot per programme group, in the fixed session order", () => {
    const template = deriveDefaultProgrammeTemplate(EXERCISES);
    expect(template.slots.map((s) => s.programmeGroup)).toEqual(PROGRAMME_ORDER);
  });

  it("takes the first active exercise listed per group as the current default", () => {
    const template = deriveDefaultProgrammeTemplate(EXERCISES);
    const byGroup = Object.fromEntries(template.slots.map((s) => [s.programmeGroup, s.exerciseId]));

    expect(byGroup.legs).toBe("squats");
    expect(byGroup.back).toBe("deadlifts");
    expect(byGroup.chest).toBe("flat-db-press");
    expect(byGroup.triceps).toBe("lying-tricep-extensions");
    expect(byGroup.shoulders).toBe("lateral-raises");
    expect(byGroup.biceps).toBe("concentration-curl");
    expect(byGroup.core).toBe("plank");
  });

  it("skips inactive exercises when choosing the default", () => {
    const catalog: Exercise[] = EXERCISES.map((e) => (e.id === "squats" ? { ...e, active: false } : e));
    const template = deriveDefaultProgrammeTemplate(catalog);
    const legsSlot = template.slots.find((s) => s.programmeGroup === "legs");
    expect(legsSlot?.exerciseId).toBe("squat-pulse");
  });

  it("throws if a programme group has no active exercise", () => {
    const catalog: Exercise[] = EXERCISES.filter((e) => e.programmeGroup !== "core");
    expect(() => deriveDefaultProgrammeTemplate(catalog)).toThrow(ProgrammeTemplateError);
  });
});

import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { deriveDefaultProgrammeTemplate, PROGRAMME_ORDER } from "../src/entities/programme.js";
import {
  buildDefaultSession,
  buildSessionFromTemplate,
  TARGET_SESSION_DURATION,
  WorkoutBuilderError,
} from "../src/engine/workout-builder.js";

describe("buildDefaultSession", () => {
  const session = buildDefaultSession(EXERCISES);

  it("follows the fixed spec §9 structure: warm-up -> 7 groups -> cool-down", () => {
    expect(session.warmup.steps.map((s) => s.name)).toEqual([
      "Squats",
      "Squat + Upright Row",
      "Bicep Curls",
      "Overhead Press",
    ]);
    expect(session.mainExercises).toHaveLength(7);
    expect(session.mainExercises.map((pe) => pe.exercise.programmeGroup)).toEqual(PROGRAMME_ORDER);
    expect(session.cooldown.targetAreas.length).toBeGreaterThan(0);
  });

  it("targets 45-50 minutes overall, as an estimate not a hard constraint", () => {
    expect(session.targetSessionDuration).toEqual(TARGET_SESSION_DURATION);
    expect(session.targetSessionDuration).toEqual({ minMinutes: 45, maxMinutes: 50 });
  });

  it("warm-up targets 5-6 minutes and cool-down targets 3-5 minutes", () => {
    expect(session.warmup.targetDuration).toEqual({ minMinutes: 5, maxMinutes: 6 });
    expect(session.cooldown.targetDuration).toEqual({ minMinutes: 3, maxMinutes: 5 });
  });

  it("carries each exercise's own prescription into the planned exercise", () => {
    const squats = session.mainExercises.find((pe) => pe.exercise.id === "squats");
    expect(squats?.prescribedWeight).toBe(20);
    expect(squats?.prescribedReps).toBe(20);
    expect(squats?.repsUnit).toBe("reps");

    const plank = session.mainExercises.find((pe) => pe.exercise.id === "plank");
    expect(plank?.prescribedWeight).toBeUndefined();
    expect(plank?.prescribedDuration).toBe(45);
  });

  it("is deterministic: rebuilding from the same catalog yields an equivalent session", () => {
    const again = buildDefaultSession(EXERCISES);
    expect(again).toEqual(session);
  });
});

describe("buildSessionFromTemplate error handling", () => {
  const template = deriveDefaultProgrammeTemplate(EXERCISES);

  it("throws if the template references an exercise id not in the catalog", () => {
    const badTemplate = {
      slots: template.slots.map((s) => (s.programmeGroup === "legs" ? { ...s, exerciseId: "does-not-exist" } : s)),
    };
    expect(() => buildSessionFromTemplate(EXERCISES, badTemplate)).toThrow(WorkoutBuilderError);
  });

  it("throws if a slot's exercise belongs to a different programme group", () => {
    const badTemplate = {
      slots: template.slots.map((s) => (s.programmeGroup === "legs" ? { ...s, exerciseId: "deadlifts" } : s)),
    };
    expect(() => buildSessionFromTemplate(EXERCISES, badTemplate)).toThrow(WorkoutBuilderError);
  });
});

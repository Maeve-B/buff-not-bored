import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { PROGRAMME_ALLOCATION, PROGRAMME_TEMPLATE } from "../src/data/programme-template.js";
import { PROGRAMME_ORDER } from "../src/entities/programme.js";
import {
  buildDefaultSession,
  buildSessionFromTemplate,
  TARGET_SESSION_DURATION,
  WorkoutBuilderError,
} from "../src/engine/workout-builder.js";

describe("buildDefaultSession", () => {
  const session = buildDefaultSession(EXERCISES);

  const TOTAL_MAIN_SLOTS = Object.values(PROGRAMME_ALLOCATION).reduce((sum, n) => sum + n, 0) + 1; // +1 finisher

  it("follows the fixed spec §9 structure: warm-up -> main programme -> cool-down", () => {
    expect(session.warmup.steps.map((s) => s.name)).toEqual([
      "Squats",
      "Squat + Upright Row",
      "Bicep Curls",
      "Overhead Press",
    ]);
    expect(session.mainExercises).toHaveLength(TOTAL_MAIN_SLOTS);
    expect(session.cooldown.targetAreas.length).toBeGreaterThan(0);
  });

  it("groups main exercises contiguously, in PROGRAMME_ORDER", () => {
    const groupSequence = session.mainExercises.map((pe) => pe.exercise.programmeGroup);
    const firstIndexPerGroup = new Map<string, number>();
    groupSequence.forEach((group, i) => {
      if (!firstIndexPerGroup.has(group)) firstIndexPerGroup.set(group, i);
    });
    // The order groups first appear in should match PROGRAMME_ORDER.
    expect([...firstIndexPerGroup.keys()]).toEqual(PROGRAMME_ORDER);
    // And each group's exercises should be contiguous (no interleaving).
    for (const group of PROGRAMME_ORDER) {
      const indices = groupSequence.map((g, i) => (g === group ? i : -1)).filter((i) => i !== -1);
      const expectedRun = Array.from({ length: indices.length }, (_, i) => indices[0] + i);
      expect(indices).toEqual(expectedRun);
    }
  });

  it("respects the configured per-group allocation (main exercises only, finisher excluded)", () => {
    for (const group of PROGRAMME_ORDER) {
      const mainCount = session.mainExercises.filter(
        (pe) => pe.exercise.programmeGroup === group && pe.role === "main",
      ).length;
      expect(mainCount).toBe(PROGRAMME_ALLOCATION[group]);
    }
  });

  it("includes the legs finisher, distinct from and additional to the legs allocation", () => {
    const legsFinishers = session.mainExercises.filter(
      (pe) => pe.exercise.programmeGroup === "legs" && pe.role === "finisher",
    );
    expect(legsFinishers).toHaveLength(1);
    expect(legsFinishers[0]?.exercise.id).toBe("bodyweight-squat-pulses");
  });

  it("does not include Bulgarian Split Squat (library-only, not part of the current template)", () => {
    expect(session.mainExercises.some((pe) => pe.exercise.id === "bulgarian-split-squat")).toBe(false);
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

    const superman = session.mainExercises.find((pe) => pe.exercise.id === "superman-holds");
    expect(superman?.prescribedWeight).toBeUndefined();
    expect(superman?.prescribedDuration).toBe(30);
  });

  it("is deterministic: rebuilding from the same library yields an equivalent session", () => {
    const again = buildDefaultSession(EXERCISES);
    expect(again).toEqual(session);
  });
});

describe("buildSessionFromTemplate error handling", () => {
  it("throws if the template references an exercise id not in the library", () => {
    const badTemplate = {
      slots: PROGRAMME_TEMPLATE.slots.map((s) =>
        s.programmeGroup === "legs" && s.role === "main" ? { ...s, exerciseId: "does-not-exist" } : s,
      ),
    };
    expect(() => buildSessionFromTemplate(EXERCISES, badTemplate)).toThrow(WorkoutBuilderError);
  });

  it("throws if a slot's exercise belongs to a different programme group", () => {
    const badTemplate = {
      slots: PROGRAMME_TEMPLATE.slots.map((s) =>
        s.programmeGroup === "legs" && s.exerciseId === "squats" ? { ...s, exerciseId: "deadlifts" } : s,
      ),
    };
    expect(() => buildSessionFromTemplate(EXERCISES, badTemplate)).toThrow(WorkoutBuilderError);
  });
});

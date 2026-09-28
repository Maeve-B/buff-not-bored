import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { countCompletedSets, isStrengthSessionFullyLogged, type StrengthSession } from "../src/entities/strength.js";
import {
  buildDefaultStrengthSession,
  buildStrengthSessionFromTemplate,
  DEFAULT_SETS_PER_EXERCISE,
  StrengthBuilderError,
} from "../src/engine/strength-builder.js";
import { PROGRAMME_TEMPLATE } from "../src/data/programme-template.js";

describe("Classic Strength — exercises have sets, sets have target reps and recommended weights", () => {
  const session = buildDefaultStrengthSession(EXERCISES);
  const squats = session.exercises.find((se) => se.exercise.id === "squats")!;

  it("every exercise has the configured number of sets", () => {
    for (const strengthExercise of session.exercises) {
      expect(strengthExercise.sets).toHaveLength(DEFAULT_SETS_PER_EXERCISE);
    }
  });

  it("each set carries a target rep count (or duration) copied from the exercise", () => {
    expect(squats.sets.every((set) => set.targetReps === 20)).toBe(true); // Squats: 20 prescribed reps
  });

  it("each set carries a recommended weight from the exercise's WeightRecommendation", () => {
    expect(squats.recommendation?.baseWeight).toBe(20);
    expect(squats.recommendation?.finalWeight).toBe(20); // no adjustments applied by default
    expect(squats.sets.every((set) => set.targetWeight === 20)).toBe(true);
  });

  it("duration-based exercises get a target duration instead of target reps", () => {
    const plank = session.exercises.find((se) => se.exercise.id === "plank")!;
    expect(plank.sets.every((set) => set.targetDuration === 45)).toBe(true);
    expect(plank.sets.every((set) => set.targetReps === undefined)).toBe(true);
  });

  it("bodyweight exercises with no starting weight have no recommendation", () => {
    const plank = session.exercises.find((se) => se.exercise.id === "plank")!;
    expect(plank.recommendation).toBeUndefined();
    expect(plank.sets.every((set) => set.targetWeight === undefined)).toBe(true);
  });

  it("every set starts uncompleted with no logged performance", () => {
    for (const strengthExercise of session.exercises) {
      for (const set of strengthExercise.sets) {
        expect(set.completed).toBe(false);
        expect(set.actualWeight).toBeUndefined();
        expect(set.actualReps).toBeUndefined();
      }
    }
  });

  it("preserves the finisher/main role from the template slot", () => {
    const finisher = session.exercises.find((se) => se.role === "finisher");
    expect(finisher?.exercise.id).toBe("bodyweight-squat-pulses");
  });

  it("respects a custom setsPerExercise option", () => {
    const custom = buildDefaultStrengthSession(EXERCISES, { setsPerExercise: 5 });
    expect(custom.exercises[0]?.sets).toHaveLength(5);
  });
});

describe("Classic Strength — actual performance can be recorded, separately from the target", () => {
  it("actual weight/reps and completed state can be set on a set without touching its target", () => {
    const session = buildDefaultStrengthSession(EXERCISES);
    const squats = session.exercises.find((se) => se.exercise.id === "squats")!;
    const loggedSet = { ...squats.sets[0]!, actualWeight: 22.5, actualReps: 18, completed: true };

    expect(loggedSet.targetWeight).toBe(20); // target untouched by logging
    expect(loggedSet.targetReps).toBe(20);
    expect(loggedSet.actualWeight).toBe(22.5);
    expect(loggedSet.actualReps).toBe(18);
    expect(loggedSet.completed).toBe(true);
  });
});

describe("Classic Strength — session-level completion helpers", () => {
  function sessionWith(overrides: Partial<StrengthSession["exercises"][number]["sets"][number]>[]): StrengthSession {
    const base = buildDefaultStrengthSession(EXERCISES, { setsPerExercise: 1 });
    return {
      exercises: base.exercises.slice(0, overrides.length).map((se, i) => ({
        ...se,
        sets: [{ ...se.sets[0]!, ...overrides[i] }],
      })),
    };
  }

  it("isStrengthSessionFullyLogged is false until every set has a logged attempt", () => {
    const session = sessionWith([{ actualReps: 20 }, {}]);
    expect(isStrengthSessionFullyLogged(session)).toBe(false);
  });

  it("isStrengthSessionFullyLogged is true once every set has a logged attempt (regardless of hitting target)", () => {
    const session = sessionWith([{ actualReps: 20, completed: true }, { actualReps: 10, completed: false }]);
    expect(isStrengthSessionFullyLogged(session)).toBe(true);
  });

  it("countCompletedSets counts only sets marked completed, out of the total", () => {
    const session = sessionWith([
      { actualReps: 20, completed: true },
      { actualReps: 5, completed: false },
      { actualReps: 20, completed: true },
    ]);
    expect(countCompletedSets(session)).toEqual({ completed: 2, total: 3 });
  });
});

describe("buildStrengthSessionFromTemplate error handling", () => {
  it("throws if the template references an exercise id not in the library", () => {
    const badTemplate = {
      slots: PROGRAMME_TEMPLATE.slots.map((s) => (s.exerciseId === "squats" ? { ...s, exerciseId: "does-not-exist" } : s)),
    };
    expect(() => buildStrengthSessionFromTemplate(EXERCISES, badTemplate)).toThrow(StrengthBuilderError);
  });

  it("throws if a slot's exercise belongs to a different programme group", () => {
    const badTemplate = {
      slots: PROGRAMME_TEMPLATE.slots.map((s) => (s.exerciseId === "squats" ? { ...s, exerciseId: "deadlifts" } : s)),
    };
    expect(() => buildStrengthSessionFromTemplate(EXERCISES, badTemplate)).toThrow(StrengthBuilderError);
  });
});

describe("Classic Strength and Circuit select the same exercises from the same template", () => {
  it("uses the identical set of exercise ids the Circuit builder uses — exercise selection is independent of workout type", async () => {
    const { buildDefaultSession } = await import("../src/engine/workout-builder.js");
    const circuitIds = buildDefaultSession(EXERCISES)
      .mainExercises.map((pe) => pe.exercise.id)
      .sort();
    const strengthIds = buildDefaultStrengthSession(EXERCISES)
      .exercises.map((se) => se.exercise.id)
      .sort();
    expect(strengthIds).toEqual(circuitIds);
  });
});

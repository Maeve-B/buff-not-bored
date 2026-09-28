import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { asCircuitWorkout, asClassicStrengthWorkout, type CircuitWorkout, type ClassicStrengthWorkout } from "../src/entities/workout.js";
import { buildDefaultSession } from "../src/engine/workout-builder.js";
import { buildDefaultStrengthSession } from "../src/engine/strength-builder.js";

const circuitWorkout: CircuitWorkout = {
  id: "w1",
  name: "Full Body",
  status: "not_started",
  dateIso: "2026-09-28",
  workoutType: "circuit",
  session: buildDefaultSession(EXERCISES),
};

const strengthWorkout: ClassicStrengthWorkout = {
  id: "w2",
  name: "Full Body Strength",
  status: "not_started",
  dateIso: "2026-09-28",
  workoutType: "classic_strength",
  session: buildDefaultStrengthSession(EXERCISES),
};

describe("Workout — discriminated union, workout type does not leak UI concerns into the domain", () => {
  it("a circuit workout's session is the plain existing WorkoutSession shape (mainExercises, warmup, cooldown)", () => {
    expect(circuitWorkout.session.mainExercises.length).toBeGreaterThan(0);
    expect(circuitWorkout.session.warmup).toBeDefined();
    expect(circuitWorkout.session.cooldown).toBeDefined();
  });

  it("a classic strength workout's session is set-based (exercises with sets, no flat mainExercises list)", () => {
    expect(strengthWorkout.session.exercises.length).toBeGreaterThan(0);
    expect(strengthWorkout.session.exercises[0]?.sets.length).toBeGreaterThan(0);
    expect((strengthWorkout.session as unknown as { mainExercises?: unknown }).mainExercises).toBeUndefined();
  });

  it("asCircuitWorkout narrows correctly and returns undefined for the other type", () => {
    expect(asCircuitWorkout(circuitWorkout)).toBe(circuitWorkout);
    expect(asCircuitWorkout(strengthWorkout)).toBeUndefined();
  });

  it("asClassicStrengthWorkout narrows correctly and returns undefined for the other type", () => {
    expect(asClassicStrengthWorkout(strengthWorkout)).toBe(strengthWorkout);
    expect(asClassicStrengthWorkout(circuitWorkout)).toBeUndefined();
  });

  it("both variants share the same outer contract: id, name, status, dateIso", () => {
    for (const workout of [circuitWorkout, strengthWorkout]) {
      expect(typeof workout.id).toBe("string");
      expect(typeof workout.name).toBe("string");
      expect(typeof workout.status).toBe("string");
      expect(typeof workout.dateIso).toBe("string");
    }
  });

  it("programmeContext is optional and, when present, names the scheduling origin", () => {
    const scheduled: CircuitWorkout = { ...circuitWorkout, programmeContext: { programmeId: "p1", weekNumber: 2, scheduledWorkoutId: "s1" } };
    expect(scheduled.programmeContext?.weekNumber).toBe(2);
    expect(circuitWorkout.programmeContext).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { LoggedWorkoutValidationError, validateLoggedWorkout } from "../src/validation/logged-workout.schema.js";
import type { LoggedWorkoutInput } from "../src/types.js";

const validCircuitWorkout: LoggedWorkoutInput = {
  workoutType: "circuit",
  name: "Full Body Circuit",
  status: "completed",
  dateIso: "2026-09-28",
  exercises: [
    {
      exerciseId: "back-squat",
      role: "main",
      baseWeight: 60,
      finalWeight: 60,
      sets: [{ setNumber: 1, targetReps: 10, targetWeight: 60, actualReps: 10, actualWeight: 60, completed: true }],
    },
  ],
};

const validStrengthWorkout: LoggedWorkoutInput = {
  workoutType: "classic_strength",
  name: "Full Body Strength",
  status: "completed",
  dateIso: "2026-09-28",
  programmeId: "8-week-strength",
  weekNumber: 1,
  scheduledWorkoutId: "w1-mon",
  exercises: [
    {
      exerciseId: "back-squat",
      role: "main",
      baseWeight: 40,
      adjustments: [{ type: "percentage", percent: -20, reason: "felt heavy" }],
      finalWeight: 32,
      sets: [
        { setNumber: 1, targetReps: 20, targetWeight: 32, actualReps: 20, actualWeight: 32, completed: true },
        { setNumber: 2, targetReps: 20, targetWeight: 32, actualReps: 18, actualWeight: 32, completed: false },
      ],
    },
  ],
};

describe("loggedWorkoutSchema / validateLoggedWorkout", () => {
  it("accepts a valid Circuit workout (one set per exercise)", () => {
    expect(() => validateLoggedWorkout(validCircuitWorkout)).not.toThrow();
  });

  it("accepts a valid Classic Strength workout (multiple sets, an adjustment applied)", () => {
    expect(() => validateLoggedWorkout(validStrengthWorkout)).not.toThrow();
  });

  it("rejects an unknown workoutType, keeping the vocabulary in sync with the domain package", () => {
    const invalid = { ...validCircuitWorkout, workoutType: "hiit" } as unknown as LoggedWorkoutInput;
    expect(() => validateLoggedWorkout(invalid)).toThrow(LoggedWorkoutValidationError);
  });

  it("rejects a workout with no exercises", () => {
    const invalid: LoggedWorkoutInput = { ...validCircuitWorkout, exercises: [] };
    expect(() => validateLoggedWorkout(invalid)).toThrow(/at least one exercise/);
  });

  it("rejects an exercise with no sets", () => {
    const invalid: LoggedWorkoutInput = {
      ...validCircuitWorkout,
      exercises: [{ ...validCircuitWorkout.exercises[0]!, sets: [] }],
    };
    expect(() => validateLoggedWorkout(invalid)).toThrow(/at least one set/);
  });

  it("rejects duplicate setNumbers within one exercise", () => {
    const invalid: LoggedWorkoutInput = {
      ...validStrengthWorkout,
      exercises: [
        {
          ...validStrengthWorkout.exercises[0]!,
          sets: [
            { setNumber: 1, targetReps: 20, completed: true },
            { setNumber: 1, targetReps: 20, completed: true },
          ],
        },
      ],
    };
    expect(() => validateLoggedWorkout(invalid)).toThrow(/unique/);
  });

  it("rejects a finalWeight given without a baseWeight, preventing an adjustment result with nothing to adjust from", () => {
    const invalid: LoggedWorkoutInput = {
      ...validCircuitWorkout,
      exercises: [{ ...validCircuitWorkout.exercises[0]!, baseWeight: undefined, finalWeight: 60 }],
    };
    expect(() => validateLoggedWorkout(invalid)).toThrow(/finalWeight requires baseWeight/);
  });

  it("collects every issue rather than stopping at the first", () => {
    const invalid = {
      ...validCircuitWorkout,
      workoutType: "hiit",
      exercises: [],
    } as unknown as LoggedWorkoutInput;

    try {
      validateLoggedWorkout(invalid);
      expect.fail("expected validateLoggedWorkout to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(LoggedWorkoutValidationError);
      expect((error as InstanceType<typeof LoggedWorkoutValidationError>).issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});

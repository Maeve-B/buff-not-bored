import { describe, expect, it } from "vitest";
import type { Exercise, PlannedExercise, StrengthExercise, StrengthSession, WorkoutSession } from "@buff-not-bored/domain";
import { toLoggedWorkoutInput } from "@/lib/persistence-mapper";
import type { CircuitWorkoutSnapshot, SetLog, StrengthWorkoutSnapshot } from "@/lib/types";

const squats: Exercise = {
  id: "squats",
  name: "Squats",
  programmeGroup: "legs",
  primaryMuscles: ["quads"],
  secondaryMuscles: [],
  movementPatterns: ["squat"],
  exerciseType: "compound",
  equipment: "barbell",
  location: "rack",
  startingWeight: 20,
  weightUnit: "kg",
  prescribedReps: 20,
  repsUnit: "reps",
  progressionPercentage: 5,
  active: true,
};

const plank: Exercise = {
  id: "plank",
  name: "Plank",
  programmeGroup: "core",
  primaryMuscles: ["abdominals"],
  secondaryMuscles: [],
  movementPatterns: ["anti-extension"],
  exerciseType: "core",
  equipment: "bodyweight",
  location: "floor",
  prescribedDuration: 60,
  active: true,
};

describe("toLoggedWorkoutInput — Circuit", () => {
  const plannedSquats: PlannedExercise = { exercise: squats, role: "main", prescribedWeight: 20, prescribedReps: 20, repsUnit: "reps" };
  const plannedPlank: PlannedExercise = { exercise: plank, role: "main", prescribedDuration: 60 };

  const session: WorkoutSession = {
    warmup: { steps: [], targetDuration: { minMinutes: 5, maxMinutes: 10 } },
    mainExercises: [plannedSquats, plannedPlank],
    cooldown: { targetAreas: [], targetDuration: { minMinutes: 5, maxMinutes: 10 } },
    targetSessionDuration: { minMinutes: 45, maxMinutes: 50 },
  };

  it("passes the snapshot's own status through, rather than assuming completion", () => {
    const snapshot: CircuitWorkoutSnapshot = {
      id: "workout-1",
      dateIso: "2026-10-03",
      workoutName: "Full Body",
      workoutType: "circuit",
      status: "in_progress",
      session,
      setLogs: [],
    };

    const input = toLoggedWorkoutInput(snapshot);
    expect(input.status).toBe("in_progress");
  });

  it("maps a logged exercise to one set, with base/final weight equal (no adjustment mechanism exists for Circuit)", () => {
    const log: SetLog = { exerciseId: "squats", actualWeight: 22.5, actualReps: 21, completed: true, loggedAt: 1_000 };
    const snapshot: CircuitWorkoutSnapshot = {
      id: "workout-1",
      dateIso: "2026-10-03T12:00:00.000Z",
      workoutName: "Full Body",
      workoutType: "circuit",
      status: "completed",
      session,
      setLogs: [log],
    };

    const input = toLoggedWorkoutInput(snapshot);

    expect(input.workoutType).toBe("circuit");
    expect(input.status).toBe("completed");
    expect(input.exercises).toHaveLength(2);

    const squatsExercise = input.exercises.find((e) => e.exerciseId === "squats")!;
    expect(squatsExercise.baseWeight).toBe(20);
    expect(squatsExercise.finalWeight).toBe(20);
    expect(squatsExercise.adjustments).toEqual([]);
    expect(squatsExercise.sets).toHaveLength(1);
    expect(squatsExercise.sets[0]).toMatchObject({
      setNumber: 1,
      targetReps: 20,
      targetWeight: 20,
      actualWeight: 22.5,
      actualReps: 21,
      completed: true,
    });
  });

  it("preserves actual weight distinctly from target/recommended weight, not collapsed into one field", () => {
    const log: SetLog = { exerciseId: "squats", actualWeight: 17.5, actualReps: 18, completed: false, loggedAt: 1_000 };
    const snapshot: CircuitWorkoutSnapshot = {
      id: "workout-1",
      dateIso: "2026-10-03",
      workoutName: "Full Body",
      workoutType: "circuit",
      status: "in_progress",
      session,
      setLogs: [log],
    };

    const input = toLoggedWorkoutInput(snapshot);
    const squatsExercise = input.exercises.find((e) => e.exerciseId === "squats")!;
    expect(squatsExercise.baseWeight).toBe(20); // prescribed/recommended
    expect(squatsExercise.sets[0]!.actualWeight).toBe(17.5); // what was actually logged
    expect(squatsExercise.baseWeight).not.toBe(squatsExercise.sets[0]!.actualWeight);
  });

  it("represents an unlogged exercise as one not-completed set, with no actual values, rather than dropping it", () => {
    const snapshot: CircuitWorkoutSnapshot = {
      id: "workout-1",
      dateIso: "2026-10-03",
      workoutName: "Full Body",
      workoutType: "circuit",
      status: "in_progress",
      session,
      setLogs: [], // nothing logged at all — e.g. the snapshot taken right at Start
    };

    const input = toLoggedWorkoutInput(snapshot);
    expect(input.exercises).toHaveLength(2);
    for (const exercise of input.exercises) {
      expect(exercise.sets).toHaveLength(1);
      expect(exercise.sets[0]!.completed).toBe(false);
      expect(exercise.sets[0]!.actualReps).toBeUndefined();
      expect(exercise.sets[0]!.actualWeight).toBeUndefined();
    }
  });

  it("leaves base/final weight undefined for a bodyweight-only exercise rather than inventing a value", () => {
    const snapshot: CircuitWorkoutSnapshot = {
      id: "workout-1",
      dateIso: "2026-10-03",
      workoutName: "Full Body",
      workoutType: "circuit",
      status: "in_progress",
      session,
      setLogs: [],
    };

    const input = toLoggedWorkoutInput(snapshot);
    const plankExercise = input.exercises.find((e) => e.exerciseId === "plank")!;
    expect(plankExercise.baseWeight).toBeUndefined();
    expect(plankExercise.finalWeight).toBeUndefined();
    expect(plankExercise.sets[0]!.targetDuration).toBe(60);
  });
});

describe("toLoggedWorkoutInput — Classic Strength", () => {
  const strengthExercise: StrengthExercise = {
    exercise: squats,
    role: "main",
    restSeconds: 90,
    recommendation: { baseWeight: 40, adjustments: [{ type: "percentage", percent: -20, reason: "felt heavy" }], finalWeight: 32 },
    sets: [
      { setNumber: 1, targetReps: 20, targetWeight: 32, actualReps: 20, actualWeight: 32, completed: true },
      { setNumber: 2, targetReps: 20, targetWeight: 32, actualReps: 18, actualWeight: 32, completed: false },
    ],
  };

  const session: StrengthSession = { exercises: [strengthExercise] };

  it("maps every set, and keeps base/adjustments/final distinct from each set's actual performance", () => {
    const snapshot: StrengthWorkoutSnapshot = {
      id: "strength-1",
      dateIso: "2026-10-03",
      workoutName: "Full Body Strength",
      workoutType: "classic_strength",
      status: "completed",
      session,
    };

    const input = toLoggedWorkoutInput(snapshot);

    expect(input.workoutType).toBe("classic_strength");
    expect(input.exercises).toHaveLength(1);

    const exercise = input.exercises[0]!;
    expect(exercise.baseWeight).toBe(40);
    expect(exercise.adjustments).toEqual([{ type: "percentage", percent: -20, reason: "felt heavy" }]);
    expect(exercise.finalWeight).toBe(32);
    expect(exercise.sets).toHaveLength(2);
    expect(exercise.sets[1]).toMatchObject({ setNumber: 2, actualReps: 18, completed: false });
  });

  it("defaults adjustments to an empty array when an exercise has no recommendation at all", () => {
    const bodyweightExercise: StrengthExercise = {
      exercise: plank,
      role: "finisher",
      sets: [{ setNumber: 1, targetDuration: 60, actualDuration: 45, completed: false }],
    };
    const snapshot: StrengthWorkoutSnapshot = {
      id: "strength-2",
      dateIso: "2026-10-03",
      workoutName: "Full Body Strength",
      workoutType: "classic_strength",
      status: "in_progress",
      session: { exercises: [bodyweightExercise] },
    };

    const input = toLoggedWorkoutInput(snapshot);
    const exercise = input.exercises[0]!;
    expect(exercise.role).toBe("finisher");
    expect(exercise.baseWeight).toBeUndefined();
    expect(exercise.finalWeight).toBeUndefined();
    expect(exercise.adjustments).toEqual([]);
  });
});

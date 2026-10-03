/**
 * Integration tests against a real (local, throwaway) Postgres instance —
 * per ARCHITECTURE.md §9 ("packages/db | Vitest + a real (throwaway)
 * Postgres, or pg-mem"). Requires `DATABASE_URL` to point at a database
 * with this package's migrations applied (`pnpm prisma:migrate`); see
 * packages/db/.env.example.
 */

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Exercise } from "@buff-not-bored/domain";
import { prisma } from "../src/client.js";
import { findExerciseById, listExercises, upsertExercise } from "../src/repositories/exercise-repository.js";
import { getWorkoutById, listWorkoutSummaries, saveWorkout } from "../src/repositories/workout-repository.js";
import { LoggedWorkoutValidationError } from "../src/validation/logged-workout.schema.js";
import type { LoggedWorkoutInput } from "../src/types.js";

const testExercise: Exercise = {
  id: "test-back-squat",
  name: "Back Squat",
  programmeGroup: "legs",
  primaryMuscles: ["quads", "glutes"],
  secondaryMuscles: ["hamstrings"],
  movementPatterns: ["squat"],
  exerciseType: "compound",
  equipment: "barbell",
  location: "rack",
  startingWeight: 60,
  weightUnit: "kg",
  prescribedReps: 8,
  repsUnit: "reps",
  progressionPercentage: 5,
  active: true,
};

async function resetTables(): Promise<void> {
  await prisma.workoutSet.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.exercise.deleteMany();
}

beforeEach(async () => {
  await resetTables();
});

afterAll(async () => {
  await resetTables();
  await prisma.$disconnect();
});

describe("exercise repository", () => {
  it("upserts an exercise and reads it back unchanged", async () => {
    await upsertExercise(testExercise);
    const found = await findExerciseById(testExercise.id);
    // needsReview defaults to false at the row level even where the domain object leaves it unset.
    expect(found).toEqual({ ...testExercise, needsReview: false });
  });

  it("returns undefined for an id that doesn't exist", async () => {
    const found = await findExerciseById("does-not-exist");
    expect(found).toBeUndefined();
  });

  it("upsert replaces the existing row rather than erroring on a duplicate id", async () => {
    await upsertExercise(testExercise);
    await upsertExercise({ ...testExercise, startingWeight: 65 });
    const found = await findExerciseById(testExercise.id);
    expect(found?.startingWeight).toBe(65);
  });

  it("lists every stored exercise", async () => {
    await upsertExercise(testExercise);
    await upsertExercise({ ...testExercise, id: "test-bench-press", name: "Bench Press" });
    const all = await listExercises();
    expect(all.map((e) => e.id).sort()).toEqual(["test-back-squat", "test-bench-press"]);
  });

  it("rejects an exercise that fails the shared exerciseSchema (e.g. no primary muscles)", async () => {
    const invalid = { ...testExercise, primaryMuscles: [] };
    await expect(upsertExercise(invalid)).rejects.toThrow();
  });
});

describe("workout repository", () => {
  const workoutInput: LoggedWorkoutInput = {
    workoutType: "classic_strength",
    name: "Full Body Strength",
    status: "completed",
    dateIso: "2026-09-28",
    programmeId: "8-week-strength",
    weekNumber: 1,
    scheduledWorkoutId: "w1-mon",
    exercises: [
      {
        exerciseId: testExercise.id,
        role: "main",
        restSeconds: 90,
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

  beforeEach(async () => {
    await upsertExercise(testExercise);
  });

  it("saves a full workout (exercise + sets) in one write and reads it back with the weight split intact", async () => {
    const saved = await saveWorkout(workoutInput);
    expect(saved.id).toBeTruthy();

    const fetched = await getWorkoutById(saved.id);
    expect(fetched).toBeDefined();
    expect(fetched!.workoutType).toBe("classic_strength");
    expect(fetched!.programmeId).toBe("8-week-strength");

    const exercise = fetched!.exercises[0]!;
    // Base/adjustments/final preserved distinctly from each set's actual performance.
    expect(exercise.baseWeight).toBe(40);
    expect(exercise.adjustments).toEqual([{ type: "percentage", percent: -20, reason: "felt heavy" }]);
    expect(exercise.finalWeight).toBe(32);
    expect(exercise.sets).toHaveLength(2);
    expect(exercise.sets[0]!.actualWeight).toBe(32);
    expect(exercise.sets[0]!.actualReps).toBe(20);
    expect(exercise.sets[1]!.completed).toBe(false);
  });

  it("persists a Circuit workout (one set per exercise) through the same repository, unprivileged relative to Classic Strength", async () => {
    const circuitInput: LoggedWorkoutInput = {
      workoutType: "circuit",
      name: "Full Body Circuit",
      status: "completed",
      dateIso: "2026-09-28",
      exercises: [
        {
          exerciseId: testExercise.id,
          role: "main",
          baseWeight: 60,
          finalWeight: 60,
          sets: [{ setNumber: 1, targetReps: 8, targetWeight: 60, actualReps: 8, actualWeight: 62.5, completed: true }],
        },
      ],
    };

    const saved = await saveWorkout(circuitInput);
    const fetched = await getWorkoutById(saved.id);
    expect(fetched!.workoutType).toBe("circuit");
    expect(fetched!.exercises[0]!.sets).toHaveLength(1);
  });

  it("rejects an invalid workout before writing anything", async () => {
    const invalid: LoggedWorkoutInput = { ...workoutInput, exercises: [] };
    await expect(saveWorkout(invalid)).rejects.toThrow(LoggedWorkoutValidationError);
    const summaries = await listWorkoutSummaries();
    expect(summaries).toHaveLength(0);
  });

  it("lists saved workouts newest-first as lightweight summaries", async () => {
    await saveWorkout({ ...workoutInput, dateIso: "2026-09-21" });
    await saveWorkout({ ...workoutInput, dateIso: "2026-09-28" });

    const summaries = await listWorkoutSummaries();
    expect(summaries).toHaveLength(2);
    expect(summaries[0]!.dateIso).toBe("2026-09-28");
    expect(summaries[1]!.dateIso).toBe("2026-09-21");
  });
});

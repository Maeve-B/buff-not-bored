/**
 * Integration tests against a real (local, throwaway) Postgres instance —
 * per ARCHITECTURE.md §9 ("packages/db | Vitest + a real (throwaway)
 * Postgres, or pg-mem"). Requires `DATABASE_URL` to point at a database
 * with this package's migrations applied (`pnpm prisma:migrate`); see
 * packages/db/.env.example.
 */

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Exercise, ExerciseCapabilityInput } from "@buff-not-bored/domain";
import { CapabilityValidationError } from "@buff-not-bored/domain";
import { prisma } from "../src/client.js";
import { findExerciseById, listExercises, upsertExercise } from "../src/repositories/exercise-repository.js";
import { getExerciseCapability, upsertExerciseCapability } from "../src/repositories/exercise-capability-repository.js";
import {
  getWorkoutById,
  listWorkoutSummaries,
  saveWorkoutSnapshot,
  WorkoutStatusRegressionError,
} from "../src/repositories/workout-repository.js";
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
  await prisma.exerciseCapability.deleteMany();
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

  it("saves a full workout (exercise + sets) by id and reads it back with the weight split intact", async () => {
    const saved = await saveWorkoutSnapshot("integration-workout-1", workoutInput);
    expect(saved.id).toBe("integration-workout-1");

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

    const saved = await saveWorkoutSnapshot("integration-circuit-1", circuitInput);
    const fetched = await getWorkoutById(saved.id);
    expect(fetched!.workoutType).toBe("circuit");
    expect(fetched!.exercises[0]!.sets).toHaveLength(1);
  });

  it("rejects an invalid workout before writing anything", async () => {
    const invalid: LoggedWorkoutInput = { ...workoutInput, exercises: [] };
    await expect(saveWorkoutSnapshot("integration-invalid-1", invalid)).rejects.toThrow(LoggedWorkoutValidationError);
    const summaries = await listWorkoutSummaries();
    expect(summaries).toHaveLength(0);
  });

  it("lists saved workouts newest-first as lightweight summaries", async () => {
    await saveWorkoutSnapshot("integration-workout-a", { ...workoutInput, dateIso: "2026-09-21" });
    await saveWorkoutSnapshot("integration-workout-b", { ...workoutInput, dateIso: "2026-09-28" });

    const summaries = await listWorkoutSummaries();
    expect(summaries).toHaveLength(2);
    expect(summaries[0]!.dateIso).toBe("2026-09-28");
    expect(summaries[1]!.dateIso).toBe("2026-09-21");
  });

  describe("saving the same session id repeatedly (start -> log -> complete)", () => {
    it("never creates a second row for the same id — the second save replaces, not appends", async () => {
      await saveWorkoutSnapshot("integration-same-id", { ...workoutInput, status: "in_progress" });
      await saveWorkoutSnapshot("integration-same-id", { ...workoutInput, status: "in_progress" });
      await saveWorkoutSnapshot("integration-same-id", { ...workoutInput, status: "completed" });

      const rows = await prisma.workout.findMany({ where: { id: "integration-same-id" } });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.status).toBe("completed");
    });

    it("replaces exercises/sets on each save rather than accumulating duplicates", async () => {
      // "Start": one exercise, unlogged (no actuals yet).
      const started: LoggedWorkoutInput = {
        ...workoutInput,
        status: "in_progress",
        exercises: [
          {
            ...workoutInput.exercises[0]!,
            sets: workoutInput.exercises[0]!.sets.map((set) => ({ ...set, actualWeight: undefined, actualReps: undefined, completed: false })),
          },
        ],
      };
      await saveWorkoutSnapshot("integration-replace", started);

      let fetched = await getWorkoutById("integration-replace");
      expect(fetched!.exercises).toHaveLength(1);
      expect(fetched!.exercises[0]!.sets[0]!.actualReps).toBeUndefined();

      // "Log a set": the same exercise, now with logged performance.
      await saveWorkoutSnapshot("integration-replace", workoutInput);

      fetched = await getWorkoutById("integration-replace");
      expect(fetched!.exercises).toHaveLength(1); // not 2 — the stale unlogged copy wasn't left behind
      expect(fetched!.exercises[0]!.sets[0]!.actualReps).toBe(20);

      const allExerciseRows = await prisma.workoutExercise.findMany({ where: { workoutId: "integration-replace" } });
      expect(allExerciseRows).toHaveLength(1);
    });
  });

  describe("status regression guard", () => {
    it("rejects completed -> in_progress and leaves the completed row untouched", async () => {
      await saveWorkoutSnapshot("integration-regress-1", { ...workoutInput, status: "completed" });

      await expect(saveWorkoutSnapshot("integration-regress-1", { ...workoutInput, status: "in_progress" })).rejects.toThrow(
        WorkoutStatusRegressionError,
      );

      // The rejected attempt must not have mutated anything — status, and the children, stay exactly as before.
      const fetched = await getWorkoutById("integration-regress-1");
      expect(fetched!.status).toBe("completed");
      expect(fetched!.exercises).toHaveLength(1);
    });

    it("allows in_progress -> in_progress", async () => {
      await saveWorkoutSnapshot("integration-regress-2", { ...workoutInput, status: "in_progress" });
      const saved = await saveWorkoutSnapshot("integration-regress-2", { ...workoutInput, status: "in_progress" });
      expect(saved.status).toBe("in_progress");
    });

    it("allows the normal in_progress -> completed transition", async () => {
      await saveWorkoutSnapshot("integration-regress-3", { ...workoutInput, status: "in_progress" });
      const saved = await saveWorkoutSnapshot("integration-regress-3", { ...workoutInput, status: "completed" });
      expect(saved.status).toBe("completed");
    });

    it("allows completed -> completed (an idempotent re-save, not a regression)", async () => {
      await saveWorkoutSnapshot("integration-regress-4", { ...workoutInput, status: "completed" });
      const saved = await saveWorkoutSnapshot("integration-regress-4", { ...workoutInput, status: "completed" });
      expect(saved.status).toBe("completed");
    });

    it("does not apply to a brand-new id — a fresh in_progress save is not a regression", async () => {
      const saved = await saveWorkoutSnapshot("integration-regress-5", { ...workoutInput, status: "in_progress" });
      expect(saved.status).toBe("in_progress");
    });
  });
});

describe("exercise capability repository", () => {
  beforeEach(async () => {
    await upsertExercise(testExercise);
  });

  it("returns undefined when no capability has ever been set", async () => {
    const found = await getExerciseCapability(testExercise.id);
    expect(found).toBeUndefined();
  });

  it("upserts a capability and reads it back, with updatedAt populated by the database", async () => {
    const input: ExerciseCapabilityInput = {
      exerciseId: testExercise.id,
      weight: 8,
      weightUnit: "kg",
      reps: 12,
      repsUnit: "reps",
      source: "manual",
      note: "felt strong today",
    };

    const saved = await upsertExerciseCapability(input);
    expect(saved).toMatchObject(input);
    expect(saved.updatedAt).toBeTruthy();

    const found = await getExerciseCapability(testExercise.id);
    expect(found).toEqual(saved);
  });

  it("can exist with zero workout history — nothing in the workouts tables is touched", async () => {
    await upsertExerciseCapability({ exerciseId: testExercise.id, reps: 15, repsUnit: "reps", source: "manual" });
    const workoutCount = await prisma.workout.count();
    expect(workoutCount).toBe(0);
  });

  it("upsert replaces the existing capability rather than creating a second row", async () => {
    await upsertExerciseCapability({ exerciseId: testExercise.id, weight: 8, weightUnit: "kg", reps: 12, repsUnit: "reps", source: "manual" });
    await upsertExerciseCapability({ exerciseId: testExercise.id, weight: 10, weightUnit: "kg", reps: 10, repsUnit: "reps", source: "manual" });

    const found = await getExerciseCapability(testExercise.id);
    expect(found?.weight).toBe(10);
    expect(found?.reps).toBe(10);

    const count = await prisma.exerciseCapability.count({ where: { exerciseId: testExercise.id } });
    expect(count).toBe(1);
  });

  it("preserves source: manual vs source: progression distinctly", async () => {
    await upsertExerciseCapability({ exerciseId: testExercise.id, weight: 8, weightUnit: "kg", source: "manual" });
    let found = await getExerciseCapability(testExercise.id);
    expect(found?.source).toBe("manual");

    await upsertExerciseCapability({ exerciseId: testExercise.id, weight: 8.5, weightUnit: "kg", source: "progression" });
    found = await getExerciseCapability(testExercise.id);
    expect(found?.source).toBe("progression");
  });

  it("rejects an empty capability before writing anything", async () => {
    const invalid = { exerciseId: testExercise.id, source: "manual" } as ExerciseCapabilityInput;
    await expect(upsertExerciseCapability(invalid)).rejects.toThrow(CapabilityValidationError);

    const found = await getExerciseCapability(testExercise.id);
    expect(found).toBeUndefined();
  });

  it("is kept in a completely separate table from Exercise — the exercise row itself is unaffected by a capability write", async () => {
    await upsertExerciseCapability({ exerciseId: testExercise.id, weight: 65, weightUnit: "kg", source: "manual" });

    const exercise = await findExerciseById(testExercise.id);
    expect(exercise?.startingWeight).toBe(60); // the catalog's own startingWeight, untouched by the personal capability write
  });
});

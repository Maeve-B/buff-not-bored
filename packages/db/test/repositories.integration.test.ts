/**
 * Integration tests against a real (local, throwaway) Postgres instance —
 * per ARCHITECTURE.md §9 ("packages/db | Vitest + a real (throwaway)
 * Postgres, or pg-mem"). Requires `DATABASE_URL` to point at a database
 * with this package's migrations applied (`pnpm prisma:migrate`); see
 * packages/db/.env.example.
 */

import { EXERCISE_PROFILES } from "@buff-not-bored/domain";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Exercise, ExerciseCapabilityInput } from "@buff-not-bored/domain";
import { CapabilityValidationError } from "@buff-not-bored/domain";
import { prisma } from "../src/client.js";
import { findExerciseById, listExercises, upsertExercise } from "../src/repositories/exercise-repository.js";
import {
  getExerciseCapability,
  getManualExerciseWeightLog,
  upsertExerciseCapability,
} from "../src/repositories/exercise-capability-repository.js";
import {
  getExerciseWeightHistory,
  getWorkoutById,
  listWorkoutSummaries,
  saveWorkoutSnapshot,
  WorkoutStatusRegressionError,
} from "../src/repositories/workout-repository.js";
import { LoggedWorkoutValidationError } from "../src/validation/logged-workout.schema.js";
import type { LoggedWorkoutInput } from "../src/types.js";

const testExercise: Exercise = {
  ...EXERCISE_PROFILES.squats,
  id: "test-back-squat",
  name: "Back Squat",
  programmeGroup: "legs",
  primaryMuscles: ["quads", "glutes"],
  secondaryMuscles: ["hamstrings"],
  movementPatterns: ["squat"],
  exerciseType: "compound",
  equipment: "barbell",
  location: "rack",
  prescribedReps: 8,
  repsUnit: "reps",
  progressionPercentage: 5,
  active: true,
};

async function resetTables(): Promise<void> {
  await prisma.workoutSet.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.exerciseWeightLog.deleteMany();
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
    await upsertExercise({ ...testExercise, prescribedReps: 6 });
    const found = await findExerciseById(testExercise.id);
    expect(found?.prescribedReps).toBe(6);
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

describe("getExerciseWeightHistory", () => {
  beforeEach(async () => {
    await upsertExercise(testExercise);
  });

  function oneSetWorkout(dateIso: string, actualWeight: number | undefined, completed: boolean): LoggedWorkoutInput {
    return {
      workoutType: "classic_strength",
      name: "Full Body Strength",
      status: "completed",
      dateIso,
      exercises: [
        {
          exerciseId: testExercise.id,
          role: "main",
          sets: [{ setNumber: 1, targetReps: 8, actualReps: 8, actualWeight, completed }],
        },
      ],
    };
  }

  it("returns an empty list when nothing has ever been logged", async () => {
    const history = await getExerciseWeightHistory(testExercise.id);
    expect(history).toEqual([]);
  });

  it("returns entries in chronological order regardless of save order", async () => {
    await saveWorkoutSnapshot("wh-2", oneSetWorkout("2026-09-28", 40, true));
    await saveWorkoutSnapshot("wh-1", oneSetWorkout("2026-09-21", 38, true));
    await saveWorkoutSnapshot("wh-3", oneSetWorkout("2026-10-05", 42, true));

    const history = await getExerciseWeightHistory(testExercise.id);
    expect(history).toEqual([
      { dateIso: "2026-09-21", weight: 38 },
      { dateIso: "2026-09-28", weight: 40 },
      { dateIso: "2026-10-05", weight: 42 },
    ]);
  });

  it("includes an increase, a decrease, and a repeated (unchanged) weight, all in the data", async () => {
    await saveWorkoutSnapshot("wh-week1", oneSetWorkout("2026-09-07", 40, true));
    await saveWorkoutSnapshot("wh-week2", oneSetWorkout("2026-09-14", 42.5, true)); // increase
    await saveWorkoutSnapshot("wh-week3", oneSetWorkout("2026-09-21", 42.5, true)); // unchanged
    await saveWorkoutSnapshot("wh-week4", oneSetWorkout("2026-09-28", 35, true)); // decrease

    const history = await getExerciseWeightHistory(testExercise.id);
    expect(history.map((e) => e.weight)).toEqual([40, 42.5, 42.5, 35]);
  });

  it("excludes sets from a workout that was never completed", async () => {
    await saveWorkoutSnapshot("wh-in-progress", { ...oneSetWorkout("2026-09-21", 40, true), status: "in_progress" });

    const history = await getExerciseWeightHistory(testExercise.id);
    expect(history).toEqual([]);
  });

  it("excludes individual sets that weren't completed, even within an otherwise completed workout", async () => {
    const input: LoggedWorkoutInput = {
      workoutType: "classic_strength",
      name: "Full Body Strength",
      status: "completed",
      dateIso: "2026-09-21",
      exercises: [
        {
          exerciseId: testExercise.id,
          role: "main",
          sets: [
            { setNumber: 1, targetReps: 8, actualReps: 8, actualWeight: 40, completed: true },
            { setNumber: 2, targetReps: 8, actualReps: 4, actualWeight: 40, completed: false },
          ],
        },
      ],
    };
    await saveWorkoutSnapshot("wh-mixed-sets", input);

    const history = await getExerciseWeightHistory(testExercise.id);
    expect(history).toHaveLength(1);
  });

  it("excludes a completed set that has no actual weight recorded", async () => {
    await saveWorkoutSnapshot("wh-no-weight", oneSetWorkout("2026-09-21", undefined, true));

    const history = await getExerciseWeightHistory(testExercise.id);
    expect(history).toEqual([]);
  });

  it("is scoped to the requested exercise only", async () => {
    const otherExercise: Exercise = { ...testExercise, id: "integration-weight-history-other" };
    await upsertExercise(otherExercise);
    const input: LoggedWorkoutInput = {
      ...oneSetWorkout("2026-09-21", 99, true),
      exercises: [{ exerciseId: otherExercise.id, role: "main", sets: [{ setNumber: 1, targetReps: 8, actualReps: 8, actualWeight: 99, completed: true }] }],
    };
    await saveWorkoutSnapshot("wh-other-exercise", input);

    const history = await getExerciseWeightHistory(testExercise.id);
    expect(history).toEqual([]);
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
    expect(exercise).toEqual({ ...testExercise, needsReview: false }); // the catalog entry, untouched by the personal capability write
  });

  describe("append-only weight log (alongside the singleton capability)", () => {
    const loaded = (weight: number): ExerciseCapabilityInput => ({
      exerciseId: testExercise.id,
      weight,
      weightUnit: "kg",
      reps: 8,
      repsUnit: "reps",
      source: "manual",
    });

    it("returns an empty log when no weight has ever been saved", async () => {
      expect(await getManualExerciseWeightLog(testExercise.id)).toEqual([]);
    });

    it("the first weight save creates the first log entry, carrying unit, source and note", async () => {
      await upsertExerciseCapability({ ...loaded(8), note: "first time" });

      const rows = await prisma.exerciseWeightLog.findMany({ where: { exerciseId: testExercise.id } });
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ weight: 8, weightUnit: "kg", source: "manual", note: "first time" });
      expect(rows[0]!.recordedAt).toBeInstanceOf(Date);
    });

    it("a second save appends a second log row, while the capability table still holds exactly one row", async () => {
      await upsertExerciseCapability(loaded(8));
      await upsertExerciseCapability(loaded(10));

      expect(await prisma.exerciseWeightLog.count({ where: { exerciseId: testExercise.id } })).toBe(2);
      expect(await prisma.exerciseCapability.count({ where: { exerciseId: testExercise.id } })).toBe(1);
      expect((await getExerciseCapability(testExercise.id))?.weight).toBe(10);
    });

    it("preserves an increase, an unchanged repeat, and a decrease, in save order", async () => {
      for (const weight of [40, 42.5, 42.5, 35]) {
        await upsertExerciseCapability(loaded(weight));
      }
      const log = await getManualExerciseWeightLog(testExercise.id);
      expect(log.map((e) => e.weight)).toEqual([40, 42.5, 42.5, 35]);
    });

    it("a reps-/duration-only save writes no log entry, and doesn't erase earlier log entries", async () => {
      await upsertExerciseCapability(loaded(20));
      await upsertExerciseCapability({ exerciseId: testExercise.id, reps: 15, repsUnit: "reps", source: "manual" });
      await upsertExerciseCapability({ exerciseId: testExercise.id, duration: 60, source: "manual" });

      expect((await getManualExerciseWeightLog(testExercise.id)).map((e) => e.weight)).toEqual([20]);
      expect((await getExerciseCapability(testExercise.id))?.weight).toBeUndefined(); // current value replaced; history kept
    });

    it("a rejected (invalid) save writes nothing to the log", async () => {
      const invalid = { exerciseId: testExercise.id, weight: 10, source: "manual" } as ExerciseCapabilityInput; // weight without weightUnit
      await expect(upsertExerciseCapability(invalid)).rejects.toThrow(CapabilityValidationError);
      expect(await prisma.exerciseWeightLog.count()).toBe(0);
    });

    it("returns { dateIso, weight } entries in chronological order", async () => {
      await upsertExerciseCapability(loaded(8));
      await upsertExerciseCapability(loaded(9));
      const log = await getManualExerciseWeightLog(testExercise.id);

      expect(log.every((e) => Object.keys(e).sort().join() === "dateIso,weight")).toBe(true);
      expect(log.every((e) => !Number.isNaN(Date.parse(e.dateIso)))).toBe(true);
      const dates = log.map((e) => e.dateIso);
      expect(dates).toEqual([...dates].sort());
    });

    it("is scoped to the requested exercise only", async () => {
      const other: Exercise = { ...testExercise, id: "integration-weight-log-other" };
      await upsertExercise(other);
      await upsertExerciseCapability({ ...loaded(99), exerciseId: other.id });
      await upsertExerciseCapability(loaded(8));

      expect((await getManualExerciseWeightLog(testExercise.id)).map((e) => e.weight)).toEqual([8]);
      expect((await getManualExerciseWeightLog(other.id)).map((e) => e.weight)).toEqual([99]);
    });
  });
});

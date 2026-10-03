/**
 * End-to-end check of the persistence slice against a real (local,
 * throwaway) Postgres — run from apps/web's own process, which is the
 * scenario that matters: `packages/db`'s PrismaClient must find
 * DATABASE_URL via its own .env regardless of the caller's cwd (see
 * packages/db/src/client.ts). Everything else in this test suite mocks
 * `@/lib/actions/save-workout`; this file deliberately doesn't, so the
 * real action, the real mapper, and the real repository layer all run.
 */

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getWorkoutById, prisma } from "@buff-not-bored/db";
import { persistWorkoutSnapshot } from "@/lib/actions/save-workout";
import type { CircuitWorkoutSnapshot, StrengthWorkoutSnapshot } from "@/lib/types";
import type { Exercise, PlannedExercise, StrengthExercise, StrengthSession, WorkoutSession } from "@buff-not-bored/domain";

const testSquats: Exercise = {
  id: "integration-test-squats",
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

async function resetTables(): Promise<void> {
  await prisma.workoutSet.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.exercise.deleteMany({ where: { id: testSquats.id } });
}

beforeEach(resetTables);
afterAll(async () => {
  await resetTables();
  await prisma.$disconnect();
});

describe("persistWorkoutSnapshot — real database", () => {
  const planned: PlannedExercise = { exercise: testSquats, role: "main", prescribedWeight: 20, prescribedReps: 20, repsUnit: "reps" };
  const circuitSession: WorkoutSession = {
    warmup: { steps: [], targetDuration: { minMinutes: 5, maxMinutes: 10 } },
    mainExercises: [planned],
    cooldown: { targetAreas: [], targetDuration: { minMinutes: 5, maxMinutes: 10 } },
    targetSessionDuration: { minMinutes: 45, maxMinutes: 50 },
  };

  it("persists a Circuit workout, upserting its exercise first, with the weight split preserved", async () => {
    const snapshot: CircuitWorkoutSnapshot = {
      id: "integration-circuit-1",
      dateIso: "2026-10-03",
      workoutName: "Full Body",
      workoutType: "circuit",
      status: "completed",
      session: circuitSession,
      setLogs: [{ exerciseId: testSquats.id, actualWeight: 22.5, actualReps: 21, completed: true, loggedAt: Date.now() }],
    };

    const result = await persistWorkoutSnapshot(snapshot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const exerciseRow = await prisma.exercise.findUnique({ where: { id: testSquats.id } });
    expect(exerciseRow).not.toBeNull();

    const record = await getWorkoutById(result.id);
    expect(record).toBeDefined();
    expect(record!.workoutType).toBe("circuit");
    const exercise = record!.exercises[0]!;
    expect(exercise.baseWeight).toBe(20);
    expect(exercise.finalWeight).toBe(20);
    expect(exercise.sets[0]!.actualWeight).toBe(22.5);
    expect(exercise.sets[0]!.actualReps).toBe(21);
  });

  it("persists a Classic Strength workout through the identical action, with multiple sets and an adjustment preserved", async () => {
    const strengthExercise: StrengthExercise = {
      exercise: testSquats,
      role: "main",
      restSeconds: 90,
      recommendation: { baseWeight: 40, adjustments: [{ type: "percentage", percent: -20, reason: "felt heavy" }], finalWeight: 32 },
      sets: [
        { setNumber: 1, targetReps: 20, targetWeight: 32, actualReps: 20, actualWeight: 32, completed: true },
        { setNumber: 2, targetReps: 20, targetWeight: 32, actualReps: 18, actualWeight: 32, completed: false },
      ],
    };
    const snapshot: StrengthWorkoutSnapshot = {
      id: "integration-strength-1",
      dateIso: "2026-10-03",
      workoutName: "Full Body Strength",
      workoutType: "classic_strength",
      status: "completed",
      session: { exercises: [strengthExercise] },
    };

    const result = await persistWorkoutSnapshot(snapshot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const record = await getWorkoutById(result.id);
    expect(record!.workoutType).toBe("classic_strength");
    const exercise = record!.exercises[0]!;
    expect(exercise.baseWeight).toBe(40);
    expect(exercise.adjustments).toEqual([{ type: "percentage", percent: -20, reason: "felt heavy" }]);
    expect(exercise.finalWeight).toBe(32);
    expect(exercise.sets).toHaveLength(2);
  });

  it("returns a typed failure (not a silent success) when the workout fails validation", async () => {
    const malformed: CircuitWorkoutSnapshot = {
      id: "integration-bad",
      dateIso: "2026-10-03",
      workoutName: "Full Body",
      workoutType: "circuit",
      status: "in_progress",
      session: {
        warmup: { steps: [], targetDuration: { minMinutes: 5, maxMinutes: 10 } },
        mainExercises: [], // no exercises at all -> fails loggedWorkoutSchema
        cooldown: { targetAreas: [], targetDuration: { minMinutes: 5, maxMinutes: 10 } },
        targetSessionDuration: { minMinutes: 45, maxMinutes: 50 },
      },
      setLogs: [],
    };

    const result = await persistWorkoutSnapshot(malformed);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/at least one exercise/);

    const rows = await prisma.workout.findMany({ where: { id: "integration-bad" } });
    expect(rows).toHaveLength(0);
  });

  it("start -> log a set -> complete, via the real action end-to-end, produces exactly one row, finally marked completed", async () => {
    const id = "integration-lifecycle-1";
    const unlogged: CircuitWorkoutSnapshot = {
      id,
      dateIso: "2026-10-03",
      workoutName: "Full Body",
      workoutType: "circuit",
      status: "in_progress",
      session: circuitSession,
      setLogs: [],
    };
    await persistWorkoutSnapshot(unlogged); // "Start Workout"

    const logged: CircuitWorkoutSnapshot = {
      ...unlogged,
      setLogs: [{ exerciseId: testSquats.id, actualWeight: 20, actualReps: 20, completed: true, loggedAt: Date.now() }],
    };
    await persistWorkoutSnapshot(logged); // one logged set, still in progress

    await persistWorkoutSnapshot({ ...logged, status: "completed" }); // "Finish Workout"

    const rows = await prisma.workout.findMany({ where: { id } });
    expect(rows).toHaveLength(1); // never duplicated across the three saves
    expect(rows[0]!.status).toBe("completed");

    const record = await getWorkoutById(id);
    expect(record!.exercises).toHaveLength(1); // not accumulated across saves
    expect(record!.exercises[0]!.sets[0]!.actualReps).toBe(20);
  });

  it("surfaces a completed -> in_progress regression as a typed failure, not a thrown exception or a silent success", async () => {
    const id = "integration-regression-1";
    const completed: CircuitWorkoutSnapshot = {
      id,
      dateIso: "2026-10-03",
      workoutName: "Full Body",
      workoutType: "circuit",
      status: "completed",
      session: circuitSession,
      setLogs: [{ exerciseId: testSquats.id, actualWeight: 20, actualReps: 20, completed: true, loggedAt: Date.now() }],
    };
    const firstResult = await persistWorkoutSnapshot(completed);
    expect(firstResult.ok).toBe(true);

    // A stray/future call tries to save the same workout back as in_progress.
    const result = await persistWorkoutSnapshot({ ...completed, status: "in_progress" });

    expect(result.ok).toBe(false); // the action's existing try/catch already turns the repository's
    if (result.ok) return; // thrown WorkoutStatusRegressionError into this — no new code needed there.
    expect(result.error).toMatch(/already completed/);

    // The database still shows the workout as completed — the rejected attempt changed nothing.
    const record = await getWorkoutById(id);
    expect(record!.status).toBe("completed");
  });
});

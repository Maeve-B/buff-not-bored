/**
 * End-to-end check of the exercise capability actions against a real
 * (local, throwaway) Postgres — same rationale as
 * test/save-workout.integration.test.ts: PrismaClient must resolve its own
 * DATABASE_URL regardless of this process's cwd. Everything else in this
 * suite mocks `@/lib/actions/exercise-capability`
 * (test/exercise-capability-flow.test.tsx); this file deliberately doesn't.
 */

import { EXERCISE_PROFILES } from "@buff-not-bored/domain";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, STARTING_WEIGHT_LOG_NOTE, upsertExercise } from "@buff-not-bored/db";
import type { Exercise } from "@buff-not-bored/domain";
import {
  loadCurrentWeights,
  loadExerciseCapability,
  saveExerciseCapability,
  saveStartingWeight,
} from "@/lib/actions/exercise-capability";

const testExercise: Exercise = {
  ...EXERCISE_PROFILES.squats,
  id: "integration-test-capability-exercise",
  name: "Integration Test Row",
  programmeGroup: "legs",
  primaryMuscles: ["quads"],
  secondaryMuscles: [],
  movementPatterns: ["squat"],
  exerciseType: "compound",
  equipment: "barbell",
  location: "rack",
  prescribedReps: 20,
  repsUnit: "reps",
  progressionPercentage: 5,
  active: true,
};

async function resetTables(): Promise<void> {
  await prisma.exerciseWeightLog.deleteMany({ where: { exerciseId: testExercise.id } });
  await prisma.exerciseCapability.deleteMany({ where: { exerciseId: testExercise.id } });
  await prisma.exercise.deleteMany({ where: { id: testExercise.id } });
}

beforeEach(async () => {
  await resetTables();
  await upsertExercise(testExercise);
});

afterAll(async () => {
  await resetTables();
  await prisma.$disconnect();
});

describe("exercise capability actions — real database", () => {
  it("returns undefined when no capability has ever been set", async () => {
    const capability = await loadExerciseCapability(testExercise.id);
    expect(capability).toBeUndefined();
  });

  it("saves a manual edit, then loads it back unchanged", async () => {
    const result = await saveExerciseCapability({
      exerciseId: testExercise.id,
      weight: 62.5,
      weightUnit: "kg",
      reps: 6,
      repsUnit: "reps",
      source: "manual",
      note: "felt strong today",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.capability.source).toBe("manual");

    const loaded = await loadExerciseCapability(testExercise.id);
    expect(loaded).toMatchObject({
      exerciseId: testExercise.id,
      weight: 62.5,
      weightUnit: "kg",
      reps: 6,
      repsUnit: "reps",
      source: "manual",
      note: "felt strong today",
    });
  });

  it("upserts rather than duplicating on a second edit", async () => {
    await saveExerciseCapability({ exerciseId: testExercise.id, reps: 10, repsUnit: "reps", source: "manual" });
    await saveExerciseCapability({ exerciseId: testExercise.id, reps: 12, repsUnit: "reps", source: "manual" });

    const rows = await prisma.exerciseCapability.findMany({ where: { exerciseId: testExercise.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.reps).toBe(12);
  });

  it("returns a typed failure, not a thrown exception, when the edit is empty", async () => {
    const result = await saveExerciseCapability({ exerciseId: testExercise.id, source: "manual" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/at least one of weight, reps, or duration/);

    const rows = await prisma.exerciseCapability.findMany({ where: { exerciseId: testExercise.id } });
    expect(rows).toHaveLength(0);
  });
});

describe("starting weight actions — real database (S-002)", () => {
  it("records a first-use starting weight, which then shows up in your current weights", async () => {
    expect(await saveStartingWeight(testExercise.id, 20.25)).toEqual({ ok: true, saved: true });

    expect(await loadExerciseCapability(testExercise.id)).toMatchObject({ weight: 20.25, weightUnit: "kg", source: "manual" });
    expect((await loadCurrentWeights())[testExercise.id]).toBe(20.25);
  });

  it("keeps reps and note already saved, and gives the history entry its own note", async () => {
    await saveExerciseCapability({ exerciseId: testExercise.id, reps: 8, repsUnit: "reps", source: "manual", note: "felt solid" });
    await saveStartingWeight(testExercise.id, 30);
    expect(await loadExerciseCapability(testExercise.id)).toMatchObject({ weight: 30, reps: 8, repsUnit: "reps", note: "felt solid" });
    const logs = await prisma.exerciseWeightLog.findMany({ where: { exerciseId: testExercise.id } });
    expect(logs.map((log) => log.note)).toEqual([STARTING_WEIGHT_LOG_NOTE]);
  });

  it("lets only one of two simultaneous first-use saves through", async () => {
    const results = await Promise.all([saveStartingWeight(testExercise.id, 20), saveStartingWeight(testExercise.id, 25)]);
    const saved = results.filter((result) => result.ok && result.saved);
    expect(saved).toHaveLength(1);
    expect(await prisma.exerciseWeightLog.count({ where: { exerciseId: testExercise.id } })).toBe(1);
    expect([20, 25]).toContain((await loadExerciseCapability(testExercise.id))?.weight);
  });

  it("never overwrites a weight you already have, and writes no history entry", async () => {
    await saveExerciseCapability({ exerciseId: testExercise.id, weight: 40, weightUnit: "kg", source: "manual" });

    expect(await saveStartingWeight(testExercise.id, 25)).toEqual({ ok: true, saved: false });
    expect((await loadExerciseCapability(testExercise.id))?.weight).toBe(40);
    expect(await prisma.exerciseWeightLog.count({ where: { exerciseId: testExercise.id } })).toBe(1);
  });
});

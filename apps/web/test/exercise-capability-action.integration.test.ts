/**
 * End-to-end check of the exercise capability actions against a real
 * (local, throwaway) Postgres — same rationale as
 * test/save-workout.integration.test.ts: PrismaClient must resolve its own
 * DATABASE_URL regardless of this process's cwd. Everything else in this
 * suite mocks `@/lib/actions/exercise-capability`
 * (test/exercise-capability-flow.test.tsx); this file deliberately doesn't.
 */

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, upsertExercise } from "@buff-not-bored/db";
import type { Exercise } from "@buff-not-bored/domain";
import { loadExerciseCapability, saveExerciseCapability } from "@/lib/actions/exercise-capability";

const testExercise: Exercise = {
  id: "integration-test-capability-exercise",
  name: "Integration Test Row",
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

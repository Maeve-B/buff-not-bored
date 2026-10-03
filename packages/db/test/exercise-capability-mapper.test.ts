import { describe, expect, it } from "vitest";
import type { ExerciseCapabilityInput } from "@buff-not-bored/domain";
import { toDomainExerciseCapability, toExerciseCapabilityRow } from "../src/mappers/exercise-capability-mapper.js";

const loadedCapability: ExerciseCapabilityInput = {
  exerciseId: "db-bench-press",
  weight: 8,
  weightUnit: "kg",
  reps: 12,
  repsUnit: "reps",
  source: "manual",
  note: "felt strong today",
};

const bodyweightCapability: ExerciseCapabilityInput = {
  exerciseId: "pull-up",
  reps: 15,
  repsUnit: "reps",
  source: "manual",
};

describe("exercise capability mapper", () => {
  it("maps a fully-populated capability to row scalars, with undefined fields becoming null", () => {
    const row = toExerciseCapabilityRow(loadedCapability);
    expect(row).toEqual({
      exerciseId: "db-bench-press",
      weight: 8,
      weightUnit: "kg",
      reps: 12,
      repsUnit: "reps",
      duration: null,
      source: "manual",
      note: "felt strong today",
    });
  });

  it("maps absent optional fields (bodyweight capability) to null on the row", () => {
    const row = toExerciseCapabilityRow(bodyweightCapability);
    expect(row.weight).toBeNull();
    expect(row.weightUnit).toBeNull();
    expect(row.duration).toBeNull();
    expect(row.note).toBeNull();
  });

  it("round-trips row -> domain, mapping null back to undefined", () => {
    const fakeRow = {
      id: "capability-1",
      exerciseId: "pull-up",
      weight: null,
      weightUnit: null,
      reps: 15,
      repsUnit: "reps",
      duration: null,
      source: "manual",
      note: null,
      createdAt: new Date("2026-10-03T12:00:00.000Z"),
      updatedAt: new Date("2026-10-03T12:00:00.000Z"),
    };

    const domain = toDomainExerciseCapability(fakeRow);
    expect(domain).toEqual({
      exerciseId: "pull-up",
      weight: undefined,
      weightUnit: undefined,
      reps: 15,
      repsUnit: "reps",
      duration: undefined,
      source: "manual",
      note: undefined,
      updatedAt: "2026-10-03T12:00:00.000Z",
    });
  });

  it("never includes id/createdAt/updatedAt in the write-side row — those are database-managed", () => {
    const row = toExerciseCapabilityRow(loadedCapability);
    expect(row).not.toHaveProperty("id");
    expect(row).not.toHaveProperty("createdAt");
    expect(row).not.toHaveProperty("updatedAt");
  });
});

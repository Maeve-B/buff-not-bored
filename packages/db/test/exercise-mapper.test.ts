import { describe, expect, it } from "vitest";
import type { Exercise } from "@buff-not-bored/domain";
import { toDomainExercise, toExerciseRow } from "../src/mappers/exercise-mapper.js";

const fullExercise: Exercise = {
  id: "back-squat",
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
  notes: "keep it simple",
  needsReview: false,
};

const bodyweightExercise: Exercise = {
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

describe("exercise mapper", () => {
  it("round-trips a fully-populated exercise through row <-> domain unchanged", () => {
    const row = toExerciseRow(fullExercise);
    const back = toDomainExercise(row);
    expect(back).toEqual(fullExercise);
  });

  it("maps a bodyweight exercise's absent optional fields to undefined, not null, on the way back", () => {
    const row = toExerciseRow(bodyweightExercise);
    expect(row.startingWeight).toBeNull();
    expect(row.weightUnit).toBeNull();
    expect(row.prescribedReps).toBeNull();

    const back = toDomainExercise(row);
    expect(back.startingWeight).toBeUndefined();
    expect(back.weightUnit).toBeUndefined();
    expect(back.prescribedReps).toBeUndefined();
    // needsReview defaults to false at the row level even though the domain object leaves it unset.
    expect(back).toEqual({ ...bodyweightExercise, needsReview: false });
  });

  it("defaults needsReview to false when the domain value is absent", () => {
    const row = toExerciseRow(bodyweightExercise);
    expect(row.needsReview).toBe(false);
  });
});

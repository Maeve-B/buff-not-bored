import { describe, expect, it } from "vitest";
import { toDomainLoggedWorkout, toWorkoutCreateInput, type WorkoutRow } from "../src/mappers/workout-mapper.js";
import type { LoggedWorkoutInput } from "../src/types.js";

const input: LoggedWorkoutInput = {
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

describe("toWorkoutCreateInput", () => {
  it("assigns each exercise a sequential order matching its position in the input array", () => {
    const twoExercise: LoggedWorkoutInput = {
      ...input,
      exercises: [input.exercises[0]!, { ...input.exercises[0]!, exerciseId: "bench-press" }],
    };
    const created = toWorkoutCreateInput(twoExercise);
    const creates = created.exercises!.create as Array<{ order: number; exercise: { connect: { id: string } } }>;
    expect(creates[0]?.order).toBe(0);
    expect(creates[0]?.exercise.connect.id).toBe("back-squat");
    expect(creates[1]?.order).toBe(1);
    expect(creates[1]?.exercise.connect.id).toBe("bench-press");
  });

  it("converts absent optional fields to null, not undefined, for Prisma's optional scalars", () => {
    const created = toWorkoutCreateInput({ ...input, programmeId: undefined, weekNumber: undefined });
    expect(created.programmeId).toBeNull();
    expect(created.weekNumber).toBeNull();
  });

  it("defaults adjustments to an empty array rather than leaving the JSON column unset", () => {
    const created = toWorkoutCreateInput({
      ...input,
      exercises: [{ ...input.exercises[0]!, adjustments: undefined }],
    });
    const creates = created.exercises!.create as Array<{ adjustments: unknown }>;
    expect(creates[0]?.adjustments).toEqual([]);
  });
});

describe("toDomainLoggedWorkout", () => {
  const fakeRow: WorkoutRow = {
    id: "workout-1",
    workoutType: "classic_strength",
    name: "Full Body Strength",
    status: "completed",
    dateIso: new Date("2026-09-28T00:00:00.000Z"),
    programmeId: "8-week-strength",
    weekNumber: 1,
    scheduledWorkoutId: "w1-mon",
    createdAt: new Date("2026-09-28T18:00:00.000Z"),
    updatedAt: new Date("2026-09-28T18:00:00.000Z"),
    exercises: [
      {
        id: "we-1",
        workoutId: "workout-1",
        exerciseId: "back-squat",
        role: "main",
        order: 0,
        restSeconds: 90,
        baseWeight: 40,
        adjustments: [{ type: "percentage", percent: -20, reason: "felt heavy" }],
        finalWeight: 32,
        sets: [
          {
            id: "set-1",
            workoutExerciseId: "we-1",
            setNumber: 1,
            targetReps: 20,
            repsUnit: null,
            targetDuration: null,
            targetWeight: 32,
            actualWeight: 32,
            actualReps: 20,
            actualDuration: null,
            completed: true,
            loggedAt: new Date("2026-09-28T18:05:00.000Z"),
          },
        ],
      },
    ],
  };

  it("preserves the base/adjustments/final weight split distinctly from each set's actual logged performance", () => {
    const record = toDomainLoggedWorkout(fakeRow);
    const exercise = record.exercises[0]!;
    expect(exercise.baseWeight).toBe(40);
    expect(exercise.adjustments).toEqual([{ type: "percentage", percent: -20, reason: "felt heavy" }]);
    expect(exercise.finalWeight).toBe(32);

    const set = exercise.sets[0]!;
    expect(set.targetWeight).toBe(32);
    expect(set.actualWeight).toBe(32);
  });

  it("maps null relation-level scalars back to undefined, not null", () => {
    const record = toDomainLoggedWorkout(fakeRow);
    expect(record.exercises[0]!.sets[0]!.repsUnit).toBeUndefined();
    expect(record.exercises[0]!.sets[0]!.targetDuration).toBeUndefined();
  });

  it("formats dateIso back as a plain ISO date, not a full timestamp", () => {
    const record = toDomainLoggedWorkout(fakeRow);
    expect(record.dateIso).toBe("2026-09-28");
  });
});

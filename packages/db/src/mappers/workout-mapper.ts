/**
 * `LoggedWorkoutInput`/`LoggedWorkoutRecord` (src/types.ts) <-> Prisma
 * `Workout` rows (with their `exercises`/`sets` relations). Pure mapping
 * functions, unit-tested without a database connection (req. 15).
 */

import { Prisma } from "@prisma/client";
import type { WeightAdjustment, RepsUnit, SlotRole, WorkoutStatus, WorkoutType } from "@buff-not-bored/domain";
import type { LoggedSetInput, LoggedSetRecord, LoggedWorkoutExerciseInput, LoggedWorkoutExerciseRecord, LoggedWorkoutInput, LoggedWorkoutRecord } from "../types.js";

const workoutWithRelations = Prisma.validator<Prisma.WorkoutDefaultArgs>()({
  include: { exercises: { include: { sets: true }, orderBy: { order: "asc" } } },
});
export type WorkoutRow = Prisma.WorkoutGetPayload<typeof workoutWithRelations>;
export type WorkoutExerciseRow = WorkoutRow["exercises"][number];
export type WorkoutSetRow = WorkoutExerciseRow["sets"][number];

function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null || value === undefined ? undefined : value;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds the create/update halves of an upsert-by-id write: the same
 * exercises/sets payload is used for both branches, so a save against an
 * id that already exists fully replaces its exercises/sets (via the
 * update branch's `deleteMany` + `create`, see repositories/workout-
 * repository.ts) rather than appending to them. This is what lets the same
 * session id be saved repeatedly (start, each logged set, completion)
 * without ever producing a duplicate row or stale leftover children.
 */
export function toWorkoutUpsertInput(
  id: string,
  input: LoggedWorkoutInput,
): { create: Prisma.WorkoutCreateInput; update: Prisma.WorkoutUpdateInput } {
  const scalars = {
    workoutType: input.workoutType,
    name: input.name,
    status: input.status,
    dateIso: new Date(input.dateIso),
    programmeId: input.programmeId ?? null,
    weekNumber: input.weekNumber ?? null,
    scheduledWorkoutId: input.scheduledWorkoutId ?? null,
  };
  const exerciseCreates = input.exercises.map((exercise, index) => toWorkoutExerciseCreateInput(exercise, index));

  return {
    create: { id, ...scalars, exercises: { create: exerciseCreates } },
    update: { ...scalars, exercises: { deleteMany: {}, create: exerciseCreates } },
  };
}

function toWorkoutExerciseCreateInput(
  exercise: LoggedWorkoutExerciseInput,
  order: number,
): Prisma.WorkoutExerciseCreateWithoutWorkoutInput {
  return {
    exercise: { connect: { id: exercise.exerciseId } },
    role: exercise.role,
    order,
    restSeconds: exercise.restSeconds ?? null,
    baseWeight: exercise.baseWeight ?? null,
    // Prisma's Json input type doesn't accept `undefined` directly.
    adjustments: (exercise.adjustments ?? []) as unknown as Prisma.InputJsonValue,
    finalWeight: exercise.finalWeight ?? null,
    sets: { create: exercise.sets.map(toWorkoutSetCreateInput) },
  };
}

function toWorkoutSetCreateInput(set: LoggedSetInput): Prisma.WorkoutSetCreateWithoutWorkoutExerciseInput {
  return {
    setNumber: set.setNumber,
    targetReps: set.targetReps ?? null,
    repsUnit: set.repsUnit ?? null,
    targetDuration: set.targetDuration ?? null,
    targetWeight: set.targetWeight ?? null,
    actualWeight: set.actualWeight ?? null,
    actualReps: set.actualReps ?? null,
    actualDuration: set.actualDuration ?? null,
    completed: set.completed,
    loggedAt: set.loggedAt ? new Date(set.loggedAt) : null,
  };
}

function toDomainSet(row: WorkoutSetRow): LoggedSetRecord {
  return {
    id: row.id,
    setNumber: row.setNumber,
    targetReps: nullToUndefined(row.targetReps),
    repsUnit: nullToUndefined(row.repsUnit) as RepsUnit | undefined,
    targetDuration: nullToUndefined(row.targetDuration),
    targetWeight: nullToUndefined(row.targetWeight),
    actualWeight: nullToUndefined(row.actualWeight),
    actualReps: nullToUndefined(row.actualReps),
    actualDuration: nullToUndefined(row.actualDuration),
    completed: row.completed,
    loggedAt: row.loggedAt ? row.loggedAt.toISOString() : undefined,
  };
}

function toDomainWorkoutExercise(row: WorkoutExerciseRow): LoggedWorkoutExerciseRecord {
  return {
    id: row.id,
    order: row.order,
    exerciseId: row.exerciseId,
    role: row.role as SlotRole,
    restSeconds: nullToUndefined(row.restSeconds),
    baseWeight: nullToUndefined(row.baseWeight),
    adjustments: (row.adjustments ?? []) as unknown as WeightAdjustment[],
    finalWeight: nullToUndefined(row.finalWeight),
    sets: row.sets.map(toDomainSet),
  };
}

/** Row (with relations) -> domain-shaped record. Assumes the row was written via toWorkoutCreateInput (or passed loggedWorkoutSchema validation). */
export function toDomainLoggedWorkout(row: WorkoutRow): LoggedWorkoutRecord {
  return {
    id: row.id,
    workoutType: row.workoutType as WorkoutType,
    name: row.name,
    status: row.status as WorkoutStatus,
    dateIso: isoDate(row.dateIso),
    programmeId: nullToUndefined(row.programmeId),
    weekNumber: nullToUndefined(row.weekNumber),
    scheduledWorkoutId: nullToUndefined(row.scheduledWorkoutId),
    exercises: row.exercises.map(toDomainWorkoutExercise),
  };
}

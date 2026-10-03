/**
 * Typed query functions over `workouts`/`workout_exercises`/`workout_sets` —
 * return the domain-shaped `LoggedWorkoutRecord`/`LoggedWorkoutSummary`
 * (src/types.ts), never raw Prisma rows.
 *
 * Not wired into apps/web yet (req. 8) — this is the boundary a future
 * Server Action calls into, per ARCHITECTURE.md §6.
 */

import { prisma } from "../client.js";
import { toDomainLoggedWorkout, toWorkoutCreateInput } from "../mappers/workout-mapper.js";
import { validateLoggedWorkout } from "../validation/logged-workout.schema.js";
import type { LoggedWorkoutInput, LoggedWorkoutRecord, LoggedWorkoutSummary } from "../types.js";

const withRelations = {
  exercises: { include: { sets: true }, orderBy: { order: "asc" as const } },
};

/** Persists a full workout (exercises + sets) in one write. Validates shape/invariants first — see validation/logged-workout.schema.ts. */
export async function saveWorkout(input: LoggedWorkoutInput): Promise<LoggedWorkoutRecord> {
  validateLoggedWorkout(input);
  const row = await prisma.workout.create({
    data: toWorkoutCreateInput(input),
    include: withRelations,
  });
  return toDomainLoggedWorkout(row);
}

export async function getWorkoutById(id: string): Promise<LoggedWorkoutRecord | undefined> {
  const row = await prisma.workout.findUnique({ where: { id }, include: withRelations });
  return row ? toDomainLoggedWorkout(row) : undefined;
}

/** Lightweight list projection — no per-set detail, for future list views (not the History screen itself — req. 11). */
export async function listWorkoutSummaries(): Promise<LoggedWorkoutSummary[]> {
  const rows = await prisma.workout.findMany({
    orderBy: { dateIso: "desc" },
    select: { id: true, workoutType: true, name: true, status: true, dateIso: true },
  });
  return rows.map((row) => ({
    id: row.id,
    workoutType: row.workoutType as LoggedWorkoutSummary["workoutType"],
    name: row.name,
    status: row.status as LoggedWorkoutSummary["status"],
    dateIso: row.dateIso.toISOString().slice(0, 10),
  }));
}

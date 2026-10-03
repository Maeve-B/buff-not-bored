/**
 * Typed query functions over `workouts`/`workout_exercises`/`workout_sets` —
 * return the domain-shaped `LoggedWorkoutRecord`/`LoggedWorkoutSummary`
 * (src/types.ts), never raw Prisma rows.
 *
 * Not wired into apps/web yet (req. 8) — this is the boundary a future
 * Server Action calls into, per ARCHITECTURE.md §6.
 */

import { prisma } from "../client.js";
import { toDomainLoggedWorkout, toWorkoutUpsertInput } from "../mappers/workout-mapper.js";
import { validateLoggedWorkout } from "../validation/logged-workout.schema.js";
import type { LoggedWorkoutInput, LoggedWorkoutRecord, LoggedWorkoutSummary } from "../types.js";

const withRelations = {
  exercises: { include: { sets: true }, orderBy: { order: "asc" as const } },
};

/**
 * Thrown when a save would move a workout backward from "completed" to an
 * earlier status. This is an architectural invariant, not something that
 * happens to hold because of how the current UI happens to be wired — see
 * saveWorkoutSnapshot's doc comment.
 */
export class WorkoutStatusRegressionError extends Error {}

/**
 * Upserts a workout snapshot by a CLIENT-SUPPLIED stable id: the first call
 * for a given id creates the row; every subsequent call for the same id
 * replaces its exercises/sets with the current full snapshot (via the
 * update branch's nested `deleteMany` + `create`) rather than creating a
 * second row or appending duplicates. This is what makes it safe to call
 * repeatedly across a workout's lifecycle — on start, on every logged set,
 * and on completion — with no separate duplicate-prevention check needed:
 * there is exactly one row per id, always.
 *
 * Enforces one invariant regardless of caller: a workout already persisted
 * as "completed" can never be overwritten with an earlier status (in
 * particular, never back to "in_progress"). This lives HERE — the
 * repository, the only code path that actually writes a Workout row —
 * rather than only in the Server Action that currently calls it, because
 * that's the one place that can make the guarantee hold no matter which
 * caller (today's action, a future API route, a script) issues the write.
 * It intentionally does not also live in apps/web/lib/actions/save-workout.ts:
 * that action already wraps this call in a try/catch and turns any thrown
 * error into `{ ok: false, error }`, so no additional code is needed there
 * for this error to surface correctly as a visible, non-silent failure.
 *
 * Reads the existing row's status first, then decides — a read-then-write
 * check, not a single atomic conditional query. That's a deliberate
 * simplicity trade-off: this is a single-process MVP with no concurrent
 * writers for the same workout id (the client-side save queue already
 * ensures this app only ever issues one save at a time per id), so the
 * theoretical gap between the read and the write isn't a real risk here.
 *
 * Validates shape/invariants first — see validation/logged-workout.schema.ts.
 */
export async function saveWorkoutSnapshot(id: string, input: LoggedWorkoutInput): Promise<LoggedWorkoutRecord> {
  validateLoggedWorkout(input);

  // MVP concurrency assumption: saves are currently serialised per workout by
  // the client-side save queue (apps/web/lib/store.ts), so at most one save
  // for this id is ever in flight at a time — this read-then-write check is
  // acceptable on that basis. If multiple concurrent writers for the same
  // workout id are ever introduced (e.g. multi-device sync), this must
  // become an atomic database-level guard (e.g. a conditional update), not
  // this read-then-decide pair.
  const existing = await prisma.workout.findUnique({ where: { id }, select: { status: true } });
  if (existing?.status === "completed" && input.status !== "completed") {
    throw new WorkoutStatusRegressionError(
      `Refusing to save workout "${id}" as "${input.status}" — it is already completed, and a completed workout can never move back to an earlier status.`,
    );
  }

  const { create, update } = toWorkoutUpsertInput(id, input);
  const row = await prisma.workout.upsert({
    where: { id },
    create,
    update,
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

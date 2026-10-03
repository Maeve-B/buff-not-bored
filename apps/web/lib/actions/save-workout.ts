"use server";

/**
 * The app/server boundary for persisting a workout snapshot — called at
 * every meaningful point in a session's lifecycle (start, each logged set,
 * completion), never only at the end. The ONLY file in apps/web allowed to
 * import `@buff-not-bored/db` — client components never see Prisma, and
 * never call a repository directly (Next.js strips this function's body
 * out of the client bundle because of the "use server" directive above,
 * same mechanism ARCHITECTURE.md §6 describes for Server Actions).
 * Everything here delegates to the existing `packages/db` repository
 * layer; nothing here talks to Prisma directly.
 */

import { saveWorkoutSnapshot as persistSnapshot, upsertExercise } from "@buff-not-bored/db";
import type { Exercise } from "@buff-not-bored/domain";
import { toLoggedWorkoutInput } from "@/lib/persistence-mapper";
import type { SaveWorkoutResult, WorkoutSnapshot } from "@/lib/types";

/** Every exercise referenced by a snapshot's session, deduplicated by id. */
function exercisesIn(snapshot: WorkoutSnapshot): Exercise[] {
  const all =
    snapshot.workoutType === "circuit"
      ? snapshot.session.mainExercises.map((pe) => pe.exercise)
      : snapshot.session.exercises.map((se) => se.exercise);
  return Array.from(new Map(all.map((exercise) => [exercise.id, exercise])).values());
}

/**
 * Persists the current state of a workout session, identified by
 * `snapshot.id` — the same stable id for every call across that session's
 * lifecycle. Ensures every exercise it references exists in the catalog
 * (via the existing `upsertExercise` repository function — required for
 * the workout/exercise foreign key, not a new persistence concern), then
 * upserts the workout snapshot itself (`saveWorkoutSnapshot`, which
 * replaces rather than duplicates on repeat calls for the same id — see
 * packages/db/src/repositories/workout-repository.ts). Returns a typed
 * result rather than letting a failure propagate silently — the caller
 * decides what the user sees.
 */
export async function persistWorkoutSnapshot(snapshot: WorkoutSnapshot): Promise<SaveWorkoutResult> {
  try {
    for (const exercise of exercisesIn(snapshot)) {
      await upsertExercise(exercise);
    }
    const input = toLoggedWorkoutInput(snapshot);
    const record = await persistSnapshot(snapshot.id, input);
    return { ok: true, id: record.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error while saving workout" };
  }
}

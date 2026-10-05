"use server";

/**
 * The app/server boundary for viewing and editing a user's exercise
 * capability outside of a workout. Same convention as
 * lib/actions/save-workout.ts: this is the ONLY file allowed to import
 * `@buff-not-bored/db` for this feature — client components never see
 * Prisma, and never call the repository layer directly.
 */

import { getExerciseCapability, upsertExerciseCapability } from "@buff-not-bored/db";
import type { ExerciseCapability, ExerciseCapabilityInput } from "@buff-not-bored/domain";
import type { SaveCapabilityResult } from "@/lib/types";

/** The current capability for an exercise, or `undefined` if the user has never set one. */
export async function loadExerciseCapability(exerciseId: string): Promise<ExerciseCapability | undefined> {
  return getExerciseCapability(exerciseId);
}

/** Persists a manual capability edit. Returns a typed result rather than letting a validation failure propagate silently. */
export async function saveExerciseCapability(input: ExerciseCapabilityInput): Promise<SaveCapabilityResult> {
  try {
    const capability = await upsertExerciseCapability(input);
    return { ok: true, capability };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error while saving capability" };
  }
}

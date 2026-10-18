"use server";

/**
 * The app/server boundary for viewing and editing a user's exercise
 * capability outside of a workout. Same convention as
 * lib/actions/save-workout.ts: this is the ONLY file allowed to import
 * `@buff-not-bored/db` for this feature — client components never see
 * Prisma, and never call the repository layer directly.
 */

import { getExerciseCapability, listExerciseCapabilities, recordStartingWeight, upsertExerciseCapability } from "@buff-not-bored/db";
import { currentWeightsFromCapabilities } from "@buff-not-bored/domain";
import type { CurrentWeights, ExerciseCapability, ExerciseCapabilityInput } from "@buff-not-bored/domain";
import type { SaveCapabilityResult, SaveStartingWeightResult } from "@/lib/types";

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

/** Your current weight for every exercise that has one — what Strength and Circuit sessions prescribe. */
export async function loadCurrentWeights(): Promise<CurrentWeights> {
  return currentWeightsFromCapabilities(await listExerciseCapabilities());
}

/**
 * Records a first-use starting weight (spec §10.1). Never overwrites a
 * weight that already exists (§3.3): in that case nothing is written and
 * `saved` is false. The check and the write are one transaction.
 */
export async function saveStartingWeight(exerciseId: string, weight: number): Promise<SaveStartingWeightResult> {
  try {
    return { ok: true, saved: await recordStartingWeight(exerciseId, weight) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error while saving your starting weight" };
  }
}

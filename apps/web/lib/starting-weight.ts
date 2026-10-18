/**
 * The client side of first-use starting weights (spec §10.1), shared by the
 * Circuit and Strength stores. Bookkeeping only: what to record is decided
 * in packages/domain, and whether it may be written is re-checked on the
 * server (lib/actions/exercise-capability.ts).
 */

import type { CurrentWeights } from "@buff-not-bored/domain";
import { saveStartingWeight } from "./actions/exercise-capability";

/** Weights from the server win; a weight recorded here whose save hasn't landed yet is kept. */
export function mergeServerWeights(local: CurrentWeights, fromServer: CurrentWeights): CurrentWeights {
  return { ...local, ...fromServer };
}

/**
 * Saves a first-use starting weight and returns a message for the person if
 * it didn't save, or undefined if it did (or the exercise already had one).
 * The local weight is deliberately kept on failure: dropping it would make
 * the next logged set silently become the starting weight instead.
 */
export async function persistStartingWeight(exerciseName: string, exerciseId: string, weight: number): Promise<string | undefined> {
  try {
    const result = await saveStartingWeight(exerciseId, weight);
    if (result.ok) return undefined;
  } catch {
    // Network failure: fall through to the same message.
  }
  return `Couldn't save ${weight}kg as your ${exerciseName} weight. You'll be asked again next session.`;
}

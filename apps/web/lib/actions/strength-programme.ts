"use server";

/**
 * The app/server boundary for Strength's programme rotation: reads which
 * session you last trained and returns the one due next (DECISIONS.md D-011).
 */

import { findLastLoggedStrengthExercises, findLastTrainedProgrammeSession } from "@buff-not-bored/db";
import type { LastTimeOnExercise } from "@buff-not-bored/domain";
import { nextStrengthSessionId, STRENGTH_PROGRAMME } from "@/lib/strength-service";

/** The id of the Strength session due next, or the first if you've never trained the programme. */
export async function loadNextStrengthSessionId(): Promise<string> {
  return nextStrengthSessionId(await findLastTrainedProgrammeSession(STRENGTH_PROGRAMME.id));
}

/** What you did last time on each of the programme's exercises, for the "ready to go up" nudge (D-014). */
export async function loadLastTimeOnStrengthExercises(): Promise<Record<string, LastTimeOnExercise>> {
  const ids = [...new Set(STRENGTH_PROGRAMME.sessions.flatMap((session) => session.slots.map((slot) => slot.exerciseId)))];
  return findLastLoggedStrengthExercises(ids);
}

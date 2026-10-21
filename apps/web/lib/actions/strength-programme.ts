"use server";

/**
 * The app/server boundary for Strength's programme rotation: reads which
 * session you last trained and returns the one due next (DECISIONS.md D-011).
 */

import { findLastTrainedProgrammeSession } from "@buff-not-bored/db";
import { nextStrengthSessionId, STRENGTH_PROGRAMME } from "@/lib/strength-service";

/** The id of the Strength session due next, or the first if you've never trained the programme. */
export async function loadNextStrengthSessionId(): Promise<string> {
  return nextStrengthSessionId(await findLastTrainedProgrammeSession(STRENGTH_PROGRAMME.id));
}

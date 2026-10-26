"use server";

/** The app/server boundary for Settings (S-006). */

import { saveWeightUnit as persistWeightUnit } from "@buff-not-bored/db";
import { isDisplayUnit, type DisplayUnit } from "@buff-not-bored/domain";

/** Saves your weight unit. Every weight stays stored in kg; this only changes how they're shown and entered. */
export async function saveWeightUnit(unit: DisplayUnit): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isDisplayUnit(unit)) return { ok: false, error: "Choose kg or lb." };
  try {
    await persistWeightUnit(unit);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error while saving settings" };
  }
}

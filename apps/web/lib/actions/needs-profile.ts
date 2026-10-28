"use server";

/** The app/server boundary for your training needs (spec §6.1, S-008). */

import { getNeedsProfile, saveNeedsProfile as persistNeedsProfile } from "@buff-not-bored/db";
import { NeedsProfileValidationError, type NeedsProfile, type NeedsProfileIssue, type SavedNeedsProfile } from "@buff-not-bored/domain";

export async function loadNeedsProfile(): Promise<SavedNeedsProfile | undefined> {
  return getNeedsProfile();
}

export type SaveNeedsProfileResult =
  | { ok: true; profile: SavedNeedsProfile }
  | { ok: false; issues: NeedsProfileIssue[] }
  | { ok: false; error: string };

/** Confirms and saves your needs profile. Problems come back in plain language, one per answer. */
export async function saveNeedsProfile(profile: NeedsProfile): Promise<SaveNeedsProfileResult> {
  try {
    return { ok: true, profile: await persistNeedsProfile(profile) };
  } catch (error) {
    if (error instanceof NeedsProfileValidationError) return { ok: false, issues: error.issues };
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error while saving your training needs" };
  }
}

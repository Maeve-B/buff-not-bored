"use server";

/** The app/server boundary for the daily check-in (S-016, §6.6). */

import { getCheckIn, saveCheckIn } from "@buff-not-bored/db";
import { checkInFromAnswers, skippedCheckIn, type CheckIn, type CheckInAnswers } from "@buff-not-bored/domain";

/**
 * Today on the calendar of the computer running the app, as YYYY-MM-DD.
 * Right while the app runs on Maeve's own machine; a hosted server would need
 * the phone's date instead (BACKLOG "Discovered").
 */
export async function localTodayIso(): Promise<string> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Today's check-in, or undefined if you haven't checked in (or skipped) today. */
export async function loadTodayCheckIn(): Promise<CheckIn | undefined> {
  return getCheckIn(await localTodayIso());
}

/** Saves today's answers. */
export async function saveTodayCheckIn(answers: CheckInAnswers): Promise<{ ok: true; checkIn: CheckIn } | { ok: false; error: string }> {
  const result = checkInFromAnswers(await localTodayIso(), answers);
  if (!result.checkIn) return { ok: false, error: result.problem };
  try {
    return { ok: true, checkIn: await saveCheckIn(result.checkIn) };
  } catch (error) {
    console.error("Saving today's check-in failed", error);
    return { ok: false, error: "Couldn't save that just now. Try again in a moment." };
  }
}

/** "Not today": records that you skipped, so you aren't asked again today. */
export async function skipTodayCheckIn(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await saveCheckIn(skippedCheckIn(await localTodayIso()));
    return { ok: true };
  } catch (error) {
    console.error("Skipping today's check-in failed", error);
    return { ok: false, error: "Couldn't do that just now. Try again in a moment." };
  }
}

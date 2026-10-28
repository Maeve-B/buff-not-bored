/**
 * The check-in's wording (S-016). Proposed, not designed: plain words for
 * Maeve to rewrite. Presentation only; the questions' order and rules are in
 * packages/domain (check-in.ts).
 */

import type { CheckIn, CheckInStep, EnergyAnswer, SleepAnswer, SorenessAnswer } from "@buff-not-bored/domain";
import { LIMITATION_LABELS } from "./needs-labels";

export const CHECK_IN_QUESTIONS: Record<CheckInStep, string> = {
  sleep: "Welcome back! How did you sleep?",
  energy: "How's your energy?",
  soreness: "How sore are you?",
  pain: "Any pain today?",
  painWhere: "Where?",
  done: "Thanks, that's noted.",
};

export const SLEEP_LABELS: Record<SleepAnswer, string> = { poor: "Badly", ok: "OK", good: "Well" };
export const ENERGY_LABELS: Record<EnergyAnswer, string> = { low: "Low", ok: "OK", high: "High" };
export const SORENESS_LABELS: Record<SorenessAnswer, string> = { none: "Not at all", some: "A bit", very: "Very" };

/** The same answers as Home's one-line summary. Change these alongside the labels above. */
const SLEEP_SUMMARY: Record<SleepAnswer, string> = { poor: "slept badly", ok: "slept OK", good: "slept well" };
const ENERGY_SUMMARY: Record<EnergyAnswer, string> = { low: "energy low", ok: "energy OK", high: "energy high" };
const SORENESS_SUMMARY: Record<SorenessAnswer, string> = { none: "not sore", some: "a bit sore", very: "very sore" };

/** "slept OK, energy high, a bit sore, no pain" — for Home's "Checked in today" line. */
export function describeCheckIn(checkIn: CheckIn): string {
  if (checkIn.skipped) return "skipped";
  const sleep = SLEEP_SUMMARY[checkIn.sleep!];
  const energy = ENERGY_SUMMARY[checkIn.energy!];
  const soreness = SORENESS_SUMMARY[checkIn.soreness!];
  const pain = checkIn.painRegions.length === 0 ? "no pain" : `pain: ${checkIn.painRegions.map((r) => LIMITATION_LABELS[r].toLowerCase()).join(", ")}`;
  return [sleep, energy, soreness, pain].join(", ");
}

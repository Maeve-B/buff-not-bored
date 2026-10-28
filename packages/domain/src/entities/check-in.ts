/**
 * The pre-session check-in (spec v2 §6.6, §5.2, D-018): how you slept, your
 * energy, soreness and any pain, one tap each, once a day. Skippable. The
 * answers are saved for the day (§9.4); adapting today's session from them
 * is the engine's job (S-018), never the conversation's (§4.1).
 *
 * Pain regions use the same tags as limitations and the library's
 * joint-stress tags, so they can be matched to the exercises that stress
 * them (D-021).
 */

import { JOINT_STRESS_TAGS, type JointStressTag } from "./exercise.js";

export const SLEEP_ANSWERS = ["poor", "ok", "good"] as const;
export type SleepAnswer = (typeof SLEEP_ANSWERS)[number];

export const ENERGY_ANSWERS = ["low", "ok", "high"] as const;
export type EnergyAnswer = (typeof ENERGY_ANSWERS)[number];

export const SORENESS_ANSWERS = ["none", "some", "very"] as const;
export type SorenessAnswer = (typeof SORENESS_ANSWERS)[number];

export interface CheckInAnswers {
  sleep?: SleepAnswer;
  energy?: EnergyAnswer;
  soreness?: SorenessAnswer;
  /** Undefined until asked; then whether anything hurts. */
  pain?: boolean;
  /** Where it hurts, when `pain` is true. */
  painRegions: JointStressTag[];
}

/** One day's check-in: your answers, or that you skipped it ("Not today"). */
export interface CheckIn {
  /** YYYY-MM-DD, the day it's for. */
  dateIso: string;
  skipped: boolean;
  sleep?: SleepAnswer;
  energy?: EnergyAnswer;
  soreness?: SorenessAnswer;
  painRegions: JointStressTag[];
}

export const CHECK_IN_STEPS = ["sleep", "energy", "soreness", "pain", "painWhere", "done"] as const;
export type CheckInStep = (typeof CHECK_IN_STEPS)[number];

/** The next question: "where?" only if you said something hurts. */
export function nextCheckInStep(step: CheckInStep, answers: CheckInAnswers): CheckInStep {
  if (step === "pain") return answers.pain ? "painWhere" : "done";
  const index = CHECK_IN_STEPS.indexOf(step);
  return CHECK_IN_STEPS[Math.min(index + 1, CHECK_IN_STEPS.length - 1)]!;
}

/** The question before (for Back). */
export function previousCheckInStep(step: CheckInStep, answers: CheckInAnswers): CheckInStep {
  if (step === "done") return answers.pain ? "painWhere" : "pain";
  const index = CHECK_IN_STEPS.indexOf(step);
  return CHECK_IN_STEPS[Math.max(index - 1, 0)]!;
}

/** "Question 2 of 4" (5 when you're asked where it hurts). */
export function checkInProgress(step: CheckInStep, answers: CheckInAnswers): { number: number; of: number } | undefined {
  const steps: CheckInStep[] = answers.pain ? ["sleep", "energy", "soreness", "pain", "painWhere"] : ["sleep", "energy", "soreness", "pain"];
  const index = steps.indexOf(step);
  return index < 0 ? undefined : { number: index + 1, of: steps.length };
}

/** The finished check-in for `dateIso`, or a plain-language problem with it. */
export function checkInFromAnswers(dateIso: string, answers: CheckInAnswers): { checkIn: CheckIn; problem?: undefined } | { checkIn?: undefined; problem: string } {
  if (!answers.sleep || !answers.energy || !answers.soreness || answers.pain === undefined) {
    return { problem: "Answer each question, or choose Not today." };
  }
  const regions = answers.pain && Array.isArray(answers.painRegions) ? answers.painRegions : [];
  if (answers.pain && regions.length === 0) return { problem: "Tick where it hurts." };
  return {
    checkIn: { dateIso, skipped: false, sleep: answers.sleep, energy: answers.energy, soreness: answers.soreness, painRegions: [...regions] },
  };
}

/** A skipped day: you chose "Not today", so you aren't asked again that day. */
export function skippedCheckIn(dateIso: string): CheckIn {
  return { dateIso, skipped: true, painRegions: [] };
}

/** The answers a saved check-in started from, for changing it. */
export function answersFromCheckIn(checkIn: CheckIn | undefined): CheckInAnswers {
  if (!checkIn || checkIn.skipped) return { painRegions: [] };
  return {
    sleep: checkIn.sleep,
    energy: checkIn.energy,
    soreness: checkIn.soreness,
    pain: checkIn.painRegions.length > 0,
    painRegions: [...checkIn.painRegions],
  };
}

/** Every problem with a check-in about to be saved (it can come from outside the app, so nothing is assumed). */
export function checkCheckIn(checkIn: CheckIn): string[] {
  const problems: string[] = [];
  const date = new Date(`${checkIn.dateIso}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn.dateIso) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== checkIn.dateIso) {
    problems.push("The date isn't recognised.");
  }
  if (!Array.isArray(checkIn.painRegions) || checkIn.painRegions.some((tag) => !JOINT_STRESS_TAGS.includes(tag))) {
    problems.push("Some pain areas aren't recognised.");
  }
  if (checkIn.skipped) {
    if (checkIn.sleep || checkIn.energy || checkIn.soreness || (checkIn.painRegions?.length ?? 0) > 0) problems.push("A skipped day has no answers.");
    return problems;
  }
  if (!SLEEP_ANSWERS.includes(checkIn.sleep as SleepAnswer)) problems.push("Say how you slept.");
  if (!ENERGY_ANSWERS.includes(checkIn.energy as EnergyAnswer)) problems.push("Say how your energy is.");
  if (!SORENESS_ANSWERS.includes(checkIn.soreness as SorenessAnswer)) problems.push("Say how sore you are.");
  return problems;
}

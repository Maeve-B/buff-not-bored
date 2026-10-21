/**
 * Preset programmes (spec v2 §9.3, §10.1): fixed sessions of slots, each an
 * exercise with sets and a rep (or seconds) range, optionally paired into a
 * superset. Sessions follow a rotation rather than the calendar: the next
 * one due is the one after the last you trained (DECISIONS.md D-011).
 */

import type { ExerciseClass } from "./exercise.js";

/** Inclusive range of reps, or seconds for a timed exercise. `min === max` is a fixed target. */
export interface TargetRange {
  min: number;
  max: number;
}

export interface PresetSlot {
  exerciseId: string;
  sets: number;
  /** Rep-counted slots set this (reps per side when the exercise is per side). */
  reps?: TargetRange;
  /** Timed slots set this, in seconds. */
  seconds?: TargetRange;
  /** Slots sharing a superset group are done as a pair, alternating sets (§6.4). */
  supersetGroup?: string;
}

export interface PresetSession {
  /** Stable id, saved with each workout to drive the rotation. */
  id: string;
  /** The day it's planned for, e.g. "Monday". */
  dayLabel: string;
  /** What the session focuses on, e.g. "Squat and push". */
  focus: string;
  slots: PresetSlot[];
}

export interface PresetProgramme {
  id: string;
  name: string;
  goal: string;
  /** In rotation order. */
  sessions: PresetSession[];
}

/** "Monday · Squat and push" — the session's name everywhere it's shown or saved. */
export function presetSessionName(session: Pick<PresetSession, "dayLabel" | "focus">): string {
  return `${session.dayLabel} · ${session.focus}`;
}

/**
 * The session due next: the one after `lastSessionId` in the rotation,
 * wrapping round, or the first when there's no last session (or it isn't
 * part of this programme).
 */
export function nextPresetSession(programme: PresetProgramme, lastSessionId: string | undefined): PresetSession {
  if (programme.sessions.length === 0) throw new Error(`Preset programme "${programme.id}" has no sessions.`);
  const lastIndex = programme.sessions.findIndex((session) => session.id === lastSessionId);
  return programme.sessions[(lastIndex + 1) % programme.sessions.length]!;
}

export function findPresetSession(programme: PresetProgramme, sessionId: string): PresetSession | undefined {
  return programme.sessions.find((session) => session.id === sessionId);
}

/**
 * Recommended rest in seconds, shown for information only and never timed
 * or enforced (D-010). §6.3: 2–3 min for compound lifts, 60–90 s for
 * isolation work.
 */
export function recommendedRestSeconds(exerciseClass: ExerciseClass): TargetRange {
  return exerciseClass === "compound" ? { min: 120, max: 180 } : { min: 60, max: 90 };
}

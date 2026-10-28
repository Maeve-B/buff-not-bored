/**
 * Your training needs (spec v2 §6.1): what the programme generator takes as
 * input. Collected by a form, or later by the AI chat (§5.14), which only
 * collects and structures it; the engine decides (§4.1). One profile per
 * person; a training block has one primary goal plus an optional emphasis.
 *
 * Phase 1 scope (DECISIONS.md D-016, D-017): strength, hypertrophy or
 * general fitness; full body, 2–4 days a week. Muscular endurance and other
 * day counts arrive with Phase 2.
 */

import { GYM_EQUIPMENT, JOINT_STRESS_TAGS, type GymEquipment, type JointStressTag } from "./exercise.js";

export const NEEDS_GOALS = ["strength", "hypertrophy", "general_fitness"] as const;
export type NeedsGoal = (typeof NEEDS_GOALS)[number];

export const EMPHASES = ["glutes", "core", "pull_up"] as const;
export type Emphasis = (typeof EMPHASES)[number];

/** How long you've trained regularly. */
export const TRAINING_DURATIONS = ["under_2_months", "2_to_12_months", "over_a_year"] as const;
export type TrainingDuration = (typeof TRAINING_DURATIONS)[number];

/** What kind of training that was. */
export const TRAINING_KINDS = ["free_weights", "machines_or_classes", "other_sport"] as const;
export type TrainingKind = (typeof TRAINING_KINDS)[number];

/** How confident your technique is on the main lifts. */
export const TECHNIQUE_CONFIDENCE = ["low", "some", "confident"] as const;
export type TechniqueConfidence = (typeof TECHNIQUE_CONFIDENCE)[number];

export const TRAINING_STATUSES = ["beginner", "intermediate", "advanced"] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export const NEEDS_SOURCES = ["form", "chat"] as const;
export type NeedsSource = (typeof NEEDS_SOURCES)[number];

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const MIN_DAYS_PER_WEEK = 2;
export const MAX_DAYS_PER_WEEK = 4;
export const MIN_SESSION_MINUTES = 20;
export const MAX_SESSION_MINUTES = 180;
/** Free-text answers are kept short: they're notes, and later go to the AI chat. */
export const MAX_NOTE_LENGTH = 500;

export interface NeedsProfile {
  goal: NeedsGoal;
  emphasis?: Emphasis;
  trainingDuration: TrainingDuration;
  trainingKind: TrainingKind;
  techniqueConfidence: TechniqueConfidence;
  daysPerWeek: number;
  /** Exactly `daysPerWeek` days, or none for "any days". */
  preferredDays: Weekday[];
  sessionMinutes: number;
  equipment: GymEquipment[];
  /** Your heaviest dumbbell, in kg, if you have dumbbells. */
  heaviestDumbbellKg?: number;
  limitations: JointStressTag[];
  limitationNote?: string;
  avoidExerciseIds: string[];
  favouriteExerciseIds: string[];
  likesDislikes?: string;
  source: NeedsSource;
}

/** A saved profile: when you confirmed it. */
export interface SavedNeedsProfile extends NeedsProfile {
  confirmedAt: string;
}

const STATUS_FROM_DURATION: Record<TrainingDuration, TrainingStatus> = {
  under_2_months: "beginner",
  "2_to_12_months": "intermediate",
  over_a_year: "advanced",
};

/**
 * Your experience level (§6.1), from training age as in NSCA's guide:
 * under 2 months → beginner, 2–12 months → intermediate, a year or more →
 * advanced. Stepped down one level if your technique confidence is low, or
 * if your training wasn't with free weights, since the programme is built
 * on free-weight lifts (D-017).
 */
export function deriveTrainingStatus(profile: Pick<NeedsProfile, "trainingDuration" | "trainingKind" | "techniqueConfidence">): TrainingStatus {
  const fromAge = STATUS_FROM_DURATION[profile.trainingDuration];
  const stepDown = profile.techniqueConfidence === "low" || profile.trainingKind !== "free_weights";
  if (!stepDown) return fromAge;
  return fromAge === "advanced" ? "intermediate" : "beginner";
}

/** One problem with a profile, in plain language, tied to the answer it's about. */
export interface NeedsProfileIssue {
  field: keyof NeedsProfile;
  message: string;
}

function isWeekday(value: number): value is Weekday {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

/**
 * Every problem with a profile, in plain language for the form; empty when
 * it's ready to save. `exerciseIds` is the library, so avoids and favourites
 * can only name real exercises.
 */
export function checkNeedsProfile(profile: NeedsProfile, exerciseIds: ReadonlySet<string>): NeedsProfileIssue[] {
  const issues: NeedsProfileIssue[] = [];
  const add = (field: keyof NeedsProfile, message: string) => issues.push({ field, message });

  // The profile can arrive from outside (a form post, later the AI chat), so lists are checked to be lists first.
  const listFields = ["preferredDays", "equipment", "limitations", "avoidExerciseIds", "favouriteExerciseIds"] as const;
  const notLists = listFields.filter((field) => !Array.isArray(profile[field]));
  if (notLists.length > 0) {
    for (const field of notLists) add(field, "This answer is missing.");
    return issues;
  }
  if (!NEEDS_SOURCES.includes(profile.source)) add("source", "Say where these answers came from.");

  if (!NEEDS_GOALS.includes(profile.goal)) add("goal", "Choose a goal.");
  if (profile.emphasis !== undefined && !EMPHASES.includes(profile.emphasis)) add("emphasis", "Choose an emphasis, or none.");
  if (!TRAINING_DURATIONS.includes(profile.trainingDuration)) add("trainingDuration", "Say how long you've trained regularly.");
  if (!TRAINING_KINDS.includes(profile.trainingKind)) add("trainingKind", "Say what kind of training it was.");
  if (!TECHNIQUE_CONFIDENCE.includes(profile.techniqueConfidence)) add("techniqueConfidence", "Say how confident your technique is.");

  if (!Number.isInteger(profile.daysPerWeek) || profile.daysPerWeek < MIN_DAYS_PER_WEEK || profile.daysPerWeek > MAX_DAYS_PER_WEEK) {
    add("daysPerWeek", `Choose ${MIN_DAYS_PER_WEEK} to ${MAX_DAYS_PER_WEEK} days a week.`);
  }
  const days = profile.preferredDays;
  if (!days.every(isWeekday) || new Set(days).size !== days.length) {
    add("preferredDays", "Pick each preferred day once.");
  } else if (days.length > 0 && days.length !== profile.daysPerWeek) {
    add("preferredDays", `Pick ${profile.daysPerWeek} preferred days to match your days a week, or none.`);
  }

  if (!Number.isInteger(profile.sessionMinutes) || profile.sessionMinutes < MIN_SESSION_MINUTES || profile.sessionMinutes > MAX_SESSION_MINUTES) {
    add("sessionMinutes", `Session length should be ${MIN_SESSION_MINUTES}–${MAX_SESSION_MINUTES} minutes.`);
  }

  if (profile.equipment.length === 0) add("equipment", "Tick the equipment you have, or bodyweight.");
  if (profile.equipment.some((item) => !GYM_EQUIPMENT.includes(item))) add("equipment", "Some equipment isn't recognised.");
  if (profile.heaviestDumbbellKg !== undefined) {
    if (!profile.equipment.includes("dumbbells")) add("heaviestDumbbellKg", "Only give a heaviest dumbbell if you have dumbbells.");
    else if (!(profile.heaviestDumbbellKg > 0)) add("heaviestDumbbellKg", "Your heaviest dumbbell should be above 0.");
  }

  if (profile.limitations.some((tag) => !JOINT_STRESS_TAGS.includes(tag))) add("limitations", "Some limitations aren't recognised.");

  for (const field of ["avoidExerciseIds", "favouriteExerciseIds"] as const) {
    if (profile[field].some((id) => !exerciseIds.has(id))) add(field, "Some exercises aren't in the library.");
  }
  if (profile.avoidExerciseIds.some((id) => profile.favouriteExerciseIds.includes(id))) {
    add("favouriteExerciseIds", "An exercise can't be both a favourite and one to avoid.");
  }

  if ((profile.limitationNote?.length ?? 0) > MAX_NOTE_LENGTH) add("limitationNote", `Keep this to ${MAX_NOTE_LENGTH} characters.`);
  if ((profile.likesDislikes?.length ?? 0) > MAX_NOTE_LENGTH) add("likesDislikes", `Keep this to ${MAX_NOTE_LENGTH} characters.`);

  return issues;
}

export class NeedsProfileValidationError extends Error {
  constructor(public readonly issues: NeedsProfileIssue[]) {
    super(`Needs profile failed validation:\n${issues.map((issue) => `${issue.field}: ${issue.message}`).join("\n")}`);
    this.name = "NeedsProfileValidationError";
  }
}

/** Throws `NeedsProfileValidationError`, with every issue, if the profile isn't ready to save. */
export function validateNeedsProfile(profile: NeedsProfile, exerciseIds: ReadonlySet<string>): void {
  const issues = checkNeedsProfile(profile, exerciseIds);
  if (issues.length > 0) throw new NeedsProfileValidationError(issues);
}

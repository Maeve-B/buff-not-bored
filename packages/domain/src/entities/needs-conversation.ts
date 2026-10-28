/**
 * The setup conversation (spec v2 §5.1, D-018): your training needs asked
 * one question at a time, scripted. This is the script's logic only — the
 * order of questions, which ones apply, and checking each answer with the
 * profile's own checks (checkNeedsProfile). The wording lives in the app;
 * the AI chat can later answer the same questions with free text (§5.14).
 */

import { GYM_EQUIPMENT, JOINT_STRESS_TAGS } from "./exercise.js";
import {
  checkNeedsProfile,
  deriveTrainingStatus,
  EMPHASES,
  NEEDS_GOALS,
  TECHNIQUE_CONFIDENCE,
  TRAINING_DURATIONS,
  TRAINING_KINDS,
  type NeedsProfile,
  type NeedsProfileIssue,
  type TrainingStatus,
} from "./needs-profile.js";

/** The answers so far: any part of a profile. */
export type NeedsAnswers = Partial<Omit<NeedsProfile, "source">>;

export type StepKind =
  | "single" // pick one
  | "multi" // pick any, then Done
  | "days" // pick weekdays, then Done
  | "number" // type a number, then Done
  | "text" // type a note, then Done
  | "exercises" // "any?" then search and pick, then Done
  | "result" // the app tells you something (your experience level)
  | "summary"; // your answers, to check and save

export interface ConversationStep {
  id: StepId;
  kind: StepKind;
  /** The profile answer this question fills in (none for result and summary). */
  field?: keyof NeedsAnswers;
  /** Optional questions offer Skip. */
  optional: boolean;
}

export const STEP_IDS = [
  "goal",
  "emphasis",
  "trainingDuration",
  "trainingKind",
  "techniqueConfidence",
  "experience",
  "daysPerWeek",
  "preferredDays",
  "sessionMinutes",
  "equipment",
  "heaviestDumbbell",
  "limitations",
  "limitationNote",
  "avoid",
  "favourites",
  "likesDislikes",
  "summary",
] as const;
export type StepId = (typeof STEP_IDS)[number];

const STEPS: Record<StepId, ConversationStep> = {
  goal: { id: "goal", kind: "single", field: "goal", optional: false },
  emphasis: { id: "emphasis", kind: "single", field: "emphasis", optional: true },
  trainingDuration: { id: "trainingDuration", kind: "single", field: "trainingDuration", optional: false },
  trainingKind: { id: "trainingKind", kind: "single", field: "trainingKind", optional: false },
  techniqueConfidence: { id: "techniqueConfidence", kind: "single", field: "techniqueConfidence", optional: false },
  experience: { id: "experience", kind: "result", optional: false },
  daysPerWeek: { id: "daysPerWeek", kind: "single", field: "daysPerWeek", optional: false },
  preferredDays: { id: "preferredDays", kind: "days", field: "preferredDays", optional: true },
  sessionMinutes: { id: "sessionMinutes", kind: "single", field: "sessionMinutes", optional: false },
  equipment: { id: "equipment", kind: "multi", field: "equipment", optional: false },
  heaviestDumbbell: { id: "heaviestDumbbell", kind: "number", field: "heaviestDumbbellKg", optional: true },
  limitations: { id: "limitations", kind: "multi", field: "limitations", optional: true },
  limitationNote: { id: "limitationNote", kind: "text", field: "limitationNote", optional: true },
  avoid: { id: "avoid", kind: "exercises", field: "avoidExerciseIds", optional: true },
  favourites: { id: "favourites", kind: "exercises", field: "favouriteExerciseIds", optional: true },
  likesDislikes: { id: "likesDislikes", kind: "text", field: "likesDislikes", optional: true },
  summary: { id: "summary", kind: "summary", optional: false },
};

/** Session length choices, in minutes. */
export const SESSION_MINUTE_CHOICES = [30, 45, 60, 75, 90] as const;

/** What a skipped optional question means, so the profile is complete without it. */
const SKIPPED_VALUE: Partial<Record<StepId, Partial<NeedsAnswers>>> = {
  emphasis: { emphasis: undefined },
  preferredDays: { preferredDays: [] },
  heaviestDumbbell: { heaviestDumbbellKg: undefined },
  limitations: { limitations: [] },
  limitationNote: { limitationNote: undefined },
  avoid: { avoidExerciseIds: [] },
  favourites: { favouriteExerciseIds: [] },
  likesDislikes: { likesDislikes: undefined },
};

/** A question only applies when it makes sense for your earlier answers. */
function applies(id: StepId, answers: NeedsAnswers): boolean {
  if (id === "heaviestDumbbell") return answers.equipment?.includes("dumbbells") ?? false;
  if (id === "limitationNote") return (answers.limitations?.length ?? 0) > 0;
  return true;
}

export function conversationStep(id: StepId): ConversationStep {
  return STEPS[id];
}

/** The questions that apply to your answers so far, in order, ending with the summary. */
export function applicableSteps(answers: NeedsAnswers): ConversationStep[] {
  return STEP_IDS.filter((id) => applies(id, answers)).map((id) => STEPS[id]);
}

/** The next question after `id`, or the summary. Questions that no longer apply are passed over. */
export function nextStepId(id: StepId, answers: NeedsAnswers): StepId {
  const steps = applicableSteps(answers);
  const index = steps.findIndex((step) => step.id === id);
  return steps[Math.min(index + 1, steps.length - 1)]!.id;
}

/** The question before `id` (for Back), or the first. */
export function previousStepId(id: StepId, answers: NeedsAnswers): StepId {
  const steps = applicableSteps(answers);
  const index = steps.findIndex((step) => step.id === id);
  return steps[Math.max(index - 1, 0)]!.id;
}

/** "Question 3 of 12": counts only real questions, not the experience result or the summary. */
export function questionProgress(id: StepId, answers: NeedsAnswers): { number: number; of: number } | undefined {
  const questions = applicableSteps(answers).filter((step) => step.field !== undefined);
  const index = questions.findIndex((step) => step.id === id);
  return index < 0 ? undefined : { number: index + 1, of: questions.length };
}

/** Your experience level, once the three experience questions are answered. */
export function experienceFrom(answers: NeedsAnswers): TrainingStatus | undefined {
  const { trainingDuration, trainingKind, techniqueConfidence } = answers;
  if (!trainingDuration || !trainingKind || !techniqueConfidence) return undefined;
  return deriveTrainingStatus({ trainingDuration, trainingKind, techniqueConfidence });
}

/** The answers after skipping an optional question. */
export function skipStep(id: StepId, answers: NeedsAnswers): NeedsAnswers {
  if (!STEPS[id].optional) throw new Error(`"${id}" can't be skipped.`);
  return { ...answers, ...(SKIPPED_VALUE[id] ?? {}) };
}

/** Stand-ins for anything not answered yet, so one question can be checked on its own. */
function withStandIns(answers: NeedsAnswers): NeedsProfile {
  return {
    goal: "strength",
    trainingDuration: "under_2_months",
    trainingKind: "free_weights",
    techniqueConfidence: "some",
    daysPerWeek: 3,
    preferredDays: [],
    sessionMinutes: 60,
    equipment: ["bodyweight"],
    limitations: [],
    avoidExerciseIds: [],
    favouriteExerciseIds: [],
    ...answers,
    source: "form",
  };
}

/** Problems with the answer to one question, in plain language; empty when it's fine to move on. */
export function checkStepAnswer(id: StepId, answers: NeedsAnswers, exerciseIds: ReadonlySet<string>): NeedsProfileIssue[] {
  const field = STEPS[id].field;
  if (!field) return [];
  const value = answers[field];
  const unanswered = value === undefined || (Array.isArray(value) && value.length === 0);
  if (unanswered && !STEPS[id].optional) {
    return [{ field, message: id === "equipment" ? "Tick the equipment you have, or bodyweight." : "Choose an answer to carry on." }];
  }
  return checkNeedsProfile(withStandIns(answers), exerciseIds).filter((issue) => issue.field === field);
}

/**
 * The finished profile from the conversation, or every problem left. The
 * summary's Save uses this; problems point back to their question.
 */
export function profileFromAnswers(
  answers: NeedsAnswers,
  exerciseIds: ReadonlySet<string>,
): { profile: NeedsProfile; issues: [] } | { profile?: undefined; issues: NeedsProfileIssue[] } {
  const missing = applicableSteps(answers)
    .filter((step) => step.field && !step.optional)
    .filter((step) => {
      const value = answers[step.field!];
      return value === undefined || (Array.isArray(value) && value.length === 0);
    })
    .map((step): NeedsProfileIssue => ({ field: step.field!, message: "This question hasn't been answered yet." }));
  if (missing.length > 0) return { issues: missing };

  const profile: NeedsProfile = {
    ...withStandIns(answers),
    // A dumbbell weight only counts while dumbbells are ticked; a note only while a limitation is.
    heaviestDumbbellKg: answers.equipment?.includes("dumbbells") ? answers.heaviestDumbbellKg : undefined,
    limitationNote: (answers.limitations?.length ?? 0) > 0 ? answers.limitationNote : undefined,
    source: "form",
  };
  const issues = checkNeedsProfile(profile, exerciseIds);
  return issues.length > 0 ? { issues } : { profile, issues: [] };
}

/** The question a problem with `field` belongs to, for "change" links from the summary. */
export function stepForField(field: keyof NeedsProfile): StepId | undefined {
  return STEP_IDS.find((id) => STEPS[id].field === field);
}

/**
 * Where to go after answering `from`. Normally the next question. Once
 * you've reached the summary (`summary` is in `answered`), back to the
 * summary — unless your new answer makes a question apply that didn't
 * before (tick dumbbells → heaviest dumbbell), which is asked first.
 */
export function afterAnswer(from: StepId, before: NeedsAnswers, after: NeedsAnswers, answered: readonly StepId[]): StepId {
  const next = nextStepId(from, after);
  if (!answered.includes("summary")) return next;
  const wasApplicable = applicableSteps(before).some((step) => step.id === next);
  return next !== "summary" && !wasApplicable ? next : "summary";
}

/** What Home's "carry on" prompt says about where you stopped. */
export function resumePoint(stepId: StepId, answers: NeedsAnswers): { number: number; of: number } | "nearly_done" {
  if (stepId === "summary") return "nearly_done";
  return questionProgress(stepId, answers) ?? questionProgress(nextStepId(stepId, answers), answers) ?? "nearly_done";
}

/**
 * Saved answers read back, keeping only answers of the right kind. A saved
 * conversation comes from outside the engine, so anything unexpected is
 * dropped (and asked again) rather than trusted.
 */
export function sanitiseAnswers(raw: unknown): NeedsAnswers {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  const oneOf = <T extends string>(list: readonly T[], value: unknown): T | undefined =>
    typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : undefined;
  const listOf = <T extends string>(list: readonly T[], value: unknown): T[] | undefined =>
    Array.isArray(value) && value.every((v) => oneOf(list, v) !== undefined) ? (value as T[]) : undefined;
  const number = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
  const text = (value: unknown) => (typeof value === "string" ? value : undefined);
  const ids = (value: unknown) => (Array.isArray(value) && value.every((v) => typeof v === "string") ? (value as string[]) : undefined);
  const days = (value: unknown) =>
    Array.isArray(value) && value.every((v) => Number.isInteger(v) && v >= 1 && v <= 7) ? (value as NeedsAnswers["preferredDays"]) : undefined;

  const clean: NeedsAnswers = {
    goal: oneOf(NEEDS_GOALS, r.goal),
    emphasis: oneOf(EMPHASES, r.emphasis),
    trainingDuration: oneOf(TRAINING_DURATIONS, r.trainingDuration),
    trainingKind: oneOf(TRAINING_KINDS, r.trainingKind),
    techniqueConfidence: oneOf(TECHNIQUE_CONFIDENCE, r.techniqueConfidence),
    daysPerWeek: number(r.daysPerWeek),
    preferredDays: days(r.preferredDays),
    sessionMinutes: number(r.sessionMinutes),
    equipment: listOf(GYM_EQUIPMENT, r.equipment),
    heaviestDumbbellKg: number(r.heaviestDumbbellKg),
    limitations: listOf(JOINT_STRESS_TAGS, r.limitations),
    limitationNote: text(r.limitationNote),
    avoidExerciseIds: ids(r.avoidExerciseIds),
    favouriteExerciseIds: ids(r.favouriteExerciseIds),
    likesDislikes: text(r.likesDislikes),
  };
  return Object.fromEntries(Object.entries(clean).filter(([, value]) => value !== undefined)) as NeedsAnswers;
}

/**
 * A conversation in progress, saved so you can pick up where you left off
 * (D-020). `answered` lists the questions you've been through, including
 * ones you skipped; once it includes the summary, changing an answer
 * returns you there (afterAnswer).
 */
export interface NeedsConversationDraft {
  answers: NeedsAnswers;
  stepId: StepId;
  answered: StepId[];
  /** You chose "Not now": Home shows a prompt to carry on instead of the conversation. */
  paused: boolean;
}

export function isStepId(value: unknown): value is StepId {
  return typeof value === "string" && (STEP_IDS as readonly string[]).includes(value);
}

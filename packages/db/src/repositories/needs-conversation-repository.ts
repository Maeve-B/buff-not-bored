/**
 * A setup conversation in progress (S-015, D-020): one row (id "me"),
 * removed when your needs profile is saved. The partial answers are only
 * fully checked when the profile is saved (checkNeedsProfile); here they're
 * just kept safe between visits.
 */

import { isStepId, sanitiseAnswers, STEP_IDS, type NeedsConversationDraft } from "@buff-not-bored/domain";
import type { Prisma } from "@prisma/client";
import { prisma } from "../client.js";

/** The single conversation row (until multi-user accounts exist). */
export const NEEDS_DRAFT_ID = "me";
const DRAFT_ID = NEEDS_DRAFT_ID;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Your conversation in progress, or undefined if there isn't one. */
export async function getNeedsConversationDraft(): Promise<NeedsConversationDraft | undefined> {
  const row = await prisma.needsConversationDraft.findUnique({ where: { id: DRAFT_ID } });
  if (!row) return undefined;
  return {
    answers: sanitiseAnswers(row.answers),
    stepId: isStepId(row.stepId) ? row.stepId : STEP_IDS[0],
    answered: row.answered.filter(isStepId),
    paused: row.paused,
  };
}

/** Keeps your place in the conversation. */
export async function saveNeedsConversationDraft(draft: NeedsConversationDraft): Promise<void> {
  if (!isStepId(draft.stepId) || !Array.isArray(draft.answered) || !draft.answered.every(isStepId)) {
    throw new Error("That conversation step isn't recognised.");
  }
  if (!isPlainObject(draft.answers)) throw new Error("Those answers aren't in a form that can be saved.");
  const data = {
    answers: sanitiseAnswers(draft.answers) as Prisma.InputJsonObject,
    stepId: draft.stepId,
    answered: [...draft.answered],
    paused: draft.paused,
  };
  await prisma.needsConversationDraft.upsert({ where: { id: DRAFT_ID }, create: { id: DRAFT_ID, ...data }, update: data });
}

/** Forgets a conversation in progress. */
export async function clearNeedsConversationDraft(): Promise<void> {
  await prisma.needsConversationDraft.deleteMany({ where: { id: DRAFT_ID } });
}

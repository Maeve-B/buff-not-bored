"use server";

/** The app/server boundary for the setup conversation (S-015). */

import {
  clearNeedsConversationDraft,
  getNeedsConversationDraft,
  getNeedsProfile,
  saveNeedsConversationDraft,
  saveNeedsProfile,
} from "@buff-not-bored/db";
import {
  EXERCISES,
  NeedsProfileValidationError,
  profileFromAnswers,
  type NeedsAnswers,
  type NeedsConversationDraft,
  type NeedsProfileIssue,
} from "@buff-not-bored/domain";

const LIBRARY_IDS: ReadonlySet<string> = new Set(EXERCISES.map((exercise) => exercise.id));

/** Whether your training needs are set up, and any conversation in progress. */
export async function loadSetupState(): Promise<{ hasProfile: boolean; draft?: NeedsConversationDraft }> {
  const [profile, draft] = await Promise.all([getNeedsProfile(), getNeedsConversationDraft()]);
  return { hasProfile: profile !== undefined, draft };
}

/** Keeps your place, so you can pick up where you left off on any device. */
export async function saveConversationDraft(draft: NeedsConversationDraft): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await saveNeedsConversationDraft(draft);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't keep your place" };
  }
}

/** Picks the conversation back up from Home's "carry on" prompt. */
export async function resumeConversation(): Promise<void> {
  const draft = await getNeedsConversationDraft();
  if (draft) await saveNeedsConversationDraft({ ...draft, paused: false });
}

/** Starts the conversation again from the first question. */
export async function restartConversation(): Promise<void> {
  await clearNeedsConversationDraft();
}

export type FinishConversationResult = { ok: true } | { ok: false; issues: NeedsProfileIssue[] } | { ok: false; error: string };

/** Saves your answers as your training needs. The conversation then ends. */
export async function finishConversation(answers: NeedsAnswers): Promise<FinishConversationResult> {
  const result = profileFromAnswers(answers, LIBRARY_IDS);
  if (!result.profile) return { ok: false, issues: result.issues };
  try {
    await saveNeedsProfile(result.profile);
    return { ok: true };
  } catch (error) {
    if (error instanceof NeedsProfileValidationError) return { ok: false, issues: error.issues };
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't save your training needs" };
  }
}

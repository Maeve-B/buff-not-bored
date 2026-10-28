/**
 * Your needs profile and the setup conversation's saved place, against the
 * local Postgres. Saving a profile clears the conversation, so both tables
 * are tested here, in one file (CLAUDE.md rule 5). This is the only file
 * that touches needs_profiles or needs_conversation_drafts, and it puts back
 * whatever was there before.
 */

import { NeedsProfileValidationError, type NeedsConversationDraft, type NeedsProfile } from "@buff-not-bored/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/client.js";
import {
  clearNeedsConversationDraft,
  getNeedsConversationDraft,
  saveNeedsConversationDraft,
} from "../src/repositories/needs-conversation-repository.js";
import { getNeedsProfile, saveNeedsProfile } from "../src/repositories/needs-profile-repository.js";

let before: Awaited<ReturnType<typeof prisma.needsProfile.findUnique>> = null;
let draftBefore: Awaited<ReturnType<typeof prisma.needsConversationDraft.findUnique>> = null;

beforeAll(async () => {
  before = await prisma.needsProfile.findUnique({ where: { id: "me" } });
  draftBefore = await prisma.needsConversationDraft.findUnique({ where: { id: "me" } });
  await prisma.needsProfile.deleteMany({ where: { id: "me" } });
  await prisma.needsConversationDraft.deleteMany({ where: { id: "me" } });
});

afterAll(async () => {
  await prisma.needsProfile.deleteMany({ where: { id: "me" } });
  if (before) await prisma.needsProfile.create({ data: before });
  await prisma.needsConversationDraft.deleteMany({ where: { id: "me" } });
  if (draftBefore) await prisma.needsConversationDraft.create({ data: { ...draftBefore, answers: draftBefore.answers ?? {} } });
  await prisma.$disconnect();
});

const profile: NeedsProfile = {
  goal: "hypertrophy",
  emphasis: "glutes",
  trainingDuration: "2_to_12_months",
  trainingKind: "free_weights",
  techniqueConfidence: "some",
  daysPerWeek: 2,
  preferredDays: [2, 5],
  sessionMinutes: 45,
  equipment: ["dumbbells", "bench"],
  heaviestDumbbellKg: 22.5,
  limitations: ["knee"],
  limitationNote: "Sore after long runs",
  avoidExerciseIds: ["bulgarian-split-squat"],
  favouriteExerciseIds: ["incline-db-press"],
  likesDislikes: "No burpees",
  source: "form",
};

describe("needs profile repository (S-008)", () => {
  it("has nothing before you fill it in", async () => {
    expect(await getNeedsProfile()).toBeUndefined();
  });

  it("saves and reads back every answer, with when you confirmed it", async () => {
    const saved = await saveNeedsProfile(profile);
    expect(saved).toMatchObject(profile);
    expect(new Date(saved.confirmedAt).getTime()).toBeGreaterThan(Date.now() - 60_000);
    expect(await getNeedsProfile()).toEqual(saved);
  });

  it("replaces the profile when you edit it, keeping one row", async () => {
    await saveNeedsProfile(profile);
    await saveNeedsProfile({ ...profile, goal: "strength", emphasis: undefined, limitationNote: undefined });
    const read = await getNeedsProfile();
    expect(read).toMatchObject({ goal: "strength" });
    expect(read?.emphasis).toBeUndefined();
    expect(read?.limitationNote).toBeUndefined();
    expect(await prisma.needsProfile.count()).toBe(1);
  });

  it("refuses an invalid profile before writing", async () => {
    await expect(saveNeedsProfile({ ...profile, daysPerWeek: 6, preferredDays: [] })).rejects.toBeInstanceOf(NeedsProfileValidationError);
  });
});

describe("setup conversation draft (S-015)", () => {
  const draft: NeedsConversationDraft = {
    answers: { goal: "strength", daysPerWeek: 3, preferredDays: [1, 3, 5] },
    stepId: "sessionMinutes",
    answered: ["goal", "emphasis", "daysPerWeek", "preferredDays"],
    paused: false,
  };

  it("keeps your place between visits", async () => {
    await clearNeedsConversationDraft();
    expect(await getNeedsConversationDraft()).toBeUndefined();
    await saveNeedsConversationDraft(draft);
    expect(await getNeedsConversationDraft()).toEqual(draft);
    await saveNeedsConversationDraft({ ...draft, paused: true });
    expect((await getNeedsConversationDraft())?.paused).toBe(true);
    await clearNeedsConversationDraft();
    expect(await getNeedsConversationDraft()).toBeUndefined();
  });

  it("refuses a step it doesn't know", async () => {
    await expect(saveNeedsConversationDraft({ ...draft, stepId: "nope" as never })).rejects.toThrow(/isn't recognised/);
  });

  it("ends the conversation once your profile is saved", async () => {
    await saveNeedsConversationDraft(draft);
    await saveNeedsProfile(profile);
    expect(await getNeedsConversationDraft()).toBeUndefined();
  });
});

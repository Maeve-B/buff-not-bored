/**
 * Your needs profile against the local Postgres. This file is the only one
 * that touches needs_profiles, and it puts back whatever was there before.
 */

import { NeedsProfileValidationError, type NeedsProfile } from "@buff-not-bored/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/client.js";
import { getNeedsProfile, saveNeedsProfile } from "../src/repositories/needs-profile-repository.js";

let before: Awaited<ReturnType<typeof prisma.needsProfile.findUnique>> = null;

beforeAll(async () => {
  before = await prisma.needsProfile.findUnique({ where: { id: "me" } });
  await prisma.needsProfile.deleteMany({ where: { id: "me" } });
});

afterAll(async () => {
  await prisma.needsProfile.deleteMany({ where: { id: "me" } });
  if (before) await prisma.needsProfile.create({ data: before });
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

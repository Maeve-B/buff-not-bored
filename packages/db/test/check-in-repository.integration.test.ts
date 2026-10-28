/**
 * Daily check-ins against the local Postgres. Uses dates far in the past
 * that nobody trains on, and removes only those rows (CLAUDE.md rule 5).
 */

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/client.js";
import { getCheckIn, saveCheckIn } from "../src/repositories/check-in-repository.js";

const DAYS = ["1999-01-04", "1999-01-05"];

async function removeTestDays() {
  await prisma.checkIn.deleteMany({ where: { date: { in: DAYS.map((d) => new Date(`${d}T00:00:00.000Z`)) } } });
}

beforeEach(removeTestDays);
afterAll(async () => {
  await removeTestDays();
  await prisma.$disconnect();
});

describe("check-in repository (S-016)", () => {
  it("has nothing for a day you haven't checked in", async () => {
    expect(await getCheckIn(DAYS[0]!)).toBeUndefined();
  });

  it("saves and reads back a day's answers, one row per day", async () => {
    const checkIn = { dateIso: DAYS[0]!, skipped: false, sleep: "poor" as const, energy: "low" as const, soreness: "very" as const, painRegions: ["knee" as const] };
    expect(await saveCheckIn(checkIn)).toEqual(checkIn);
    expect(await getCheckIn(DAYS[0]!)).toEqual(checkIn);

    const changed = { ...checkIn, sleep: "good" as const, painRegions: [] };
    await saveCheckIn(changed);
    expect(await getCheckIn(DAYS[0]!)).toEqual(changed);
    expect(await prisma.checkIn.count({ where: { date: new Date(`${DAYS[0]}T00:00:00.000Z`) } })).toBe(1);
  });

  it("records a skipped day", async () => {
    await saveCheckIn({ dateIso: DAYS[1]!, skipped: true, painRegions: [] });
    expect(await getCheckIn(DAYS[1]!)).toEqual({ dateIso: DAYS[1], skipped: true, painRegions: [], sleep: undefined, energy: undefined, soreness: undefined });
  });

  it("refuses a check-in it doesn't recognise", async () => {
    await expect(saveCheckIn({ dateIso: DAYS[0]!, skipped: false, painRegions: [] })).rejects.toThrow(/Say how you slept/);
  });
});

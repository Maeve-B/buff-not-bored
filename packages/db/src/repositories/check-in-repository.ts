/**
 * Daily check-ins (spec §6.6, S-016): one row per day, checked with the
 * domain's own rules before any write.
 */

import { checkCheckIn, type CheckIn, type EnergyAnswer, type JointStressTag, type SleepAnswer, type SorenessAnswer } from "@buff-not-bored/domain";
import type { CheckIn as CheckInRow } from "@prisma/client";
import { prisma } from "../client.js";

function toDomain(row: CheckInRow): CheckIn {
  return {
    dateIso: row.date.toISOString().slice(0, 10),
    skipped: row.skipped,
    sleep: (row.sleep ?? undefined) as SleepAnswer | undefined,
    energy: (row.energy ?? undefined) as EnergyAnswer | undefined,
    soreness: (row.soreness ?? undefined) as SorenessAnswer | undefined,
    painRegions: row.painRegions as JointStressTag[],
  };
}

/** The check-in for a day (YYYY-MM-DD), or undefined if you haven't checked in. */
export async function getCheckIn(dateIso: string): Promise<CheckIn | undefined> {
  const row = await prisma.checkIn.findUnique({ where: { date: new Date(`${dateIso}T00:00:00.000Z`) } });
  return row ? toDomain(row) : undefined;
}

/** Saves a day's check-in, replacing an earlier one for the same day. */
export async function saveCheckIn(checkIn: CheckIn): Promise<CheckIn> {
  const problems = checkCheckIn(checkIn);
  if (problems.length > 0) throw new Error(problems.join(" "));
  const date = new Date(`${checkIn.dateIso}T00:00:00.000Z`);
  const data = {
    skipped: checkIn.skipped,
    sleep: checkIn.sleep ?? null,
    energy: checkIn.energy ?? null,
    soreness: checkIn.soreness ?? null,
    painRegions: [...checkIn.painRegions],
  };
  const row = await prisma.checkIn.upsert({ where: { date }, create: { date, ...data }, update: data });
  return toDomain(row);
}

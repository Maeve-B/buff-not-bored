/**
 * App-wide settings (one row, id "app", until multi-user accounts exist).
 * Weights are always stored in kg; the weight unit only chooses how they're
 * shown and entered (S-006).
 */

import { isDisplayUnit, type DisplayUnit } from "@buff-not-bored/domain";
import { prisma } from "../client.js";

const SETTINGS_ID = "app";

export interface AppSettings {
  weightUnit: DisplayUnit;
}

/** Your settings, or the defaults (kg) if nothing has been saved yet. */
export async function getAppSettings(): Promise<AppSettings> {
  const row = await prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } });
  return { weightUnit: row && isDisplayUnit(row.weightUnit) ? row.weightUnit : "kg" };
}

/** Saves the unit weights are shown and entered in. Nothing stored in kg changes. */
export async function saveWeightUnit(weightUnit: DisplayUnit): Promise<AppSettings> {
  if (!isDisplayUnit(weightUnit)) throw new Error(`Unknown weight unit "${String(weightUnit)}"`);
  const row = await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, weightUnit },
    update: { weightUnit },
  });
  return { weightUnit: row.weightUnit as DisplayUnit };
}

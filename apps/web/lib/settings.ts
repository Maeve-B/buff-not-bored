/**
 * Reads your weight unit for the root layout (S-006). Server-side only, and
 * not a server action:
 * nothing calls it from the browser. If the database can't be reached, the
 * app falls back to kg rather than failing every page.
 */

import { getAppSettings } from "@buff-not-bored/db";
import type { DisplayUnit } from "@buff-not-bored/domain";

export async function loadWeightUnit(): Promise<DisplayUnit> {
  try {
    return (await getAppSettings()).weightUnit;
  } catch {
    return "kg";
  }
}

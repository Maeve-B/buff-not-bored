/**
 * App settings against the local Postgres. This file is the only one that
 * touches app_settings, and it puts back whatever was there before.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/client.js";
import { getAppSettings, saveWeightUnit } from "../src/repositories/settings-repository.js";

let before: { weightUnit: string } | null = null;

beforeAll(async () => {
  before = await prisma.appSettings.findUnique({ where: { id: "app" }, select: { weightUnit: true } });
  await prisma.appSettings.deleteMany({ where: { id: "app" } });
});

afterAll(async () => {
  await prisma.appSettings.deleteMany({ where: { id: "app" } });
  if (before) await prisma.appSettings.create({ data: { id: "app", weightUnit: before.weightUnit } });
  await prisma.$disconnect();
});

describe("app settings (S-006)", () => {
  it("defaults to kg before anything is saved", async () => {
    expect(await getAppSettings()).toEqual({ weightUnit: "kg" });
  });

  it("saves lb, then kg again, in one row", async () => {
    expect(await saveWeightUnit("lb")).toEqual({ weightUnit: "lb" });
    expect(await getAppSettings()).toEqual({ weightUnit: "lb" });
    await saveWeightUnit("kg");
    expect(await getAppSettings()).toEqual({ weightUnit: "kg" });
    expect(await prisma.appSettings.count()).toBe(1);
  });

  it("refuses an unknown unit", async () => {
    await expect(saveWeightUnit("stone" as never)).rejects.toThrow(/Unknown weight unit/);
  });
});

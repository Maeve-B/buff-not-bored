import { describe, expect, it } from "vitest";
import {
  answersFromCheckIn,
  checkCheckIn,
  checkInFromAnswers,
  checkInProgress,
  nextCheckInStep,
  previousCheckInStep,
  skippedCheckIn,
  type CheckInAnswers,
} from "../src/entities/check-in.js";

const fine: CheckInAnswers = { sleep: "ok", energy: "high", soreness: "some", pain: false, painRegions: [] };

describe("the check-in (S-016, §6.6)", () => {
  it("asks sleep, energy, soreness, then pain, and only asks where if something hurts", () => {
    expect(nextCheckInStep("sleep", {} as CheckInAnswers)).toBe("energy");
    expect(nextCheckInStep("pain", { ...fine, pain: false })).toBe("done");
    expect(nextCheckInStep("pain", { ...fine, pain: true })).toBe("painWhere");
    expect(nextCheckInStep("painWhere", { ...fine, pain: true })).toBe("done");
    expect(previousCheckInStep("done", { ...fine, pain: false })).toBe("pain");
    expect(previousCheckInStep("done", { ...fine, pain: true })).toBe("painWhere");
    expect(previousCheckInStep("sleep", fine)).toBe("sleep");
  });

  it("counts 4 questions, or 5 when it asks where it hurts", () => {
    expect(checkInProgress("sleep", { painRegions: [] })).toEqual({ number: 1, of: 4 });
    expect(checkInProgress("painWhere", { ...fine, pain: true })).toEqual({ number: 5, of: 5 });
    expect(checkInProgress("done", fine)).toBeUndefined();
  });

  it("builds the day's check-in, needing an area if something hurts", () => {
    expect(checkInFromAnswers("2026-10-29", fine)).toEqual({
      checkIn: { dateIso: "2026-10-29", skipped: false, sleep: "ok", energy: "high", soreness: "some", painRegions: [] },
    });
    expect(checkInFromAnswers("2026-10-29", { ...fine, pain: true, painRegions: [] }).problem).toBe("Tick where it hurts.");
    expect(checkInFromAnswers("2026-10-29", { ...fine, pain: true, painRegions: ["knee"] }).checkIn?.painRegions).toEqual(["knee"]);
    expect(checkInFromAnswers("2026-10-29", { painRegions: [] }).problem).toMatch(/Not today/);
  });

  it("forgets pain areas once you say nothing hurts", () => {
    expect(checkInFromAnswers("2026-10-29", { ...fine, pain: false, painRegions: ["knee"] }).checkIn?.painRegions).toEqual([]);
  });

  it("records a skipped day with no answers", () => {
    expect(skippedCheckIn("2026-10-29")).toEqual({ dateIso: "2026-10-29", skipped: true, painRegions: [] });
    expect(checkCheckIn(skippedCheckIn("2026-10-29"))).toEqual([]);
  });

  it("goes back to the answers you gave, to change them", () => {
    const checkIn = checkInFromAnswers("2026-10-29", { ...fine, pain: true, painRegions: ["shoulder"] }).checkIn!;
    expect(answersFromCheckIn(checkIn)).toEqual({ ...fine, pain: true, painRegions: ["shoulder"] });
    expect(answersFromCheckIn(skippedCheckIn("2026-10-29"))).toEqual({ painRegions: [] });
  });

  it("refuses anything it doesn't recognise before saving", () => {
    expect(checkCheckIn({ dateIso: "yesterday", skipped: false, sleep: "ok", energy: "ok", soreness: "none", painRegions: [] })).toEqual([
      "The date isn't recognised.",
    ]);
    expect(checkCheckIn({ dateIso: "2026-10-29", skipped: false, sleep: "great" as never, energy: "ok", soreness: "none", painRegions: ["toe" as never] })).toEqual([
      "Some pain areas aren't recognised.",
      "Say how you slept.",
    ]);
    expect(checkCheckIn({ dateIso: "2026-10-29", skipped: true, sleep: "ok", painRegions: [] })).toEqual(["A skipped day has no answers."]);
    expect(checkCheckIn({ dateIso: "2026-13-45", skipped: true, painRegions: [] })).toEqual(["The date isn't recognised."]);
    expect(checkCheckIn({ dateIso: "2026-02-30", skipped: true, painRegions: [] })).toEqual(["The date isn't recognised."]);
  });

  it("copes with pain areas missing from outside input", () => {
    const broken = { sleep: "ok", energy: "ok", soreness: "none", pain: true } as unknown as CheckInAnswers;
    expect(checkInFromAnswers("2026-10-29", broken).problem).toBe("Tick where it hurts.");
  });
});

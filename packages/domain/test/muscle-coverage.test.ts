import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import {
  aggregateMuscleCoverage,
  calculateMuscleCoverage,
  getAllMusclesTrained,
  getExposureCount,
  getMuscleCoverage,
  hasPrimaryMuscle,
} from "../src/entities/muscle-coverage.js";

const bulgarianSplitSquat = EXERCISES.find((e) => e.id === "bulgarian-split-squat")!;
const hammerCurl = EXERCISES.find((e) => e.id === "hammer-curl")!;
const bentOverRow = EXERCISES.find((e) => e.id === "bent-over-row")!;
const squats = EXERCISES.find((e) => e.id === "squats")!;

describe("muscle coverage", () => {
  it("derives coverage from primary/secondary muscles, not programme group", () => {
    const coverage = getMuscleCoverage(bulgarianSplitSquat);
    expect(coverage).toContainEqual({ muscle: "quads", role: "primary" });
    expect(coverage).toContainEqual({ muscle: "glutes", role: "primary" });
    expect(coverage).toContainEqual({ muscle: "hamstrings", role: "secondary" });
    expect(coverage).toContainEqual({ muscle: "adductors", role: "secondary" });
    expect(coverage.some((c) => c.muscle === "chest")).toBe(false);
  });

  it("dedupes across primary and secondary in getAllMusclesTrained", () => {
    const muscles = getAllMusclesTrained(hammerCurl);
    expect(muscles).toEqual(["biceps", "brachialis", "forearms"]);
  });

  it("hasPrimaryMuscle checks primary muscles only", () => {
    expect(hasPrimaryMuscle(hammerCurl, "biceps")).toBe(true);
    expect(hasPrimaryMuscle(hammerCurl, "forearms")).toBe(false); // forearms is secondary
  });

  it("aggregates coverage across a set of exercises", () => {
    const coverage = aggregateMuscleCoverage([bulgarianSplitSquat, hammerCurl]);
    expect(coverage.get("quads")).toEqual({ primaryCount: 1, secondaryCount: 0 });
    expect(coverage.get("biceps")).toEqual({ primaryCount: 1, secondaryCount: 0 });
    expect(coverage.get("forearms")).toEqual({ primaryCount: 0, secondaryCount: 1 });
    expect(coverage.has("chest")).toBe(false);
  });

  it("Bulgarian Split Squat contributes to glutes/quads, not chest (spec §3 / Phase 2 §9)", () => {
    expect(hasPrimaryMuscle(bulgarianSplitSquat, "glutes")).toBe(true);
    expect(hasPrimaryMuscle(bulgarianSplitSquat, "quads")).toBe(true);
    expect(hasPrimaryMuscle(bulgarianSplitSquat, "chest")).toBe(false);
    expect(getAllMusclesTrained(bulgarianSplitSquat)).not.toContain("chest");
  });

  it("Bent-Over Row contributes to lats", () => {
    expect(hasPrimaryMuscle(bentOverRow, "lats")).toBe(true);
  });
});

describe("calculateMuscleCoverage (explainable report)", () => {
  const report = calculateMuscleCoverage([bulgarianSplitSquat, hammerCurl, squats]);

  it("lists every muscle trained, with primary/secondary exposure counts", () => {
    expect(report.musclesTrained).toContain("quads");
    expect(report.musclesTrained).toContain("biceps");
    expect(report.musclesTrained).not.toContain("chest");

    const quadsEntry = report.entries.get("quads")!;
    // primary: bulgarianSplitSquat, squats (2); secondary: none in this set
    expect(quadsEntry.primaryExposures).toBe(2);
    expect(quadsEntry.secondaryExposures).toBe(0);
    expect(quadsEntry.totalExposures).toBe(2);
  });

  it("names which exercises contribute to each muscle, at which role", () => {
    const quadsEntry = report.entries.get("quads")!;
    expect(quadsEntry.primaryExerciseIds.sort()).toEqual(["bulgarian-split-squat", "squats"]);
  });

  it("distinguishes primary from secondary — not all exposure is equal", () => {
    // hammerCurl: primary biceps+brachialis, secondary forearms
    const brachialisEntry = report.entries.get("brachialis")!;
    const forearmsEntry = report.entries.get("forearms")!;
    expect(brachialisEntry.primaryExposures).toBe(1);
    expect(brachialisEntry.secondaryExposures).toBe(0);
    expect(forearmsEntry.primaryExposures).toBe(0);
    expect(forearmsEntry.secondaryExposures).toBe(1);
  });

  it("getExposureCount returns 0 for an untrained muscle rather than throwing", () => {
    expect(getExposureCount(report, "chest")).toBe(0);
  });

  it("extends naturally to a two-session (weekly) report via concatenation", () => {
    const sessionOneExercises = [squats];
    const sessionTwoExercises = [bulgarianSplitSquat];
    const weekly = calculateMuscleCoverage([...sessionOneExercises, ...sessionTwoExercises]);
    // quads trained (primary) in both sessions -> 2 total exposures across the week
    expect(getExposureCount(weekly, "quads")).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import {
  aggregateMuscleCoverage,
  getAllMusclesTrained,
  getMuscleCoverage,
  hasPrimaryMuscle,
} from "../src/entities/muscle-coverage.js";

const bulgarianSplitSquat = EXERCISES.find((e) => e.id === "bulgarian-split-squat")!;
const hammerCurl = EXERCISES.find((e) => e.id === "hammer-curl")!;

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
});

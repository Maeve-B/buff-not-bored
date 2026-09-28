import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { countTransitions, distinctEquipment, distinctLocations, rankByEquipmentAlignment, scoreEquipmentAlignment } from "../src/engine/equipment-optimiser.js";

const flatBenchPress = EXERCISES.find((e) => e.id === "flat-bench-press")!; // barbell, bench
const benchFlyes = EXERCISES.find((e) => e.id === "bench-flyes")!; // dumbbell, bench
const pushUps = EXERCISES.find((e) => e.id === "push-ups")!; // bodyweight, bench_or_floor
const squats = EXERCISES.find((e) => e.id === "squats")!; // barbell, rack
const overheadPress = EXERCISES.find((e) => e.id === "overhead-press")!; // dumbbell, standing, 12.5kg
const flatDbPress = EXERCISES.find((e) => e.id === "flat-db-press")!; // dumbbell, bench, 8kg

describe("scoreEquipmentAlignment", () => {
  it("returns a neutral score with no preference supplied", () => {
    const result = scoreEquipmentAlignment(benchFlyes, undefined);
    expect(result.score).toBe(0);
  });

  it("rewards a candidate at the preferred location", () => {
    const atBench = scoreEquipmentAlignment(benchFlyes, { preferredLocation: "bench" });
    const atRack = scoreEquipmentAlignment(squats, { preferredLocation: "bench" });
    expect(atBench.score).toBeGreaterThan(atRack.score);
  });

  it("rewards a candidate using the preferred equipment", () => {
    const dumbbellScore = scoreEquipmentAlignment(benchFlyes, { preferredEquipment: "dumbbell" });
    const barbellScore = scoreEquipmentAlignment(flatBenchPress, { preferredEquipment: "dumbbell" });
    expect(dumbbellScore.score).toBeGreaterThan(barbellScore.score);
  });

  it("rewards equipment continuity with the exercise being replaced", () => {
    const sameEquipment = scoreEquipmentAlignment(benchFlyes, { minimizeEquipmentChanges: true }, flatDbPress); // both dumbbell
    const differentEquipment = scoreEquipmentAlignment(flatBenchPress, { minimizeEquipmentChanges: true }, flatDbPress); // barbell vs dumbbell
    expect(sameEquipment.score).toBeGreaterThan(differentEquipment.score);
  });

  it("rewards location continuity with the exercise being replaced", () => {
    const sameLocation = scoreEquipmentAlignment(benchFlyes, { minimizeLocationChanges: true }, flatDbPress); // both bench
    const differentLocation = scoreEquipmentAlignment(squats, { minimizeLocationChanges: true }, flatDbPress); // rack vs bench
    expect(sameLocation.score).toBeGreaterThan(differentLocation.score);
  });

  it("rewards weight continuity, favouring smaller deltas", () => {
    const closeWeight = scoreEquipmentAlignment(benchFlyes, { minimizeWeightChanges: true }, flatDbPress); // 6kg vs 8kg
    const farWeight = scoreEquipmentAlignment(overheadPress, { minimizeWeightChanges: true }, flatDbPress); // 12.5kg vs 8kg
    expect(closeWeight.score).toBeGreaterThan(farWeight.score);
  });

  it("every non-zero contribution has an explanation", () => {
    const result = scoreEquipmentAlignment(benchFlyes, { preferredLocation: "bench", preferredEquipment: "dumbbell" });
    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result.explanation.some((line) => line.includes("bench"))).toBe(true);
  });
});

describe("countTransitions", () => {
  it("counts zero transitions for a single exercise", () => {
    expect(countTransitions([squats])).toEqual({ equipmentChanges: 0, locationChanges: 0 });
  });

  it("counts equipment and location changes across a sequence", () => {
    // squats(barbell/rack) -> benchFlyes(dumbbell/bench) -> pushUps(bodyweight/bench_or_floor)
    const result = countTransitions([squats, benchFlyes, pushUps]);
    expect(result.equipmentChanges).toBe(2);
    expect(result.locationChanges).toBe(2);
  });

  it("counts no changes when equipment/location stay constant", () => {
    const result = countTransitions([flatBenchPress, benchFlyes]); // barbell/bench -> dumbbell/bench: equipment changes, location doesn't
    expect(result.locationChanges).toBe(0);
    expect(result.equipmentChanges).toBe(1);
  });
});

describe("rankByEquipmentAlignment", () => {
  it("orders candidates highest score first, with a deterministic id tie-break", () => {
    const ranked = rankByEquipmentAlignment([squats, benchFlyes, flatBenchPress], { preferredLocation: "bench" });
    expect(ranked[0]!.score).toBeGreaterThanOrEqual(ranked[1]!.score);
    expect(ranked[1]!.score).toBeGreaterThanOrEqual(ranked[2]!.score);
    // benchFlyes and flatBenchPress both at "bench" and tie in score -> alphabetical id tie-break
    const tied = ranked.filter((r) => r.score === ranked[0]!.score).map((r) => r.exercise.id);
    if (tied.length > 1) {
      expect(tied).toEqual([...tied].sort());
    }
  });

  it("is deterministic across repeated calls", () => {
    const first = rankByEquipmentAlignment([squats, benchFlyes, flatBenchPress], { preferredLocation: "bench" });
    const second = rankByEquipmentAlignment([squats, benchFlyes, flatBenchPress], { preferredLocation: "bench" });
    expect(first.map((r) => r.exercise.id)).toEqual(second.map((r) => r.exercise.id));
  });
});

describe("distinctEquipment / distinctLocations", () => {
  it("returns unique equipment types across a set of exercises", () => {
    expect(distinctEquipment([squats, benchFlyes, pushUps])).toEqual(["barbell", "dumbbell", "bodyweight"]);
  });

  it("returns unique locations across a set of exercises", () => {
    expect(distinctLocations([squats, benchFlyes])).toEqual(["rack", "bench"]);
  });
});

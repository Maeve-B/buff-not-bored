import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { PRESET_PROGRAMME_1 } from "../src/data/preset-programme-1.js";
import {
  findPresetSession,
  nextPresetSession,
  presetSessionName,
  recommendedRestSeconds,
  type PresetSession,
} from "../src/entities/preset-programme.js";
import { applyStartingWeight, buildPresetStrengthSession, StrengthBuilderError } from "../src/engine/strength-builder.js";

const monday = findPresetSession(PRESET_PROGRAMME_1, "monday")!;
const wednesday = findPresetSession(PRESET_PROGRAMME_1, "wednesday")!;
const friday = findPresetSession(PRESET_PROGRAMME_1, "friday")!;

/** "Name 3 × 8–12" for each exercise, to compare against §10.1 at a glance. */
function prescriptionOf(session: PresetSession): string[] {
  return buildPresetStrengthSession(EXERCISES, session).exercises.map((se) => {
    const range = se.targetRange!;
    const amount = range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`;
    const unit = se.sets[0]!.targetDuration !== undefined ? " s" : se.exercise.perSide ? " per side" : "";
    return `${se.exercise.name} ${se.sets.length} × ${amount}${unit}${se.supersetGroup ? " (superset)" : ""}`;
  });
}

describe("Preset Programme 1 (spec §10.1, seeded exactly)", () => {
  it("has Monday, Wednesday and Friday, in that rotation order", () => {
    expect(PRESET_PROGRAMME_1.sessions.map(presetSessionName)).toEqual([
      "Monday · Squat and push",
      "Wednesday · Deadlift and shoulders",
      "Friday · Glutes and legs",
    ]);
  });

  it("Monday · Squat and push", () => {
    expect(prescriptionOf(monday)).toEqual([
      "Assisted Pull-Up 3 × 4–8",
      "Assisted Dead Hang 3 × 20–30 s",
      "Back Squat 3 × 6–10",
      "DB Bench Press 3 × 8–12",
      "Seated Cable Row 3 × 8–12 (superset)",
      "Lateral Raises 2 × 12–20 (superset)",
      "Captain's Chair Knee Raise 2 × 8–12",
    ]);
  });

  it("Wednesday · Deadlift and shoulders", () => {
    expect(prescriptionOf(wednesday)).toEqual([
      "Assisted Pull-Up 3 × 4–8",
      "Assisted Dead Hang 3 × 20–30 s",
      "Conventional Deadlift 3 × 5–8",
      "Overhead Press 3 × 6–10",
      "Lat Pulldown 3 × 8–12",
      "Leg Curl 3 × 10–15",
      "Cable Woodchop 2 × 10 per side",
    ]);
  });

  it("Friday · Glutes and legs", () => {
    expect(prescriptionOf(friday)).toEqual([
      "Assisted Pull-Up 3 × 4–8",
      "Assisted Dead Hang 3 × 20–30 s",
      "Hip Thrust Machine 3 × 8–15",
      "Leg Press 3 × 10–15",
      "Incline DB Press 3 × 8–12",
      "Chest-Supported DB Row 2 × 8–12 (superset)",
      "Lateral Raises 2 × 12–20 (superset)",
      "Farmer Carry 3 × 30–45 s",
    ]);
  });

  it("puts pull-up work first in every session", () => {
    for (const session of PRESET_PROGRAMME_1.sessions) {
      expect(session.slots.slice(0, 2).map((slot) => slot.exerciseId)).toEqual(["assisted-pull-up", "assisted-dead-hang"]);
    }
  });
});

describe("buildPresetStrengthSession", () => {
  it("targets the bottom of each range, in reps or seconds", () => {
    const session = buildPresetStrengthSession(EXERCISES, monday);
    const squat = session.exercises.find((se) => se.exercise.id === "squats")!;
    expect(squat.sets.map((set) => set.targetReps)).toEqual([6, 6, 6]);
    const hang = session.exercises.find((se) => se.exercise.id === "assisted-dead-hang")!;
    expect(hang.sets.map((set) => set.targetDuration)).toEqual([20, 20, 20]);
    expect(hang.sets[0]!.targetReps).toBeUndefined();
  });

  it("starts every weight blank, and prescribes yours once you have one (D-003, D-011)", () => {
    expect(buildPresetStrengthSession(EXERCISES, monday).exercises.every((se) => se.sets.every((set) => set.targetWeight === undefined))).toBe(
      true,
    );
    const withWeights = buildPresetStrengthSession(EXERCISES, monday, { currentWeights: { squats: 40, "assisted-pull-up": 25 } });
    expect(withWeights.exercises.find((se) => se.exercise.id === "squats")!.sets.map((set) => set.targetWeight)).toEqual([40, 40, 40]);
    expect(withWeights.exercises.find((se) => se.exercise.id === "assisted-pull-up")!.sets[0]!.targetWeight).toBe(25);
  });

  it("recommends rest by exercise class, for information only (§6.3, D-010)", () => {
    const session = buildPresetStrengthSession(EXERCISES, monday);
    expect(session.exercises.find((se) => se.exercise.id === "squats")!.recommendedRest).toEqual({ min: 120, max: 180 });
    expect(session.exercises.find((se) => se.exercise.id === "lateral-raises")!.recommendedRest).toEqual({ min: 60, max: 90 });
    expect(recommendedRestSeconds("isolation")).toEqual({ min: 60, max: 90 });
  });

  it("keeps the range and superset pairing when a first-use weight fills in", () => {
    const session = applyStartingWeight(buildPresetStrengthSession(EXERCISES, monday), "seated-cable-row", 19);
    const row = session.exercises.find((se) => se.exercise.id === "seated-cable-row")!;
    expect(row.sets.map((set) => set.targetWeight)).toEqual([19, 19, 19]);
    expect(row.targetRange).toEqual({ min: 8, max: 12 });
    expect(row.supersetGroup).toBe("row-raise");
  });

  it("rejects a slot with no sets, or a range the wrong way round", () => {
    const noSets: PresetSession = { ...monday, slots: [{ exerciseId: "squats", sets: 0, reps: { min: 6, max: 10 } }] };
    const backwards: PresetSession = { ...monday, slots: [{ exerciseId: "squats", sets: 3, reps: { min: 10, max: 6 } }] };
    expect(() => buildPresetStrengthSession(EXERCISES, noSets)).toThrow(StrengthBuilderError);
    expect(() => buildPresetStrengthSession(EXERCISES, backwards)).toThrow(StrengthBuilderError);
  });

  it("rejects a slot that doesn't match how its exercise is counted", () => {
    const broken: PresetSession = { ...monday, slots: [{ exerciseId: "farmer-carry", sets: 3, reps: { min: 8, max: 12 } }] };
    expect(() => buildPresetStrengthSession(EXERCISES, broken)).toThrow(StrengthBuilderError);
  });
});

describe("the rotation (D-011)", () => {
  it("starts on Monday, then follows Monday → Wednesday → Friday → Monday", () => {
    expect(nextPresetSession(PRESET_PROGRAMME_1, undefined).id).toBe("monday");
    expect(nextPresetSession(PRESET_PROGRAMME_1, "monday").id).toBe("wednesday");
    expect(nextPresetSession(PRESET_PROGRAMME_1, "wednesday").id).toBe("friday");
    expect(nextPresetSession(PRESET_PROGRAMME_1, "friday").id).toBe("monday");
  });

  it("refuses a programme with no sessions, rather than returning nothing", () => {
    expect(() => nextPresetSession({ ...PRESET_PROGRAMME_1, sessions: [] }, undefined)).toThrow(/no sessions/);
  });

  it("starts from the beginning if the last session isn't part of the programme", () => {
    expect(nextPresetSession(PRESET_PROGRAMME_1, "w1-mon").id).toBe("monday");
  });
});

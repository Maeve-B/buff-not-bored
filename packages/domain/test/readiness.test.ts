import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { PRESET_PROGRAMME_1 } from "../src/data/preset-programme-1.js";
import { findPresetSession } from "../src/entities/preset-programme.js";
import type { StrengthExercise, StrengthSet } from "../src/entities/strength.js";
import { assessReadiness } from "../src/engine/readiness.js";
import { buildPresetStrengthSession } from "../src/engine/strength-builder.js";

const WEIGHTS = { squats: 40, "assisted-pull-up": 25, "assisted-dead-hang": 20 };

function exerciseFrom(day: string, id: string): StrengthExercise {
  const session = buildPresetStrengthSession(EXERCISES, findPresetSession(PRESET_PROGRAMME_1, day)!, { currentWeights: WEIGHTS });
  return session.exercises.find((se) => se.exercise.id === id)!;
}

/** Logs each set: [reps or seconds, weight?]. */
function logged(se: StrengthExercise, results: Array<[number, number?]>): StrengthExercise {
  const timed = se.sets[0]!.targetDuration !== undefined;
  return {
    ...se,
    sets: se.sets.map((set, i): StrengthSet => {
      const result = results[i];
      if (!result) return set;
      const [amount, weight] = result;
      return { ...set, ...(timed ? { actualDuration: amount } : { actualReps: amount }), actualWeight: weight, completed: true };
    }),
  };
}

describe("assessReadiness (§6.5 double progression, one session — D-014)", () => {
  const squat = exerciseFrom("monday", "squats"); // 3 × 6–10 at 40 kg

  it("is ready when every set reached the top of the range at your current weight", () => {
    expect(assessReadiness(logged(squat, [[10, 40], [10, 40], [11, 40]]))).toEqual({
      kind: "ready",
      direction: "add_load",
      incrementOptions: [0.25, 0.5, 1, 2.5, 5],
      top: 10,
    });
  });

  it("counts a heavier set as at least your current weight", () => {
    expect(assessReadiness(logged(squat, [[10, 42.5], [10, 40], [10, 40]]))?.kind).toBe("ready");
  });

  it("is not yet ready when a set fell short of the top, and says how many reached it", () => {
    expect(assessReadiness(logged(squat, [[10, 40], [9, 40], [8, 40]]))).toEqual({
      kind: "not_yet",
      reason: "below_top",
      setsAtTop: 1,
      totalSets: 3,
      top: 10,
      currentWeight: 40,
    });
  });

  it("counts a set you skipped as not at the top", () => {
    expect(assessReadiness(logged(squat, [[10, 40], [10, 40]]))).toMatchObject({ kind: "not_yet", reason: "below_top", setsAtTop: 2 });
  });

  it("doesn't count a lighter day (a set below your current weight)", () => {
    expect(assessReadiness(logged(squat, [[10, 40], [10, 37.5], [10, 40]]))).toMatchObject({
      kind: "not_yet",
      reason: "below_current_weight",
      currentWeight: 40,
    });
  });

  it("offers less assistance on an assisted exercise, and counts more assistance as a lighter day", () => {
    const pullUp = exerciseFrom("monday", "assisted-pull-up"); // 3 × 4–8 at 25 kg assistance
    expect(assessReadiness(logged(pullUp, [[8, 25], [8, 22.5], [8, 25]]))).toMatchObject({ kind: "ready", direction: "reduce_assistance" });
    expect(assessReadiness(logged(pullUp, [[8, 25], [8, 30], [8, 25]]))).toMatchObject({ kind: "not_yet", reason: "below_current_weight" });
  });

  it("judges a timed exercise by seconds", () => {
    const hang = exerciseFrom("monday", "assisted-dead-hang"); // 3 × 20–30 s
    expect(assessReadiness(logged(hang, [[30, 20], [30, 20], [30, 20]]))?.kind).toBe("ready");
    expect(assessReadiness(logged(hang, [[30, 20], [25, 20], [30, 20]]))).toMatchObject({ kind: "not_yet", top: 30, setsAtTop: 2 });
  });

  it("says a set logged with no weight doesn't count, rather than calling it lighter", () => {
    expect(assessReadiness(logged(squat, [[10], [10, 40], [10, 40]]))).toMatchObject({ kind: "not_yet", reason: "missing_weight" });
  });

  it("never offers to cut more assistance than you have", () => {
    const pullUp = { ...exerciseFrom("monday", "assisted-pull-up") };
    const low = { ...pullUp, recommendation: { baseWeight: 2.5, adjustments: [], finalWeight: 2.5 } };
    expect(assessReadiness(logged(low, [[8, 2.5], [8, 2.5], [8, 2.5]]))).toMatchObject({
      kind: "ready",
      incrementOptions: [0.25, 0.5, 1, 2.5],
    });
  });

  it("is ready with no increments on a bodyweight exercise", () => {
    const chair = exerciseFrom("monday", "captains-chair-knee-raise"); // 2 × 8–12
    expect(assessReadiness(logged(chair, [[12], [12]]))).toEqual({ kind: "ready", direction: "add_load", incrementOptions: [], top: 12 });
  });

  it("isn't ready on a weighted exercise with no weight yet", () => {
    const bench = exerciseFrom("monday", "flat-db-press"); // no current weight
    expect(assessReadiness(logged(bench, [[12], [12], [12]]))).toMatchObject({ kind: "not_yet", reason: "no_weight" });
  });

  it("has nothing to say before any set is logged", () => {
    expect(assessReadiness(squat)).toBeUndefined();
  });

  it("never changes the exercise's weight (§3.3)", () => {
    const before = logged(squat, [[10, 40], [10, 40], [10, 40]]);
    assessReadiness(before);
    expect(before.recommendation?.finalWeight).toBe(40);
    expect(before.sets.map((set) => set.targetWeight)).toEqual([40, 40, 40]);
  });
});

import { describe, expect, it } from "vitest";
import { EXERCISE_PROFILES } from "../src/data/exercise-profiles.js";
import { CLASSIC_EXERCISES, EXERCISES } from "../src/data/exercises.js";
import { refreshWorkout } from "../src/engine/refresh-engine.js";
import { buildDefaultSession } from "../src/engine/workout-builder.js";

/** The exercises added for Preset Programme 1 (S-003). */
const PRESET_IDS = [
  "assisted-pull-up",
  "assisted-dead-hang",
  "lat-pulldown",
  "seated-cable-row",
  "chest-supported-db-row",
  "leg-press",
  "hip-thrust-machine",
  "leg-curl",
  "captains-chair-knee-raise",
  "cable-woodchop",
  "farmer-carry",
];
import { MUSCLES } from "../src/entities/exercise.js";
import { validateCatalog } from "../src/validation/exercise.schema.js";

describe("exercise library", () => {
  it("contains all exercises from the current template plus library-only alternates", () => {
    // 24 from the original spec + 9 introduced by the PROGRAMME MODEL CORRECTION
    // (Lunges, Flat Bench Press, Bench Flyes, Bent-Over Row, Single-Arm Dumbbell Row,
    // Good Mornings, Close-Grip Bench Press, Barbell Curl, Upright Row).
    expect(CLASSIC_EXERCISES).toHaveLength(33);
  });

  it("adds the 11 exercises Preset Programme 1 needs (spec §10.1, S-003)", () => {
    const presetIds = EXERCISES.filter((e) => PRESET_IDS.includes(e.id)).map((e) => e.id);
    expect(presetIds).toEqual([
      "assisted-pull-up",
      "assisted-dead-hang",
      "lat-pulldown",
      "seated-cable-row",
      "chest-supported-db-row",
      "leg-press",
      "hip-thrust-machine",
      "leg-curl",
      "captains-chair-knee-raise",
      "cable-woodchop",
      "farmer-carry",
    ]);
  });

  it("keeps Circuit's own list to the classic 33, consistent on its own apart from library-wide links (D-012, D-022)", () => {
    expect(CLASSIC_EXERCISES).toHaveLength(33);
    const classicIds = new Set(CLASSIC_EXERCISES.map((e) => e.id));
    // Light alternatives and ladder links may point to the whole library; everything else must resolve within the classic list.
    const inClassic = (id: string | undefined) => (id !== undefined && classicIds.has(id) ? id : undefined);
    const withinClassic = CLASSIC_EXERCISES.map((e) => ({
      ...e,
      lightAlternativeIds: e.lightAlternativeIds.filter((id) => classicIds.has(id)),
      regressionId: inClassic(e.regressionId),
      progressionId: inClassic(e.progressionId),
    }));
    expect(() => validateCatalog(withinClassic)).not.toThrow();
  });

  it("never lets a Circuit refresh reach beyond the classic 33", () => {
    const classicIds = new Set(CLASSIC_EXERCISES.map((e) => e.id));
    const result = refreshWorkout(buildDefaultSession(CLASSIC_EXERCISES), CLASSIC_EXERCISES);
    expect(result.session.mainExercises.every((pe) => classicIds.has(pe.exercise.id))).toBe(true);
  });

  it("names the existing exercises the way Preset Programme 1 does", () => {
    const nameOf = (id: string) => EXERCISES.find((e) => e.id === id)?.name;
    expect(nameOf("squats")).toBe("Back Squat");
    expect(nameOf("deadlifts")).toBe("Conventional Deadlift");
    expect(nameOf("flat-db-press")).toBe("DB Bench Press");
  });

  it("adds the rest of the §10.2 starter library (S-009), every exercise with a swap group", () => {
    const added = EXERCISES.filter((e) => !CLASSIC_EXERCISES.includes(e) && !PRESET_IDS.includes(e.id));
    expect(added).toHaveLength(31);
    expect(added.map((e) => e.id)).toContain("goblet-squat");
    for (const exercise of added) expect(exercise.swapGroup, exercise.id).toBeDefined();
  });

  it("links the pull-up ladder in order (§10.3)", () => {
    const next = (id: string) => EXERCISES.find((e) => e.id === id)?.progressionId;
    expect([next("dead-hang"), next("scapular-pull-up"), next("band-assisted-pull-up"), next("negative-pull-up")]).toEqual([
      "scapular-pull-up",
      "band-assisted-pull-up",
      "negative-pull-up",
      "pull-up",
    ]);
    expect(EXERCISES.find((e) => e.id === "assisted-pull-up")).toMatchObject({ regressionId: "scapular-pull-up", progressionId: "negative-pull-up" });
  });

  it("gives every Preset Programme 1 exercise a swap group (§10.1)", () => {
    for (const exercise of EXERCISES.filter((e) => !CLASSIC_EXERCISES.includes(e))) {
      expect(exercise.swapGroup, exercise.id).toBeDefined();
    }
  });

  it("has unique ids", () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("passes structural validation", () => {
    expect(() => validateCatalog(EXERCISES)).not.toThrow();
  });

  it("distinguishes programme group from muscle group for the Bulgarian Split Squat (spec §3)", () => {
    const bss = EXERCISES.find((e) => e.id === "bulgarian-split-squat");
    expect(bss).toBeDefined();

    // Corrected: grouped under legs, matching its actual physiology — no cross-group special case.
    expect(bss?.programmeGroup).toBe("legs");
    expect(bss?.primaryMuscles).toEqual(["glutes", "quads"]);
    expect(bss?.secondaryMuscles).toEqual(["hamstrings", "adductors"]);
    expect(bss?.primaryMuscles).not.toContain("chest");
    expect(bss?.secondaryMuscles).not.toContain("chest");
  });

  it("classifies Bent-Over Row per the user-confirmed muscle breakdown", () => {
    const bentOverRow = EXERCISES.find((e) => e.id === "bent-over-row");
    expect(bentOverRow?.primaryMuscles).toEqual(["lats"]);
    expect(bentOverRow?.secondaryMuscles).toEqual(["upper_back", "biceps"]);
  });

  it("has at least one active exercise per programme group", () => {
    const groups = ["legs", "back", "chest", "triceps", "shoulders", "biceps", "core"] as const;
    for (const group of groups) {
      const found = EXERCISES.some((e) => e.programmeGroup === group && e.active);
      expect(found, `expected an active exercise for group "${group}"`).toBe(true);
    }
  });

  it("flags newly-introduced exercises with placeholder data as needing review", () => {
    const newExerciseIds = [
      "lunges",
      "flat-bench-press",
      "bench-flyes",
      "bent-over-row",
      "single-arm-dumbbell-row",
      "good-mornings",
      "close-grip-bench-press",
      "barbell-curl",
      "upright-row",
    ];
    for (const id of newExerciseIds) {
      const exercise = EXERCISES.find((e) => e.id === id);
      expect(exercise, `expected exercise "${id}" to exist`).toBeDefined();
      expect(exercise?.needsReview, `expected "${id}" to be flagged needsReview`).toBe(true);
    }
  });

  it("keeps exercises no longer in the current template as active library alternates", () => {
    const retainedAlternates = [
      "rdl-upright-row",
      "incline-db-press",
      "front-raises",
      "concentration-curl",
      "close-grip-push-ups",
    ];
    for (const id of retainedAlternates) {
      const exercise = EXERCISES.find((e) => e.id === id);
      expect(exercise, `expected alternate "${id}" to still exist in the library`).toBeDefined();
      expect(exercise?.active).toBe(true);
    }
  });
});

describe("muscle taxonomy correction", () => {
  it("retires the generic 'back' and 'shoulders' muscle values in favour of specific ones", () => {
    expect(MUSCLES).not.toContain("back");
    expect(MUSCLES).not.toContain("shoulders");
  });

  it("includes 'trapezius' and 'quads' (renamed from 'quadriceps')", () => {
    expect(MUSCLES).toContain("trapezius");
    expect(MUSCLES).toContain("quads");
    expect(MUSCLES).not.toContain("quadriceps");
  });

  it("no exercise in the library uses a retired muscle value", () => {
    const retired = new Set(["back", "shoulders", "quadriceps"]);
    for (const exercise of EXERCISES) {
      for (const muscle of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) {
        expect(retired.has(muscle), `exercise "${exercise.id}" uses retired muscle value "${muscle}"`).toBe(false);
      }
    }
  });

  it("classifies Upright Row per the user-confirmed breakdown", () => {
    const uprightRow = EXERCISES.find((e) => e.id === "upright-row");
    expect(uprightRow?.primaryMuscles).toEqual(["lateral_deltoids", "trapezius"]);
    expect(uprightRow?.secondaryMuscles).toEqual(["biceps", "upper_back"]);
  });

  it("classifies Close-Grip Bench Press per the user-confirmed breakdown", () => {
    const closeGripBenchPress = EXERCISES.find((e) => e.id === "close-grip-bench-press");
    expect(closeGripBenchPress?.primaryMuscles).toEqual(["triceps", "chest"]);
    expect(closeGripBenchPress?.secondaryMuscles).toEqual(["anterior_deltoids"]);
  });

  it("classifies Flat Bench Press and Bench Flyes per the user-confirmed breakdown", () => {
    const flatBenchPress = EXERCISES.find((e) => e.id === "flat-bench-press");
    expect(flatBenchPress?.primaryMuscles).toEqual(["chest"]);
    expect(flatBenchPress?.secondaryMuscles).toEqual(["triceps", "anterior_deltoids"]);

    const benchFlyes = EXERCISES.find((e) => e.id === "bench-flyes");
    expect(benchFlyes?.primaryMuscles).toEqual(["chest"]);
    expect(benchFlyes?.secondaryMuscles).toEqual(["anterior_deltoids"]);
  });

  it("classifies Lunges, Single-Arm Dumbbell Row, and Good Mornings per the user-confirmed breakdown", () => {
    const lunges = EXERCISES.find((e) => e.id === "lunges");
    expect(lunges?.primaryMuscles).toEqual(["quads", "glutes"]);
    expect(lunges?.secondaryMuscles).toEqual(["hamstrings", "adductors"]);

    const singleArmRow = EXERCISES.find((e) => e.id === "single-arm-dumbbell-row");
    expect(singleArmRow?.primaryMuscles).toEqual(["lats"]);
    expect(singleArmRow?.secondaryMuscles).toEqual(["upper_back", "biceps"]);

    const goodMornings = EXERCISES.find((e) => e.id === "good-mornings");
    expect(goodMornings?.primaryMuscles).toEqual(["hamstrings", "glutes"]);
    expect(goodMornings?.secondaryMuscles).toEqual(["spinal_erectors"]);
  });

  it("reclassifies Overhead Press away from the retired generic 'shoulders' value and flags it for review", () => {
    // Not explicitly given by the user — a necessary consequence of retiring "shoulders".
    const overheadPress = EXERCISES.find((e) => e.id === "overhead-press");
    expect(overheadPress?.primaryMuscles).toEqual(["anterior_deltoids"]);
    expect(overheadPress?.secondaryMuscles).toEqual(["lateral_deltoids", "triceps"]);
    expect(overheadPress?.needsReview).toBe(true);
  });
});

describe("exercise library — v2 profile (§9.1, S-001)", () => {
  it("gives every exercise a profile, and every profile belongs to an exercise", () => {
    expect(Object.keys(EXERCISE_PROFILES).sort()).toEqual(EXERCISES.map((e) => e.id).sort());
  });

  it("keeps the v1 fields the existing engines run on (D-002)", () => {
    for (const exercise of EXERCISES) {
      expect(exercise.programmeGroup).toBeDefined();
      expect(exercise.equipment).toBeDefined();
      expect(exercise.location).toBeDefined();
    }
  });

  it("hands out independent copies, so changing one exercise's increments can't change another's", () => {
    const squats = EXERCISES.find((e) => e.id === "squats")!;
    const deadlifts = EXERCISES.find((e) => e.id === "deadlifts")!;
    expect(squats.incrementOptions).not.toBe(deadlifts.incrementOptions);
    expect(squats.incrementOptions).not.toBe(EXERCISE_PROFILES.squats.incrementOptions);
  });

  it("offers a 0.25 kg jump on every loaded exercise (D-007)", () => {
    for (const exercise of EXERCISES.filter((e) => e.loadType !== "bodyweight")) {
      expect(exercise.incrementOptions[0], exercise.id).toBe(0.25);
    }
  });

  it("never defaults strength work to percentage progression (§3.3)", () => {
    expect(EXERCISES.filter((e) => e.progressionStrategyDefault === "percentage")).toEqual([]);
  });

  it("defaults compound lifts to the load nudge and isolation lifts to double progression, unless unloaded", () => {
    for (const exercise of EXERCISES) {
      // Unloaded bodyweight and assisted work are skills that progress on the ladder (§6.5, §10.3).
      const expected =
        exercise.loadType === "bodyweight" || exercise.loadType === "assisted_machine"
          ? "ladder"
          : exercise.exerciseClass === "compound"
            ? "load_nudge"
            : "double_progression";
      expect(exercise.progressionStrategyDefault, exercise.id).toBe(expected);
    }
  });

  it("derives station from the v1 location, so faff scoring sees the same layout", () => {
    const stationFor = {
      rack: "rack",
      bench: "bench",
      standing: "open_space",
      floor: "floor",
      bench_or_floor: "floor",
      cable: "cable_stack",
      machine: "machine",
      pull_up_bar: "pull_up_bar",
    };
    for (const exercise of EXERCISES) {
      expect(exercise.station, exercise.id).toBe(stationFor[exercise.location]);
    }
  });

  it("classes the core exercises as isolation (Maeve's call, S-001 Q3)", () => {
    for (const id of ["plank", "russian-twists", "bicycle-crunches"]) {
      expect(EXERCISES.find((e) => e.id === id)?.exerciseClass, id).toBe("isolation");
    }
  });

  it("gives the combination exercises one primary pattern each (S-001 Q4)", () => {
    expect(EXERCISES.find((e) => e.id === "rdl-upright-row")?.movementPattern).toBe("hinge");
    expect(EXERCISES.find((e) => e.id === "squat-calf-raise")?.movementPattern).toBe("squat");
  });

  it("records assistance on exactly the assisted exercises, where less is progress (§9.1)", () => {
    const assisted = EXERCISES.filter((e) => e.loadDirection === "reduce_assistance").map((e) => e.id);
    expect(assisted).toEqual(["assisted-pull-up", "assisted-dead-hang"]);
    expect(EXERCISES.filter((e) => e.loadType === "assisted_machine").map((e) => e.id)).toEqual(assisted);
  });
});

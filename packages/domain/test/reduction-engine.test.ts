import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import type { Exercise } from "../src/entities/exercise.js";
import type { WorkoutSession } from "../src/entities/workout-session.js";
import { buildDefaultSession } from "../src/engine/workout-builder.js";
import { reduceExerciseCount, ReductionError } from "../src/engine/reduction-engine.js";

const defaultSession = buildDefaultSession(EXERCISES);

function mainIdsFor(session: WorkoutSession, group: string): string[] {
  return session.mainExercises.filter((pe) => pe.role === "main" && pe.exercise.programmeGroup === group).map((pe) => pe.exercise.id);
}

describe("reduceExerciseCount — real programme, Legs 5 -> 3", () => {
  const result = reduceExerciseCount(defaultSession, { legs: 3 });

  it("retains exactly 3 legs exercises", () => {
    expect(mainIdsFor(result.session, "legs")).toHaveLength(3);
  });

  it("removes the two most redundant exercises (highest weakest-link backup), keeping the uniquely-contributing one", () => {
    // squats/squat-pulse/squat-calf-raise/lunges are all quads-primary (or quads+glutes for
    // lunges), and quads has 4 backup exposures elsewhere regardless — so all four tie at a
    // redundancy score of 4, broken alphabetically: lunges, then squat-calf-raise.
    // sumo-squats (glutes+adductors) scores lowest (2) because its *weakest* primary muscle,
    // adductors, has only 2 backup exposures elsewhere — so it's correctly protected as the
    // session's only meaningful adductor stimulus, even though its OTHER primary muscle
    // (glutes) is abundantly backed up by Back's Deadlifts/Good Mornings. This is exactly why
    // the score is a minimum across an exercise's primary muscles, not an average — an average
    // would have let glutes' abundance mask adductors' scarcity and wrongly marked sumo-squats
    // as safe to remove.
    const decision = result.decisions.find((d) => d.programmeGroup === "legs")!;
    expect(decision.removedExerciseIds).toEqual(["lunges", "squat-calf-raise"]);
    expect(decision.retainedExerciseIds).toEqual(["squats", "squat-pulse", "sumo-squats"]);
  });

  it("leaves every other group untouched", () => {
    for (const group of ["back", "chest", "triceps", "shoulders", "biceps", "core"] as const) {
      expect(mainIdsFor(result.session, group)).toEqual(mainIdsFor(defaultSession, group));
    }
  });

  it("leaves the legs finisher untouched", () => {
    expect(result.session.mainExercises.some((pe) => pe.role === "finisher" && pe.exercise.id === "bodyweight-squat-pulses")).toBe(true);
  });

  it("every score carries a rationale explaining backup coverage", () => {
    const decision = result.decisions.find((d) => d.programmeGroup === "legs")!;
    for (const score of decision.scores) {
      expect(score.rationale.length).toBeGreaterThan(0);
    }
  });
});

describe("reduceExerciseCount — real programme, Core 3 -> 2", () => {
  const result = reduceExerciseCount(defaultSession, { core: 2 });

  it("retains exactly 2 core exercises", () => {
    expect(mainIdsFor(result.session, "core")).toHaveLength(2);
  });

  it("removes bicycle-crunches (abdominals fully backed up by Plank + Russian Twists)", () => {
    const decision = result.decisions.find((d) => d.programmeGroup === "core")!;
    expect(decision.removedExerciseIds).toEqual(["bicycle-crunches"]);
    expect(decision.retainedExerciseIds).toEqual(["plank", "russian-twists"]);
  });
});

describe("reduceExerciseCount — multiple groups in one call", () => {
  it("applies Legs 5->3 and Core 3->2 together, matching the single-group results", () => {
    const result = reduceExerciseCount(defaultSession, { legs: 3, core: 2 });
    expect(mainIdsFor(result.session, "legs")).toEqual(["squats", "squat-pulse", "sumo-squats"]);
    expect(mainIdsFor(result.session, "core")).toEqual(["plank", "russian-twists"]);
    expect(result.decisions).toHaveLength(2);
  });
});

describe("reduceExerciseCount — invalid requests are rejected up front", () => {
  it("throws if requesting more exercises than currently present", () => {
    expect(() => reduceExerciseCount(defaultSession, { legs: 10 })).toThrow(ReductionError);
  });

  it("throws if requesting fewer than 1 for a group", () => {
    expect(() => reduceExerciseCount(defaultSession, { core: 0 })).toThrow(ReductionError);
  });

  it("is a no-op for a group whose requested count equals its current count", () => {
    const result = reduceExerciseCount(defaultSession, { chest: 3 });
    expect(result.decisions).toHaveLength(0);
    expect(result.session).toEqual(defaultSession);
  });
});

// --- Synthetic fixtures for scenarios the real library can't cleanly demonstrate ---

function makeExercise(overrides: Partial<Exercise> & { id: string; primaryMuscles: Exercise["primaryMuscles"] }): Exercise {
  return {
    name: overrides.id,
    programmeGroup: "core",
    secondaryMuscles: [],
    movementPatterns: ["test"],
    exerciseType: "core",
    equipment: "bodyweight",
    location: "floor",
    active: true,
    prescribedReps: 10,
    repsUnit: "reps",
    ...overrides,
  };
}

function sessionOf(exercises: Exercise[]): WorkoutSession {
  return {
    warmup: { steps: [], targetDuration: { minMinutes: 5, maxMinutes: 6 } },
    mainExercises: exercises.map((exercise) => ({ exercise, role: "main" as const })),
    cooldown: { targetAreas: [], targetDuration: { minMinutes: 3, maxMinutes: 5 } },
    targetSessionDuration: { minMinutes: 45, maxMinutes: 50 },
  };
}

describe("reduceExerciseCount — redundant exercises removed before unique coverage (synthetic)", () => {
  const a = makeExercise({ id: "a-exercise", primaryMuscles: ["quads"] });
  const b = makeExercise({ id: "b-exercise", primaryMuscles: ["quads"] }); // redundant with A
  const c = makeExercise({ id: "c-exercise", primaryMuscles: ["obliques"] }); // uniquely covers obliques
  const session = sessionOf([a, b, c]);

  it("removes one of the redundant pair, never the uniquely-contributing exercise", () => {
    const result = reduceExerciseCount(session, { core: 2 });
    const retainedIds = result.decisions[0]!.retainedExerciseIds;
    expect(retainedIds).toContain("c-exercise");
    expect(retainedIds).toHaveLength(2);
    // exactly one of a/b was removed
    expect(result.decisions[0]!.removedExerciseIds).toHaveLength(1);
    expect(["a-exercise", "b-exercise"]).toContain(result.decisions[0]!.removedExerciseIds[0]);
  });
});

describe("reduceExerciseCount — impossible reductions are reported, not silently applied (synthetic)", () => {
  const x = makeExercise({ id: "x-exercise", primaryMuscles: ["quads"] }); // sole coverage of quads
  const y = makeExercise({ id: "y-exercise", primaryMuscles: ["obliques"] }); // sole coverage of obliques
  const session = sessionOf([x, y]);

  it("throws ReductionError with the specific coverage gap when no reduction is possible without a gap", () => {
    try {
      reduceExerciseCount(session, { core: 1 });
      expect.unreachable("expected reduceExerciseCount to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ReductionError);
      const reductionError = error as ReductionError;
      expect(reductionError.gaps.length).toBeGreaterThan(0);
      expect(reductionError.gaps.some((g) => g.muscle === "quads" || g.muscle === "obliques")).toBe(true);
    }
  });

  it("does not mutate the session when it throws", () => {
    expect(() => reduceExerciseCount(session, { core: 1 })).toThrow();
    expect(session.mainExercises).toHaveLength(2); // untouched
  });
});

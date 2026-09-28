import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { PROGRAMME_TEMPLATE } from "../src/data/programme-template.js";
import type { Exercise } from "../src/entities/exercise.js";
import { PROGRAMME_ORDER } from "../src/entities/programme.js";
import type { WorkoutSession } from "../src/entities/workout-session.js";
import { buildDefaultSession } from "../src/engine/workout-builder.js";
import { refreshWorkout } from "../src/engine/refresh-engine.js";

const defaultSession = buildDefaultSession(EXERCISES);

function findDecision(decisions: ReturnType<typeof refreshWorkout>["decisions"], previousExerciseId: string) {
  return decisions.find((d) => d.previousExerciseId === previousExerciseId);
}

describe("refreshWorkout — default 'I'm bored' mode against the real library", () => {
  const result = refreshWorkout(defaultSession, EXERCISES);

  it("attempts exactly one main exercise per programme group (7 decisions)", () => {
    expect(result.decisions).toHaveLength(7);
    expect(new Set(result.decisions.map((d) => d.programmeGroup)).size).toBe(7);
  });

  it("replaces the first main slot of each group with its sole eligible alternate where one exists", () => {
    // Each of these groups has exactly one library exercise not already used
    // elsewhere in the session, with adequate primary-muscle overlap with
    // the default first-slot exercise — so the outcome is fully determined
    // by FILTER alone, no scoring ambiguity.
    expect(findDecision(result.decisions, "squats")).toMatchObject({ replaced: true, selectedExerciseId: "bulgarian-split-squat" });
    expect(findDecision(result.decisions, "deadlifts")).toMatchObject({ replaced: true, selectedExerciseId: "rdl-upright-row" });
    expect(findDecision(result.decisions, "flat-bench-press")).toMatchObject({ replaced: true, selectedExerciseId: "flat-db-press" });
    expect(findDecision(result.decisions, "lying-tricep-extensions")).toMatchObject({
      replaced: true,
      selectedExerciseId: "close-grip-push-ups",
    });
    expect(findDecision(result.decisions, "overhead-press")).toMatchObject({ replaced: true, selectedExerciseId: "front-raises" });
    expect(findDecision(result.decisions, "barbell-curl")).toMatchObject({ replaced: true, selectedExerciseId: "concentration-curl" });
  });

  it("retains Plank — every other Core library exercise is already used elsewhere in the session", () => {
    const decision = findDecision(result.decisions, "plank");
    expect(decision).toMatchObject({ replaced: false, selectedExerciseId: "plank" });
    // Both other Core library exercises exist as candidates but are rejected — Core has no alternate library entries.
    expect(decision?.rejectedCandidates).toHaveLength(2);
    expect(decision?.rejectedCandidates.every((r) => r.reason.includes("already used elsewhere"))).toBe(true);
  });

  it("every replacement preserves at least one primary muscle from the exercise it replaced", () => {
    for (const decision of result.decisions.filter((d) => d.replaced)) {
      expect(decision.preservedPrimaryMuscles.length).toBeGreaterThan(0);
    }
  });

  it("incline DB Press is rejected as Flat Bench Press's replacement for insufficient primary overlap (chest vs upper_chest)", () => {
    const decision = findDecision(result.decisions, "flat-bench-press")!;
    const rejection = decision.rejectedCandidates.find((r) => r.exerciseId === "incline-db-press");
    expect(rejection?.reason).toMatch(/primary-muscle overlap/);
  });

  it("does not touch finisher-role exercises", () => {
    expect(findDecision(result.decisions, "bodyweight-squat-pulses")).toBeUndefined();
  });

  it("is deterministic: repeated calls with the same inputs produce the same decisions", () => {
    const again = refreshWorkout(defaultSession, EXERCISES);
    expect(again.decisions).toEqual(result.decisions);
    expect(again.session).toEqual(result.session);
  });

  it("the resulting session's exercise ids differ from the original template's where replaced", () => {
    const originalIds = new Set(defaultSession.mainExercises.map((pe) => pe.exercise.id));
    const newIds = result.session.mainExercises.map((pe) => pe.exercise.id);
    expect(newIds).toContain("bulgarian-split-squat");
    expect(originalIds.has("bulgarian-split-squat")).toBe(false);
  });
});

describe("refreshWorkout — hard exclusion is never selected", () => {
  it("excluding the sole eligible candidate leaves the original exercise retained", () => {
    const result = refreshWorkout(defaultSession, EXERCISES, { hard: { excludedExerciseIds: ["bulgarian-split-squat"] } });
    const decision = findDecision(result.decisions, "squats")!;
    expect(decision.replaced).toBe(false);
    expect(decision.selectedExerciseId).toBe("squats");
    expect(result.session.mainExercises.some((pe) => pe.exercise.id === "bulgarian-split-squat")).toBe(false);
  });

  it("never selects an excluded exercise even across the whole session", () => {
    const excluded = ["bulgarian-split-squat", "rdl-upright-row", "flat-db-press", "front-raises", "concentration-curl", "close-grip-push-ups"];
    const result = refreshWorkout(defaultSession, EXERCISES, { hard: { excludedExerciseIds: excluded } });
    for (const id of excluded) {
      expect(result.session.mainExercises.some((pe) => pe.exercise.id === id)).toBe(false);
    }
  });

  it("auto-detects a hard-constraint violation already present in the session, even outside the default one-per-group targets", () => {
    // "sumo-squats" is in the session but is not the default target for legs (squats is).
    const result = refreshWorkout(defaultSession, EXERCISES, { hard: { excludedExerciseIds: ["sumo-squats"] } });
    const decision = findDecision(result.decisions, "sumo-squats");
    expect(decision).toBeDefined();
    const stillPresent = result.session.mainExercises.some((pe) => pe.exercise.id === "sumo-squats");
    if (decision!.replaced) {
      // Fixed: excluded exercise is no longer in the session.
      expect(stillPresent).toBe(false);
    } else {
      // Could not be fixed (no eligible candidate) — retained, but the violation must be surfaced, never silent.
      expect(stillPresent).toBe(true);
      expect(decision!.violatesHardConstraints).toBe(true);
    }
  });
});

// --- Synthetic fixtures for isolating scoring behaviour (variety, preference weights) ---
// The real library mostly yields single-candidate scenarios (good for FILTER tests above);
// these small fixtures give >=2 eligible candidates so SCORE/SELECT logic is directly observable.

function makeExercise(overrides: Partial<Exercise> & { id: string }): Exercise {
  return {
    name: overrides.id,
    programmeGroup: "core",
    primaryMuscles: ["abdominals"],
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

const current = makeExercise({ id: "current-ex", location: "floor", equipment: "bodyweight" });
const candidateA = makeExercise({ id: "candidate-a", location: "bench_or_floor", equipment: "bodyweight" });
const candidateB = makeExercise({ id: "candidate-b", location: "bench_or_floor", equipment: "bodyweight" });
const fixtureLibrary = [current, candidateA, candidateB];

function fixtureSession(): WorkoutSession {
  return {
    warmup: { steps: [], targetDuration: { minMinutes: 5, maxMinutes: 6 } },
    mainExercises: [{ exercise: current, role: "main" }],
    cooldown: { targetAreas: [], targetDuration: { minMinutes: 3, maxMinutes: 5 } },
    targetSessionDuration: { minMinutes: 45, maxMinutes: 50 },
  };
}

describe("refreshWorkout — scoring with multiple eligible candidates (synthetic fixture)", () => {
  it("prefers the candidate not recently used over one that was", () => {
    const result = refreshWorkout(fixtureSession(), fixtureLibrary, {
      soft: { recentlyUsedExerciseIds: ["candidate-a"] },
    });
    const decision = findDecision(result.decisions, "current-ex")!;
    expect(decision.replaced).toBe(true);
    expect(decision.selectedExerciseId).toBe("candidate-b");
  });

  it("a hard exclusion cannot be overridden by a favourable soft preference for the excluded candidate", () => {
    const result = refreshWorkout(fixtureSession(), fixtureLibrary, {
      hard: { excludedExerciseIds: ["candidate-b"] },
      soft: { preferredLocation: "bench_or_floor", recentlyUsedExerciseIds: ["candidate-a"] }, // would otherwise favour A on location but penalise it on recency
    });
    const decision = findDecision(result.decisions, "current-ex")!;
    // candidate-b is hard-excluded regardless of it being the "fresher" pick — only candidate-a remains eligible.
    expect(decision.selectedExerciseId).toBe("candidate-a");
  });

  it("with no distinguishing preference, ties break deterministically by exercise id", () => {
    const result = refreshWorkout(fixtureSession(), fixtureLibrary);
    const decision = findDecision(result.decisions, "current-ex")!;
    expect(decision.selectedExerciseId).toBe("candidate-a"); // "candidate-a" < "candidate-b" alphabetically
  });
});

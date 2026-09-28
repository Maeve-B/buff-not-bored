import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { asCircuitWorkout, asClassicStrengthWorkout } from "../src/entities/workout.js";
import type { TrainingProgramme } from "../src/entities/training-programme.js";
import { buildWorkoutForScheduledWorkout, resolveTodaysWorkout } from "../src/engine/programme-resolver.js";

const programme: TrainingProgramme = {
  id: "p1",
  name: "Test Programme",
  totalWeeks: 1,
  startDateIso: "2026-09-28", // Monday
  weeks: [
    {
      weekNumber: 1,
      workouts: [
        { id: "w1-mon", dayOfWeek: 1, label: "Monday", workoutType: "classic_strength", name: "Full Body Strength" },
        { id: "w1-wed", dayOfWeek: 3, label: "Wednesday", workoutType: "circuit", name: "Full Body" },
      ],
    },
  ],
};

describe("resolveTodaysWorkout — programme -> week -> scheduled workout -> built Workout", () => {
  it("resolves and builds a Classic Strength workout on a scheduled strength day", () => {
    const workout = resolveTodaysWorkout(programme, "2026-09-28", EXERCISES);
    expect(workout?.workoutType).toBe("classic_strength");
    const strength = asClassicStrengthWorkout(workout!);
    expect(strength?.session.exercises.length).toBeGreaterThan(0);
  });

  it("resolves and builds a Circuit workout on a scheduled circuit day", () => {
    const workout = resolveTodaysWorkout(programme, "2026-09-30", EXERCISES); // Wednesday
    expect(workout?.workoutType).toBe("circuit");
    const circuit = asCircuitWorkout(workout!);
    expect(circuit?.session.mainExercises.length).toBeGreaterThan(0);
  });

  it("returns undefined on a rest day", () => {
    const workout = resolveTodaysWorkout(programme, "2026-09-29", EXERCISES); // Tuesday
    expect(workout).toBeUndefined();
  });

  it("stamps the resolved workout with programme context (programmeId, weekNumber, scheduledWorkoutId)", () => {
    const workout = resolveTodaysWorkout(programme, "2026-09-28", EXERCISES);
    expect(workout?.programmeContext).toEqual({ programmeId: "p1", weekNumber: 1, scheduledWorkoutId: "w1-mon" });
  });

  it("is deterministic: the same programme + date always resolves the same workout type and exercise selection", () => {
    const first = resolveTodaysWorkout(programme, "2026-09-28", EXERCISES);
    const second = resolveTodaysWorkout(programme, "2026-09-28", EXERCISES);
    expect(first?.workoutType).toBe(second?.workoutType);
    const firstStrength = asClassicStrengthWorkout(first!)!;
    const secondStrength = asClassicStrengthWorkout(second!)!;
    expect(firstStrength.session.exercises.map((se) => se.exercise.id)).toEqual(
      secondStrength.session.exercises.map((se) => se.exercise.id),
    );
  });

  it("sets status to not_started for a freshly resolved workout", () => {
    const workout = resolveTodaysWorkout(programme, "2026-09-28", EXERCISES);
    expect(workout?.status).toBe("not_started");
  });
});

describe("buildWorkoutForScheduledWorkout", () => {
  it("builds without programme context when none is given", () => {
    const scheduled = programme.weeks[0]!.workouts[0]!;
    const workout = buildWorkoutForScheduledWorkout(scheduled, EXERCISES, "2026-09-28");
    expect(workout.programmeContext).toBeUndefined();
  });
});

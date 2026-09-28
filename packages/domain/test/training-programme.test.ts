import { describe, expect, it } from "vitest";
import { isoWeekday, resolveCurrentWeekNumber, resolveTodaysScheduledWorkout, type TrainingProgramme } from "../src/entities/training-programme.js";

// Monday 2026-09-28 (verified: getUTCDay() === 1)
const programme: TrainingProgramme = {
  id: "p1",
  name: "Test Programme",
  totalWeeks: 2,
  startDateIso: "2026-09-28",
  weeks: [
    {
      weekNumber: 1,
      workouts: [
        { id: "w1-mon", dayOfWeek: 1, label: "Monday", workoutType: "classic_strength", name: "Full Body Strength" },
        { id: "w1-wed", dayOfWeek: 3, label: "Wednesday", workoutType: "classic_strength", name: "Full Body Strength" },
      ],
    },
    {
      weekNumber: 2,
      workouts: [{ id: "w2-mon", dayOfWeek: 1, label: "Monday", workoutType: "circuit", name: "Full Body" }],
    },
  ],
};

describe("isoWeekday", () => {
  it("returns 1 for Monday and 7 for Sunday", () => {
    expect(isoWeekday("2026-09-28")).toBe(1); // Monday
    expect(isoWeekday("2026-10-04")).toBe(7); // Sunday
  });
});

describe("resolveCurrentWeekNumber", () => {
  it("returns week 1 for the start date itself", () => {
    expect(resolveCurrentWeekNumber(programme, "2026-09-28")).toBe(1);
  });

  it("returns week 1 for any day within the first 7 days", () => {
    expect(resolveCurrentWeekNumber(programme, "2026-10-03")).toBe(1); // Saturday of week 1
  });

  it("returns week 2 once 7 days have elapsed", () => {
    expect(resolveCurrentWeekNumber(programme, "2026-10-05")).toBe(2); // Monday of week 2
  });

  it("returns a week number below 1 for dates before the start", () => {
    expect(resolveCurrentWeekNumber(programme, "2026-09-21")).toBe(0);
  });
});

describe("resolveTodaysScheduledWorkout", () => {
  it("resolves Monday of week 1 to the scheduled Monday workout", () => {
    const scheduled = resolveTodaysScheduledWorkout(programme, "2026-09-28");
    expect(scheduled?.id).toBe("w1-mon");
  });

  it("resolves Wednesday of week 1 to the scheduled Wednesday workout", () => {
    const scheduled = resolveTodaysScheduledWorkout(programme, "2026-09-30");
    expect(scheduled?.id).toBe("w1-wed");
  });

  it("returns undefined for a rest day (Tuesday, nothing scheduled)", () => {
    const scheduled = resolveTodaysScheduledWorkout(programme, "2026-09-29");
    expect(scheduled).toBeUndefined();
  });

  it("resolves into week 2's different schedule once week 2 begins", () => {
    const scheduled = resolveTodaysScheduledWorkout(programme, "2026-10-05");
    expect(scheduled?.id).toBe("w2-mon");
    expect(scheduled?.workoutType).toBe("circuit");
  });

  it("returns undefined once the programme's totalWeeks have elapsed", () => {
    const scheduled = resolveTodaysScheduledWorkout(programme, "2026-10-19"); // week 4, programme only has 2
    expect(scheduled).toBeUndefined();
  });

  it("returns undefined before the programme starts", () => {
    const scheduled = resolveTodaysScheduledWorkout(programme, "2026-09-21");
    expect(scheduled).toBeUndefined();
  });
});

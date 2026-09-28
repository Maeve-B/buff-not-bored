import { describe, expect, it } from "vitest";
import { EIGHT_WEEK_STRENGTH_PROGRAMME, TRAINING_PROGRAMMES } from "../src/data/training-programme.js";
import { trainingProgrammeSchema, TrainingProgrammeValidationError, validateTrainingProgramme } from "../src/validation/training-programme.schema.js";

describe("training programme validation", () => {
  it("the seeded '8 Week Strength' programme passes validation", () => {
    expect(() => validateTrainingProgramme(EIGHT_WEEK_STRENGTH_PROGRAMME)).not.toThrow();
  });

  it("has 8 weeks, each with the two scheduled workouts from the brief's example", () => {
    expect(EIGHT_WEEK_STRENGTH_PROGRAMME.weeks).toHaveLength(8);
    for (const week of EIGHT_WEEK_STRENGTH_PROGRAMME.weeks) {
      expect(week.workouts.map((w) => w.label)).toEqual(["Monday", "Wednesday"]);
    }
  });

  it("TRAINING_PROGRAMMES includes the seeded programme", () => {
    expect(TRAINING_PROGRAMMES).toContain(EIGHT_WEEK_STRENGTH_PROGRAMME);
  });

  it("rejects a programme whose week count exceeds totalWeeks", () => {
    const result = trainingProgrammeSchema.safeParse({
      ...EIGHT_WEEK_STRENGTH_PROGRAMME,
      totalWeeks: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a scheduled workout with an invalid workoutType", () => {
    const invalid = {
      ...EIGHT_WEEK_STRENGTH_PROGRAMME,
      weeks: [{ weekNumber: 1, workouts: [{ id: "x", dayOfWeek: 1, label: "Monday", workoutType: "yoga", name: "Yoga" }] }],
    };
    expect(() => validateTrainingProgramme(invalid)).toThrow(TrainingProgrammeValidationError);
  });

  it("rejects a duplicate weekNumber", () => {
    const invalid = {
      ...EIGHT_WEEK_STRENGTH_PROGRAMME,
      weeks: [EIGHT_WEEK_STRENGTH_PROGRAMME.weeks[0]!, EIGHT_WEEK_STRENGTH_PROGRAMME.weeks[0]!],
    };
    expect(() => validateTrainingProgramme(invalid)).toThrow(TrainingProgrammeValidationError);
  });
});

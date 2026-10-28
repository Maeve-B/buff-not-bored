import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import { checkNeedsProfile, deriveTrainingStatus, validateNeedsProfile, NeedsProfileValidationError, type NeedsProfile } from "../src/entities/needs-profile.js";

const LIBRARY = new Set(EXERCISES.map((e) => e.id));

/** Roughly Maeve's answers. */
const maeve: NeedsProfile = {
  goal: "strength",
  emphasis: "pull_up",
  trainingDuration: "over_a_year",
  trainingKind: "free_weights",
  techniqueConfidence: "confident",
  daysPerWeek: 3,
  preferredDays: [1, 3, 5],
  sessionMinutes: 60,
  equipment: ["barbell", "rack", "dumbbells", "bench", "cable", "machine"],
  heaviestDumbbellKg: 20,
  limitations: [],
  avoidExerciseIds: [],
  favouriteExerciseIds: ["squats"],
  source: "form",
};

describe("deriveTrainingStatus (§6.1, NSCA training age — D-017)", () => {
  it("follows training age", () => {
    expect(deriveTrainingStatus({ ...maeve, trainingDuration: "under_2_months" })).toBe("beginner");
    expect(deriveTrainingStatus({ ...maeve, trainingDuration: "2_to_12_months" })).toBe("intermediate");
    expect(deriveTrainingStatus(maeve)).toBe("advanced");
  });

  it("steps down one level for low technique confidence, or training that wasn't free weights", () => {
    expect(deriveTrainingStatus({ ...maeve, techniqueConfidence: "low" })).toBe("intermediate");
    expect(deriveTrainingStatus({ ...maeve, trainingKind: "machines_or_classes" })).toBe("intermediate");
    expect(deriveTrainingStatus({ ...maeve, trainingDuration: "2_to_12_months", techniqueConfidence: "low" })).toBe("beginner");
    expect(deriveTrainingStatus({ ...maeve, trainingDuration: "under_2_months", techniqueConfidence: "low" })).toBe("beginner");
  });

  it("never steps down twice", () => {
    expect(deriveTrainingStatus({ ...maeve, techniqueConfidence: "low", trainingKind: "other_sport" })).toBe("intermediate");
  });
});

describe("checkNeedsProfile (plain-language problems for the form)", () => {
  it("accepts a complete profile", () => {
    expect(checkNeedsProfile(maeve, LIBRARY)).toEqual([]);
    expect(() => validateNeedsProfile(maeve, LIBRARY)).not.toThrow();
  });

  it("asks for 2–4 days a week, and preferred days that match", () => {
    expect(checkNeedsProfile({ ...maeve, daysPerWeek: 5, preferredDays: [] }, LIBRARY)).toEqual([
      { field: "daysPerWeek", message: "Choose 2 to 4 days a week." },
    ]);
    expect(checkNeedsProfile({ ...maeve, preferredDays: [1, 3] }, LIBRARY)).toEqual([
      { field: "preferredDays", message: "Pick 3 preferred days to match your days a week, or none." },
    ]);
    expect(checkNeedsProfile({ ...maeve, preferredDays: [] }, LIBRARY)).toEqual([]);
    expect(checkNeedsProfile({ ...maeve, preferredDays: [1, 1, 3] }, LIBRARY)[0]?.field).toBe("preferredDays");
  });

  it("checks session length and equipment", () => {
    expect(checkNeedsProfile({ ...maeve, sessionMinutes: 10 }, LIBRARY)[0]?.field).toBe("sessionMinutes");
    expect(checkNeedsProfile({ ...maeve, equipment: [], heaviestDumbbellKg: undefined }, LIBRARY).map((i) => i.field)).toEqual(["equipment"]);
    expect(checkNeedsProfile({ ...maeve, equipment: ["bodyweight", "pull_up_bar"], heaviestDumbbellKg: undefined }, LIBRARY)).toEqual([]);
    expect(checkNeedsProfile({ ...maeve, equipment: ["barbell"] }, LIBRARY)[0]?.field).toBe("heaviestDumbbellKg");
  });

  it("only names real exercises, and never the same one as both favourite and avoid", () => {
    expect(checkNeedsProfile({ ...maeve, avoidExerciseIds: ["burpees"] }, LIBRARY)[0]?.message).toMatch(/aren't in the library/);
    expect(checkNeedsProfile({ ...maeve, avoidExerciseIds: ["squats"] }, LIBRARY)[0]?.field).toBe("favouriteExerciseIds");
  });

  it("puts a problem with an exercise on the list it's in", () => {
    expect(checkNeedsProfile({ ...maeve, favouriteExerciseIds: ["burpees"] }, LIBRARY)).toEqual([
      { field: "favouriteExerciseIds", message: "Some exercises aren't in the library." },
    ]);
  });

  it("guards against answers arriving in the wrong shape (from outside the form)", () => {
    const broken = { ...maeve, equipment: undefined, source: "anything" } as unknown as NeedsProfile;
    expect(checkNeedsProfile(broken, LIBRARY)).toEqual([{ field: "equipment", message: "This answer is missing." }]);
    expect(checkNeedsProfile({ ...maeve, source: "anything" as never }, LIBRARY)[0]?.field).toBe("source");
    expect(checkNeedsProfile({ ...maeve, likesDislikes: "x".repeat(501) }, LIBRARY)[0]?.field).toBe("likesDislikes");
  });

  it("collects every problem at once", () => {
    const broken = { ...maeve, daysPerWeek: 7, sessionMinutes: 5, equipment: [] as NeedsProfile["equipment"], heaviestDumbbellKg: undefined };
    try {
      validateNeedsProfile(broken, LIBRARY);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(NeedsProfileValidationError);
      expect((error as NeedsProfileValidationError).issues.map((i) => i.field)).toEqual(["daysPerWeek", "preferredDays", "sessionMinutes", "equipment"]);
    }
  });
});

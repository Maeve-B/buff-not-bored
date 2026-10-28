import { describe, expect, it } from "vitest";
import { EXERCISES } from "../src/data/exercises.js";
import {
  afterAnswer,
  applicableSteps,
  resumePoint,
  sanitiseAnswers,
  checkStepAnswer,
  experienceFrom,
  nextStepId,
  previousStepId,
  profileFromAnswers,
  questionProgress,
  skipStep,
  stepForField,
  type NeedsAnswers,
} from "../src/entities/needs-conversation.js";

const LIBRARY = new Set(EXERCISES.map((e) => e.id));

const answered: NeedsAnswers = {
  goal: "strength",
  emphasis: "pull_up",
  trainingDuration: "over_a_year",
  trainingKind: "free_weights",
  techniqueConfidence: "confident",
  daysPerWeek: 3,
  preferredDays: [1, 3, 5],
  sessionMinutes: 60,
  equipment: ["barbell", "rack", "dumbbells", "bench"],
  heaviestDumbbellKg: 20,
  limitations: [],
  avoidExerciseIds: [],
  favouriteExerciseIds: [],
};

describe("the setup conversation (S-015, one question at a time)", () => {
  it("asks the needs questions in order, then shows a summary", () => {
    expect(applicableSteps({}).map((s) => s.id)).toEqual([
      "goal",
      "emphasis",
      "trainingDuration",
      "trainingKind",
      "techniqueConfidence",
      "experience",
      "daysPerWeek",
      "preferredDays",
      "sessionMinutes",
      "equipment",
      "limitations",
      "avoid",
      "favourites",
      "likesDislikes",
      "summary",
    ]);
  });

  it("only asks about your heaviest dumbbell if you have dumbbells, and for a note if you have a limitation", () => {
    const ids = applicableSteps({ equipment: ["dumbbells"], limitations: ["knee"] }).map((s) => s.id);
    expect(ids).toContain("heaviestDumbbell");
    expect(ids).toContain("limitationNote");
    expect(nextStepId("equipment", { equipment: ["barbell"] })).toBe("limitations");
    expect(nextStepId("equipment", { equipment: ["dumbbells"] })).toBe("heaviestDumbbell");
  });

  it("goes back one question, and never past the first", () => {
    expect(previousStepId("emphasis", {})).toBe("goal");
    expect(previousStepId("goal", {})).toBe("goal");
    expect(nextStepId("summary", answered)).toBe("summary");
  });

  it("counts real questions for progress, not the experience result or summary", () => {
    expect(questionProgress("goal", {})).toEqual({ number: 1, of: 13 });
    expect(questionProgress("daysPerWeek", {})).toEqual({ number: 6, of: 13 });
    expect(questionProgress("experience", {})).toBeUndefined();
    expect(questionProgress("heaviestDumbbell", { equipment: ["dumbbells"] })).toEqual({ number: 10, of: 14 });
  });

  it("tells you your experience level after the three experience questions", () => {
    expect(experienceFrom({ trainingDuration: "over_a_year" })).toBeUndefined();
    expect(experienceFrom(answered)).toBe("advanced");
  });

  it("checks each answer on its own, with the profile's plain-language rules", () => {
    expect(checkStepAnswer("goal", {}, LIBRARY)).toEqual([{ field: "goal", message: "Choose an answer to carry on." }]);
    expect(checkStepAnswer("goal", { goal: "strength" }, LIBRARY)).toEqual([]);
    expect(checkStepAnswer("preferredDays", { daysPerWeek: 3, preferredDays: [1, 3] }, LIBRARY)).toEqual([
      { field: "preferredDays", message: "Pick 3 preferred days to match your days a week, or none." },
    ]);
    expect(checkStepAnswer("equipment", { equipment: [] }, LIBRARY)[0]?.message).toMatch(/Tick the equipment/);
    expect(checkStepAnswer("experience", {}, LIBRARY)).toEqual([]);
  });

  it("lets you skip optional questions only", () => {
    expect(skipStep("preferredDays", { daysPerWeek: 3, preferredDays: [1] })).toMatchObject({ preferredDays: [] });
    expect(skipStep("limitations", {})).toMatchObject({ limitations: [] });
    expect(() => skipStep("goal", {})).toThrow(/can't be skipped/);
  });

  it("builds the finished profile, or says which questions still need an answer", () => {
    expect(profileFromAnswers(answered, LIBRARY)).toEqual({ profile: { ...answered, limitationNote: undefined, source: "form" }, issues: [] });
    const result = profileFromAnswers({ goal: "strength" }, LIBRARY);
    expect(result.profile).toBeUndefined();
    expect(result.issues.map((i) => i.field)).toEqual([
      "trainingDuration",
      "trainingKind",
      "techniqueConfidence",
      "daysPerWeek",
      "sessionMinutes",
      "equipment",
    ]);
  });

  it("drops a dumbbell weight once dumbbells are unticked, and a note once limitations are cleared", () => {
    const changed = { ...answered, equipment: ["barbell" as const], limitations: [], limitationNote: "old" };
    expect(profileFromAnswers(changed, LIBRARY).profile).toMatchObject({ heaviestDumbbellKg: undefined, limitationNote: undefined });
  });

  it("points a problem back to its question", () => {
    expect(stepForField("heaviestDumbbellKg")).toBe("heaviestDumbbell");
    expect(stepForField("avoidExerciseIds")).toBe("avoid");
  });
});

describe("after the summary, and coming back (S-015 review fixes)", () => {
  const all = [...applicableSteps(answered).map((s) => s.id)];

  it("returns to the summary after a change, unless the change makes a new question apply", () => {
    const before = { ...answered, equipment: ["barbell" as const] };
    expect(afterAnswer("goal", answered, { ...answered, goal: "hypertrophy" }, all)).toBe("summary");
    expect(afterAnswer("equipment", before, { ...before, equipment: ["barbell", "dumbbells"] }, all)).toBe("heaviestDumbbell");
    expect(afterAnswer("limitations", answered, { ...answered, limitations: ["knee"] }, all)).toBe("limitationNote");
    expect(afterAnswer("goal", {}, { goal: "strength" }, [])).toBe("emphasis");
  });

  it("says where you stopped, without calling an early pause 'nearly done'", () => {
    expect(resumePoint("goal", {})).toEqual({ number: 1, of: 13 });
    expect(resumePoint("experience", {})).toEqual({ number: 6, of: 13 });
    expect(resumePoint("summary", answered)).toBe("nearly_done");
  });

  it("keeps only answers of the right kind when a saved conversation is read back", () => {
    expect(sanitiseAnswers({ goal: "strength", equipment: "dumbbells", daysPerWeek: "3", preferredDays: [1, 9], nonsense: true })).toEqual({
      goal: "strength",
    });
    expect(sanitiseAnswers(null)).toEqual({});
    expect(sanitiseAnswers(answered)).toEqual(answered);
  });
});

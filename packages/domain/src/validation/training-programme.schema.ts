/**
 * Structural validation for TrainingProgramme data — the same rationale as
 * validation/exercise.schema.ts: this is seed data today, but the shape is
 * exactly what would arrive from a future editor/API, so it's validated at
 * that boundary now rather than trusted implicitly.
 */

import { z } from "zod";
import { WORKOUT_TYPES } from "../entities/workout-type.js";

export const scheduledWorkoutSchema = z.object({
  id: z.string().min(1),
  dayOfWeek: z.number().int().min(1).max(7),
  label: z.string().min(1),
  workoutType: z.enum(WORKOUT_TYPES),
  name: z.string().min(1),
});

export const trainingProgrammeWeekSchema = z.object({
  weekNumber: z.number().int().min(1),
  workouts: z.array(scheduledWorkoutSchema),
});

export const trainingProgrammeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    goal: z.string().optional(),
    totalWeeks: z.number().int().min(1),
    startDateIso: z.string().min(1),
    weeks: z.array(trainingProgrammeWeekSchema),
  })
  .superRefine((programme, ctx) => {
    if (programme.weeks.length > programme.totalWeeks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `programme declares totalWeeks=${programme.totalWeeks} but has ${programme.weeks.length} week(s) of data`,
      });
    }
    const weekNumbers = new Set<number>();
    for (const week of programme.weeks) {
      if (weekNumbers.has(week.weekNumber)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate weekNumber ${week.weekNumber}` });
      }
      weekNumbers.add(week.weekNumber);
      if (week.weekNumber > programme.totalWeeks) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `week ${week.weekNumber} exceeds totalWeeks=${programme.totalWeeks}`,
        });
      }
    }
  });

export class TrainingProgrammeValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`TrainingProgramme failed validation:\n${issues.join("\n")}`);
    this.name = "TrainingProgrammeValidationError";
  }
}

export function validateTrainingProgramme(programme: unknown): void {
  const result = trainingProgrammeSchema.safeParse(programme);
  if (!result.success) {
    throw new TrainingProgrammeValidationError(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  }
}

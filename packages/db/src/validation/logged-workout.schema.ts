/**
 * Structural validation for `LoggedWorkoutInput`, the shape repositories
 * accept when persisting a workout. Same convention as
 * packages/domain/src/validation/exercise.schema.ts: Zod schemas built
 * directly from the domain package's own closed vocabularies, so a new
 * workout type/status/role automatically becomes valid here the moment it's
 * added to the domain, with no separate list to keep in sync.
 */

import { z } from "zod";
import { REPS_UNITS, SLOT_ROLES, WEIGHT_ADJUSTMENT_TYPES, WORKOUT_STATUSES, WORKOUT_TYPES } from "@buff-not-bored/domain";
import type { LoggedWorkoutInput } from "../types.js";

const weightAdjustmentSchema = z.object({
  type: z.enum(WEIGHT_ADJUSTMENT_TYPES),
  percent: z.number(),
  reason: z.string().optional(),
});

const loggedSetSchema = z
  .object({
    setNumber: z.number().int().positive(),
    targetReps: z.number().int().positive().optional(),
    repsUnit: z.enum(REPS_UNITS).optional(),
    targetDuration: z.number().positive().optional(),
    targetWeight: z.number().positive().optional(),
    actualWeight: z.number().positive().optional(),
    actualReps: z.number().int().nonnegative().optional(),
    actualDuration: z.number().nonnegative().optional(),
    completed: z.boolean(),
    loggedAt: z.string().datetime().optional(),
  })
  .superRefine((set, ctx) => {
    if (set.repsUnit !== undefined && set.targetReps === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "repsUnit is only valid when targetReps is set" });
    }
  });

const loggedWorkoutExerciseSchema = z
  .object({
    exerciseId: z.string().min(1),
    role: z.enum(SLOT_ROLES),
    restSeconds: z.number().int().positive().optional(),
    baseWeight: z.number().positive().optional(),
    adjustments: z.array(weightAdjustmentSchema).optional(),
    finalWeight: z.number().positive().optional(),
    sets: z.array(loggedSetSchema).min(1, "an exercise performed in a session must have at least one set"),
  })
  .superRefine((exercise, ctx) => {
    // finalWeight only makes sense once a baseWeight exists to derive it from.
    if (exercise.finalWeight !== undefined && exercise.baseWeight === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "finalWeight requires baseWeight to be set" });
    }
    const setNumbers = exercise.sets.map((set) => set.setNumber);
    if (new Set(setNumbers).size !== setNumbers.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "setNumber must be unique within an exercise" });
    }
  });

export const loggedWorkoutSchema = z.object({
  workoutType: z.enum(WORKOUT_TYPES),
  name: z.string().min(1),
  status: z.enum(WORKOUT_STATUSES),
  dateIso: z.string().min(1),
  programmeId: z.string().min(1).optional(),
  weekNumber: z.number().int().positive().optional(),
  scheduledWorkoutId: z.string().min(1).optional(),
  exercises: z.array(loggedWorkoutExerciseSchema).min(1, "a workout must contain at least one exercise"),
}) satisfies z.ZodType<LoggedWorkoutInput>;

export class LoggedWorkoutValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Workout failed validation:\n${issues.join("\n")}`);
    this.name = "LoggedWorkoutValidationError";
  }
}

/** Throws `LoggedWorkoutValidationError` (all issues collected) if `input` doesn't match `loggedWorkoutSchema`. */
export function validateLoggedWorkout(input: LoggedWorkoutInput): void {
  const result = loggedWorkoutSchema.safeParse(input);
  if (!result.success) {
    throw new LoggedWorkoutValidationError(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  }
}

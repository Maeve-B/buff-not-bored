/**
 * Structural validation for `ExerciseCapability` — specifically its WRITE
 * shape (`updatedAt` excluded: that field is database-managed, never
 * caller-supplied; see entities/exercise-capability.ts and
 * repositories/exercise-capability-repository.ts). Same convention as
 * validation/exercise.schema.ts: a Zod schema built directly from the
 * domain package's own closed vocabularies.
 */

import { z } from "zod";
import { REPS_UNITS, WEIGHT_UNITS } from "../entities/exercise.js";
import { CAPABILITY_SOURCES, type ExerciseCapability } from "../entities/exercise-capability.js";

export type ExerciseCapabilityInput = Omit<ExerciseCapability, "updatedAt">;

export const exerciseCapabilitySchema = z
  .object({
    exerciseId: z.string().min(1),
    weight: z.number().positive().optional(),
    weightUnit: z.enum(WEIGHT_UNITS).optional(),
    reps: z.number().int().positive().optional(),
    repsUnit: z.enum(REPS_UNITS).optional(),
    duration: z.number().positive().optional(),
    source: z.enum(CAPABILITY_SOURCES),
    note: z.string().optional(),
  })
  .superRefine((capability, ctx) => {
    // weight and weightUnit must be set together, if at all.
    if ((capability.weight === undefined) !== (capability.weightUnit === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "weight and weightUnit must both be present or both be absent",
      });
    }
    // repsUnit only makes sense alongside reps.
    if (capability.repsUnit !== undefined && capability.reps === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "repsUnit is only valid when reps is set",
      });
    }
    // An empty capability (nothing recorded at all) isn't meaningful.
    if (capability.weight === undefined && capability.reps === undefined && capability.duration === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "a capability must specify at least one of weight, reps, or duration",
      });
    }
  }) satisfies z.ZodType<ExerciseCapabilityInput>;

export class CapabilityValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Exercise capability failed validation:\n${issues.join("\n")}`);
    this.name = "CapabilityValidationError";
  }
}

/** Throws `CapabilityValidationError` (all issues collected) if `capability` doesn't match `exerciseCapabilitySchema`. */
export function validateExerciseCapability(capability: ExerciseCapabilityInput): void {
  const result = exerciseCapabilitySchema.safeParse(capability);
  if (!result.success) {
    throw new CapabilityValidationError(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  }
}

/**
 * Structural validation for the exercise catalog (spec §5 requires exercises
 * to "be represented as structured data" — this is the corresponding runtime
 * check, on top of TypeScript's compile-time checking).
 */

import { z } from "zod";
import {
  EQUIPMENT_TYPES,
  EXERCISE_TYPES,
  LOCATIONS,
  MUSCLES,
  PROGRAMME_GROUPS,
  REPS_UNITS,
  WEIGHT_UNITS,
  type Exercise,
} from "../entities/exercise.js";

export const exerciseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    programmeGroup: z.enum(PROGRAMME_GROUPS),
    primaryMuscles: z.array(z.enum(MUSCLES)).min(1, "an exercise must train at least one primary muscle"),
    secondaryMuscles: z.array(z.enum(MUSCLES)),
    movementPatterns: z.array(z.string().min(1)).min(1),
    exerciseType: z.enum(EXERCISE_TYPES),
    equipment: z.enum(EQUIPMENT_TYPES),
    location: z.enum(LOCATIONS),
    startingWeight: z.number().positive().optional(),
    weightUnit: z.enum(WEIGHT_UNITS).optional(),
    prescribedReps: z.number().int().positive().optional(),
    repsUnit: z.enum(REPS_UNITS).optional(),
    prescribedDuration: z.number().positive().optional(),
    progressionPercentage: z.number().min(0).max(100).optional(),
    active: z.boolean(),
    notes: z.string().optional(),
  })
  .superRefine((exercise, ctx) => {
    // Every exercise is either rep-prescribed or duration-prescribed (never neither).
    if (exercise.prescribedReps === undefined && exercise.prescribedDuration === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "exercise must specify either prescribedReps or prescribedDuration",
      });
    }
    if (exercise.prescribedReps !== undefined && exercise.prescribedDuration !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "exercise cannot specify both prescribedReps and prescribedDuration",
      });
    }
    // startingWeight and weightUnit must be set together, if at all.
    if ((exercise.startingWeight === undefined) !== (exercise.weightUnit === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startingWeight and weightUnit must both be present or both be absent",
      });
    }
    // repsUnit only makes sense alongside prescribedReps.
    if (exercise.repsUnit !== undefined && exercise.prescribedReps === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "repsUnit is only valid when prescribedReps is set",
      });
    }
  }) satisfies z.ZodType<Exercise>;

export class CatalogValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Exercise catalog failed validation:\n${issues.join("\n")}`);
    this.name = "CatalogValidationError";
  }
}

/**
 * Validates every exercise in a catalog against `exerciseSchema` and checks
 * catalog-level invariants (unique ids). Throws `CatalogValidationError`
 * (with all issues collected, not just the first) if anything fails.
 */
export function validateCatalog(catalog: Exercise[]): void {
  const issues: string[] = [];
  const seenIds = new Set<string>();

  for (const exercise of catalog) {
    const result = exerciseSchema.safeParse(exercise);
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push(`[${exercise.id ?? "<unknown id>"}] ${issue.path.join(".")}: ${issue.message}`);
      }
    }
    if (seenIds.has(exercise.id)) {
      issues.push(`duplicate exercise id: "${exercise.id}"`);
    }
    seenIds.add(exercise.id);
  }

  if (issues.length > 0) {
    throw new CatalogValidationError(issues);
  }
}

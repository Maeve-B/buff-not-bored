/**
 * Structural validation for the exercise catalog (spec §5 requires exercises
 * to "be represented as structured data" — this is the corresponding runtime
 * check, on top of TypeScript's compile-time checking).
 */

import { z } from "zod";
import {
  EQUIPMENT_TYPES,
  EXERCISE_CLASSES,
  EXERCISE_TYPES,
  GYM_EQUIPMENT,
  JOINT_STRESS_TAGS,
  LOAD_DIRECTIONS,
  LOAD_TYPES,
  LOCATIONS,
  MUSCLES,
  PRIMARY_PATTERNS,
  PROGRAMME_GROUPS,
  PROGRESSION_STRATEGIES,
  REPS_UNITS,
  SKILL_LEVELS,
  STATIONS,
  WEIGHT_STEP_KG,
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
    prescribedReps: z.number().int().positive().optional(),
    repsUnit: z.enum(REPS_UNITS).optional(),
    prescribedDuration: z.number().positive().optional(),
    progressionPercentage: z.number().min(0).max(100).optional(),
    active: z.boolean(),
    notes: z.string().optional(),
    needsReview: z.boolean().optional(),

    // Library v2 profile (§9.1)
    movementPattern: z.enum(PRIMARY_PATTERNS),
    exerciseClass: z.enum(EXERCISE_CLASSES),
    skillLevel: z.enum(SKILL_LEVELS),
    loadType: z.enum(LOAD_TYPES),
    equipmentNeeded: z.array(z.enum(GYM_EQUIPMENT)).min(1),
    station: z.enum(STATIONS),
    unilateral: z.boolean(),
    perSide: z.boolean(),
    incrementOptions: z.array(z.number().positive()),
    loadDirection: z.enum(LOAD_DIRECTIONS),
    progressionStrategyDefault: z.enum(PROGRESSION_STRATEGIES),
    lightAlternativeIds: z.array(z.string().min(1)),
    swapGroup: z.string().min(1).optional(),
    regressionId: z.string().min(1).optional(),
    progressionId: z.string().min(1).optional(),
    jointStressTags: z.array(z.enum(JOINT_STRESS_TAGS)),
    cues: z.object({
      setup: z.string().min(1),
      form: z.array(z.string().min(1)).min(1).max(2),
    }),
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
    // repsUnit only makes sense alongside prescribedReps.
    if (exercise.repsUnit !== undefined && exercise.prescribedReps === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "repsUnit is only valid when prescribedReps is set",
      });
    }
    if (exercise.perSide && !exercise.unilateral) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "perSide is only valid for a unilateral exercise" });
    }
    // perSide must agree with the v1 repsUnit, so logging and the v2 engines read reps the same way.
    if (exercise.repsUnit !== undefined && exercise.perSide !== (exercise.repsUnit === "per_side")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'perSide must be true exactly when repsUnit is "per_side"' });
    }
    // An assisted machine's logged value is assistance, so progress means less of it (§9.1).
    if (exercise.loadType === "assisted_machine" && exercise.loadDirection !== "reduce_assistance") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "an assisted_machine exercise must use reduce_assistance" });
    }
    // Loaded exercises need real jumps to offer in a nudge (§7.4); unloaded bodyweight has none.
    const unloaded = exercise.loadType === "bodyweight";
    if (unloaded && exercise.incrementOptions.length > 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "an unloaded bodyweight exercise cannot have incrementOptions" });
    }
    if (!unloaded && exercise.incrementOptions.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a loaded exercise needs at least one incrementOption" });
    }
    if (exercise.incrementOptions.some((value) => !Number.isInteger(value / WEIGHT_STEP_KG))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `incrementOptions must be multiples of ${WEIGHT_STEP_KG} kg` });
    }
    if (exercise.incrementOptions.some((value, i, all) => i > 0 && value <= all[i - 1]!)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "incrementOptions must be in ascending order without repeats" });
    }
    // §3.3: percentage progression is for circuits only, never a strength default.
    if (exercise.progressionStrategyDefault === "percentage") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "percentage progression is circuit-only and cannot be an exercise's default strategy",
      });
    }
  }) satisfies z.ZodType<Exercise>;

/**
 * Catalog-level §9.1 checks: every referenced id exists, and light
 * alternatives (§6.6) and swap-group members (equivalent stimulus) share
 * the exercise's movement pattern.
 */
function checkLibraryReferences(catalog: Exercise[]): string[] {
  const issues: string[] = [];
  const byId = new Map(catalog.map((exercise) => [exercise.id, exercise]));

  for (const exercise of catalog) {
    for (const altId of exercise.lightAlternativeIds) {
      const alt = byId.get(altId);
      if (altId === exercise.id) {
        issues.push(`[${exercise.id}] lightAlternativeIds: cannot list itself`);
      } else if (!alt) {
        issues.push(`[${exercise.id}] lightAlternativeIds: unknown exercise "${altId}"`);
      } else if (alt.movementPattern !== exercise.movementPattern) {
        issues.push(
          `[${exercise.id}] lightAlternativeIds: "${altId}" is ${alt.movementPattern}, not ${exercise.movementPattern}`,
        );
      }
    }
    for (const field of ["regressionId", "progressionId"] as const) {
      const ref = exercise[field];
      if (ref === exercise.id) {
        issues.push(`[${exercise.id}] ${field}: cannot point to itself`);
      } else if (ref !== undefined && !byId.has(ref)) {
        issues.push(`[${exercise.id}] ${field}: unknown exercise "${ref}"`);
      }
    }
  }

  const patternsBySwapGroup = new Map<string, Set<string>>();
  for (const exercise of catalog) {
    if (exercise.swapGroup === undefined) continue;
    const patterns = patternsBySwapGroup.get(exercise.swapGroup) ?? new Set<string>();
    patterns.add(exercise.movementPattern);
    patternsBySwapGroup.set(exercise.swapGroup, patterns);
  }
  for (const [group, patterns] of patternsBySwapGroup) {
    if (patterns.size > 1) {
      issues.push(`swap group "${group}" mixes movement patterns: ${[...patterns].join(", ")}`);
    }
  }

  return issues;
}

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

  issues.push(...checkLibraryReferences(catalog));

  if (issues.length > 0) {
    throw new CatalogValidationError(issues);
  }
}

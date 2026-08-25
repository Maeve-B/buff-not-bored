/**
 * The workout builder: assembles a `WorkoutSession` from the exercise
 * library and an explicit `ProgrammeTemplate`. This is the one deterministic
 * business rule Phase 1 needs — spec §9 ("Default Workout") is explicit that
 * V1 should follow the fixed warm-up -> Legs -> Back -> Chest -> Triceps ->
 * Shoulders -> Biceps -> Core -> cool-down structure with no reordering/
 * optimisation.
 *
 * Per the PROGRAMME MODEL CORRECTION, the template is never derived from the
 * library's array order — it's authored data (data/programme-template.ts),
 * passed in explicitly.
 *
 * Pure function: no I/O, no randomness, no framework dependency. Given the
 * same library + template, it always produces the same session.
 */

import { COOLDOWN_PLAN } from "../data/cooldown.js";
import { PROGRAMME_TEMPLATE } from "../data/programme-template.js";
import { WARMUP_PLAN } from "../data/warmup.js";
import { isExerciseAllowed, type OptimisationConstraints } from "../entities/constraints.js";
import type { Exercise } from "../entities/exercise.js";
import { PROGRAMME_ORDER, type ProgrammeTemplate, type WorkoutAllocation } from "../entities/programme.js";
import type { DurationRange, PlannedExercise, WorkoutSession } from "../entities/workout-session.js";
import { reduceExerciseCount, type ReductionResult } from "./reduction-engine.js";
import { refreshWorkout, type RefreshResult } from "./refresh-engine.js";

/** Target total session duration per spec §9: 45-50 minutes (an estimate, not a hard constraint). */
export const TARGET_SESSION_DURATION: DurationRange = { minMinutes: 45, maxMinutes: 50 };

export class WorkoutBuilderError extends Error {}

/**
 * Builds a `WorkoutSession` from an exercise library and an explicit
 * programme template, preserving the template's slot order (expected to
 * already follow `PROGRAMME_ORDER`).
 */
export function buildSessionFromTemplate(library: Exercise[], template: ProgrammeTemplate): WorkoutSession {
  const libraryById = new Map(library.map((exercise) => [exercise.id, exercise]));

  const mainExercises: PlannedExercise[] = template.slots.map((slot) => {
    const exercise = libraryById.get(slot.exerciseId);
    if (!exercise) {
      throw new WorkoutBuilderError(
        `Programme template references unknown exercise id "${slot.exerciseId}" for group "${slot.programmeGroup}".`,
      );
    }
    if (exercise.programmeGroup !== slot.programmeGroup) {
      throw new WorkoutBuilderError(
        `Exercise "${exercise.id}" is assigned to slot "${slot.programmeGroup}" but belongs to programme group "${exercise.programmeGroup}".`,
      );
    }
    return {
      exercise,
      role: slot.role,
      prescribedWeight: exercise.startingWeight,
      prescribedReps: exercise.prescribedReps,
      repsUnit: exercise.repsUnit,
      prescribedDuration: exercise.prescribedDuration,
    };
  });

  return {
    warmup: WARMUP_PLAN,
    mainExercises,
    cooldown: COOLDOWN_PLAN,
    targetSessionDuration: TARGET_SESSION_DURATION,
  };
}

/** Builds the current default session directly from the library, using the authored PROGRAMME_TEMPLATE. */
export function buildDefaultSession(library: Exercise[]): WorkoutSession {
  return buildSessionFromTemplate(library, PROGRAMME_TEMPLATE);
}

/** Re-exported for convenience so callers building sessions don't need a second import. */
export { PROGRAMME_ORDER };

export interface BuildWorkoutOptions {
  /** Per-session count override, e.g. { legs: 3, core: 2 } — see reduceExerciseCount. */
  allocation?: WorkoutAllocation;
  constraints?: OptimisationConstraints;
}

export interface BuildWorkoutResult {
  session: WorkoutSession;
  /** Present only when `options.allocation` actually reduced at least one group. */
  reduction?: ReductionResult;
  /** Present only when a hard-constraint violation forced a substitution. */
  refresh?: RefreshResult;
}

/**
 * The top-level "generate the most efficient valid workout" entry point:
 * assembles the authored template, applies any requested count reduction,
 * then force-fixes any exercise that violates a hard constraint (e.g. an
 * excluded exercise still sitting in the template). With no options, this
 * reproduces the authored programme exactly — soft preferences alone never
 * trigger a substitution; that's what `refreshWorkout` ("I'm bored") is for.
 *
 * Each stage is a separate, independently-tested engine — this function
 * only sequences them; it makes no optimisation decisions of its own. Use
 * `buildWorkoutWithDetails` for the full trace of what each stage did.
 */
export function buildWorkoutWithDetails(
  library: Exercise[],
  template: ProgrammeTemplate,
  options: BuildWorkoutOptions = {},
): BuildWorkoutResult {
  let session = buildSessionFromTemplate(library, template);
  let reduction: ReductionResult | undefined;
  let refresh: RefreshResult | undefined;

  if (options.allocation) {
    reduction = reduceExerciseCount(session, options.allocation, { soft: options.constraints?.soft });
    session = reduction.session;
  }

  const hard = options.constraints?.hard;
  const hasViolation = session.mainExercises.some((pe) => pe.role === "main" && !isExerciseAllowed(pe.exercise, hard));
  if (hard && hasViolation) {
    refresh = refreshWorkout(session, library, options.constraints, { targetExerciseIds: [] });
    session = refresh.session;
  }

  return { session, reduction, refresh };
}

/** Convenience wrapper over `buildWorkoutWithDetails` returning just the resulting session. */
export function buildWorkout(library: Exercise[], template: ProgrammeTemplate, options: BuildWorkoutOptions = {}): WorkoutSession {
  return buildWorkoutWithDetails(library, template, options).session;
}

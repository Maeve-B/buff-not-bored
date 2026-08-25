/**
 * The workout builder: assembles a `WorkoutSession` from the catalog and a
 * programme template. This is the one deterministic business rule Phase 1
 * needs — spec §9 ("Default Workout") is explicit that V1 should follow the
 * fixed warm-up -> Legs -> Back -> Chest -> Triceps -> Shoulders -> Biceps ->
 * Core -> cool-down structure with no reordering/optimisation.
 *
 * Pure function: no I/O, no randomness, no framework dependency. Given the
 * same catalog + template, it always produces the same session.
 */

import { COOLDOWN_PLAN } from "../data/cooldown.js";
import { WARMUP_PLAN } from "../data/warmup.js";
import type { Exercise } from "../entities/exercise.js";
import { deriveDefaultProgrammeTemplate, PROGRAMME_ORDER, type ProgrammeTemplate } from "../entities/programme.js";
import type { DurationRange, PlannedExercise, WorkoutSession } from "../entities/workout-session.js";

/** Target total session duration per spec §9: 45-50 minutes (an estimate, not a hard constraint). */
export const TARGET_SESSION_DURATION: DurationRange = { minMinutes: 45, maxMinutes: 50 };

export class WorkoutBuilderError extends Error {}

function toPlannedExercise(exercise: Exercise): PlannedExercise {
  return {
    exercise,
    prescribedWeight: exercise.startingWeight,
    prescribedReps: exercise.prescribedReps,
    repsUnit: exercise.repsUnit,
    prescribedDuration: exercise.prescribedDuration,
  };
}

/**
 * Builds a `WorkoutSession` from a catalog and an explicit programme
 * template, preserving the template's slot order (which is expected to
 * already follow `PROGRAMME_ORDER`).
 */
export function buildSessionFromTemplate(catalog: Exercise[], template: ProgrammeTemplate): WorkoutSession {
  const catalogById = new Map(catalog.map((exercise) => [exercise.id, exercise]));

  const mainExercises: PlannedExercise[] = template.slots.map((slot) => {
    const exercise = catalogById.get(slot.exerciseId);
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
    return toPlannedExercise(exercise);
  });

  return {
    warmup: WARMUP_PLAN,
    mainExercises,
    cooldown: COOLDOWN_PLAN,
    targetSessionDuration: TARGET_SESSION_DURATION,
  };
}

/**
 * Builds the default V1 session directly from a catalog, deriving the
 * programme template along the way (see `deriveDefaultProgrammeTemplate` for
 * the "which exercise is currently prescribed per group" assumption).
 */
export function buildDefaultSession(catalog: Exercise[]): WorkoutSession {
  const template = deriveDefaultProgrammeTemplate(catalog);
  return buildSessionFromTemplate(catalog, template);
}

/** Re-exported for convenience so callers building sessions don't need a second import. */
export { PROGRAMME_ORDER };

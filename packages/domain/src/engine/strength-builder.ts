/**
 * Classic Strength builder — proves exercise selection is independent of
 * workout type by consuming the exact same `Exercise[]` library and
 * `ProgrammeTemplate` the Circuit builder (engine/workout-builder.ts) does.
 * Only the session SHAPE differs: sets per exercise instead of one
 * prescription, a `WeightRecommendation` (base/adjustments/final) instead
 * of a bare `prescribedWeight`, and per-set logged performance instead of
 * one logged attempt.
 *
 * Pure function: no I/O, no randomness, no framework dependency.
 */

import { PROGRAMME_TEMPLATE } from "../data/programme-template.js";
import type { Exercise } from "../entities/exercise.js";
import type { ProgrammeTemplate } from "../entities/programme.js";
import type { StrengthExercise, StrengthSession, StrengthSet } from "../entities/strength.js";
import { buildWeightRecommendation } from "../entities/weight-adjustment.js";

/**
 * Starting parameter, not a fixed rule — 3 sets is a conventional default
 * for a full-body strength session. Exposed via `options` rather than
 * buried, so it's an explicit, overridable choice, not a hidden constant.
 */
export const DEFAULT_SETS_PER_EXERCISE = 3;

/** Starting parameter, not a fixed rule — same spirit as DEFAULT_SETS_PER_EXERCISE. */
export const DEFAULT_REST_SECONDS = 90;

export class StrengthBuilderError extends Error {}

function buildSetsForExercise(exercise: Exercise, setsPerExercise: number, targetWeight: number | undefined): StrengthSet[] {
  return Array.from({ length: setsPerExercise }, (_, i) => ({
    setNumber: i + 1,
    targetReps: exercise.prescribedReps,
    repsUnit: exercise.repsUnit,
    targetDuration: exercise.prescribedDuration,
    targetWeight,
    completed: false,
  }));
}

export interface BuildStrengthSessionOptions {
  setsPerExercise?: number;
}

/**
 * Builds a `StrengthSession` from an exercise library and an explicit
 * programme template — same template contract as
 * `buildSessionFromTemplate` (engine/workout-builder.ts): every slot's
 * exercise id must exist in the library and belong to the declared
 * programme group.
 */
export function buildStrengthSessionFromTemplate(
  library: Exercise[],
  template: ProgrammeTemplate,
  options: BuildStrengthSessionOptions = {},
): StrengthSession {
  const setsPerExercise = options.setsPerExercise ?? DEFAULT_SETS_PER_EXERCISE;
  const libraryById = new Map(library.map((exercise) => [exercise.id, exercise]));

  const exercises: StrengthExercise[] = template.slots.map((slot) => {
    const exercise = libraryById.get(slot.exerciseId);
    if (!exercise) {
      throw new StrengthBuilderError(
        `Programme template references unknown exercise id "${slot.exerciseId}" for group "${slot.programmeGroup}".`,
      );
    }
    if (exercise.programmeGroup !== slot.programmeGroup) {
      throw new StrengthBuilderError(
        `Exercise "${exercise.id}" is assigned to slot "${slot.programmeGroup}" but belongs to programme group "${exercise.programmeGroup}".`,
      );
    }

    const recommendation = exercise.startingWeight !== undefined ? buildWeightRecommendation(exercise.startingWeight) : undefined;

    return {
      exercise,
      role: slot.role,
      sets: buildSetsForExercise(exercise, setsPerExercise, recommendation?.finalWeight),
      restSeconds: DEFAULT_REST_SECONDS,
      recommendation,
    };
  });

  return { exercises };
}

/** Builds the default Classic Strength session directly from the library, using the same authored PROGRAMME_TEMPLATE Circuit uses. */
export function buildDefaultStrengthSession(library: Exercise[], options: BuildStrengthSessionOptions = {}): StrengthSession {
  return buildStrengthSessionFromTemplate(library, PROGRAMME_TEMPLATE, options);
}

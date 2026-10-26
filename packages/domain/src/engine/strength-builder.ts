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
import { currentWeightFor, type CurrentWeights } from "../entities/current-weights.js";
import type { Exercise } from "../entities/exercise.js";
import type { ProgrammeTemplate } from "../entities/programme.js";
import { recommendedRestSeconds, type PresetSession } from "../entities/preset-programme.js";
import { isSetLogged, type StrengthExercise, type StrengthSession, type StrengthSet } from "../entities/strength.js";
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
  /** Your weights. A loaded exercise without one gets no target weight, to be entered at first use. */
  currentWeights?: CurrentWeights;
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

    const weight = currentWeightFor(exercise, options.currentWeights ?? {});
    const recommendation = weight !== undefined ? buildWeightRecommendation(weight) : undefined;

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

/**
 * Builds one session of a preset programme (§10.1) in the order the preset
 * gives. Every set targets the bottom of its range (D-011), and is
 * prescribed your current weight, or none to be entered at first use.
 */
export function buildPresetStrengthSession(
  library: Exercise[],
  session: PresetSession,
  options: Pick<BuildStrengthSessionOptions, "currentWeights"> = {},
): StrengthSession {
  const libraryById = new Map(library.map((exercise) => [exercise.id, exercise]));

  const exercises: StrengthExercise[] = session.slots.map((slot) => {
    const exercise = libraryById.get(slot.exerciseId);
    if (!exercise) {
      throw new StrengthBuilderError(`Preset session "${session.id}" references unknown exercise id "${slot.exerciseId}".`);
    }
    const range = slot.reps ?? slot.seconds;
    if (!range || (slot.reps !== undefined) === (slot.seconds !== undefined)) {
      throw new StrengthBuilderError(`Preset slot "${slot.exerciseId}" in "${session.id}" needs exactly one of reps or seconds.`);
    }
    if (!Number.isInteger(slot.sets) || slot.sets < 1 || range.min < 1 || range.min > range.max) {
      throw new StrengthBuilderError(`Preset slot "${slot.exerciseId}" in "${session.id}" needs at least one set and a range from low to high.`);
    }
    if ((slot.seconds !== undefined) !== (exercise.prescribedDuration !== undefined)) {
      throw new StrengthBuilderError(`Preset slot "${slot.exerciseId}" in "${session.id}" doesn't match how the exercise is counted.`);
    }

    const weight = currentWeightFor(exercise, options.currentWeights ?? {});
    const recommendation = weight !== undefined ? buildWeightRecommendation(weight) : undefined;
    const sets: StrengthSet[] = Array.from({ length: slot.sets }, (_, i) => ({
      setNumber: i + 1,
      targetReps: slot.reps?.min,
      repsUnit: slot.reps ? exercise.repsUnit : undefined,
      targetDuration: slot.seconds?.min,
      targetWeight: recommendation?.finalWeight,
      completed: false,
    }));

    return {
      exercise,
      role: "main",
      sets,
      recommendation,
      targetRange: { ...range },
      supersetGroup: slot.supersetGroup,
      recommendedRest: recommendedRestSeconds(exercise.exerciseClass),
    };
  });

  return { exercises };
}

/** One exercise re-prescribed at `weight` (or none): its recommendation and every set not yet logged. Logged sets keep what was lifted. */
function prescribe(strengthExercise: StrengthExercise, weight: number | undefined): StrengthExercise {
  const recommendation = weight !== undefined ? buildWeightRecommendation(weight) : undefined;
  return {
    ...strengthExercise,
    recommendation,
    sets: strengthExercise.sets.map((set) => (isSetLogged(set) ? set : { ...set, targetWeight: recommendation?.finalWeight })),
  };
}

/**
 * Re-prescribes an existing session from your current weights, keeping its
 * exercises. `"all"` is for a session that hasn't started; `"blanks"` only
 * fills exercises with no weight yet, so a workout in progress never has a
 * prescription changed (§3.3).
 */
export function prescribeStrengthWeights(
  session: StrengthSession,
  currentWeights: CurrentWeights,
  mode: "all" | "blanks",
): StrengthSession {
  return {
    exercises: session.exercises.map((strengthExercise) => {
      if (mode === "blanks" && strengthExercise.recommendation !== undefined) return strengthExercise;
      return prescribe(strengthExercise, currentWeightFor(strengthExercise.exercise, currentWeights));
    }),
  };
}

/**
 * Fills a first-use starting weight into an exercise that had none: its
 * recommendation and every set not yet logged take that weight. An
 * exercise that already has a recommendation is returned unchanged, since a
 * prescription is never replaced (§3.3).
 */
export function applyStartingWeight(session: StrengthSession, exerciseId: string, weight: number): StrengthSession {
  return {
    exercises: session.exercises.map((strengthExercise) =>
      strengthExercise.exercise.id !== exerciseId || strengthExercise.recommendation !== undefined
        ? strengthExercise
        : prescribe(strengthExercise, weight),
    ),
  };
}

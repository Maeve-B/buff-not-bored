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
import type { Exercise } from "../entities/exercise.js";
import { PROGRAMME_ORDER, type ProgrammeTemplate } from "../entities/programme.js";
import type { DurationRange, PlannedExercise, WorkoutSession } from "../entities/workout-session.js";

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

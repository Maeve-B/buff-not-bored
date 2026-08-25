/**
 * The programme structure: which programme groups a session covers, in what
 * order, and — for the default V1 session — which single exercise from the
 * catalog currently occupies each group's slot.
 */

import { PROGRAMME_GROUPS, type Exercise, type ProgrammeGroup } from "./exercise.js";

/** Fixed session order per spec §9: Legs -> Back -> Chest -> Triceps -> Shoulders -> Biceps -> Core. */
export const PROGRAMME_ORDER: readonly ProgrammeGroup[] = PROGRAMME_GROUPS;

export interface ProgrammeSlot {
  programmeGroup: ProgrammeGroup;
  exerciseId: string;
}

/** The current default programme: one exercise id per programme group. */
export interface ProgrammeTemplate {
  slots: ProgrammeSlot[];
}

export class ProgrammeTemplateError extends Error {}

/**
 * Derives the default programme template from a catalog.
 *
 * ASSUMPTION (flagged for review): PRODUCT_SPEC.md §6 lists several exercises
 * per programme group — this is the future substitution pool for the boredom
 * engine (§12), not a spec of which one is *currently* prescribed. This
 * function takes the first active exercise listed per group, in catalog
 * order, as the currently-prescribed one. That yields: Squats, Deadlifts,
 * Flat DB Press, Lying Tricep Extensions, Lateral Raises, Concentration Curl,
 * Plank — matching the exercises the spec gives the most specific detail for
 * (e.g. Deadlifts' "current working range").
 */
export function deriveDefaultProgrammeTemplate(catalog: Exercise[]): ProgrammeTemplate {
  const slots: ProgrammeSlot[] = PROGRAMME_ORDER.map((group) => {
    const first = catalog.find((exercise) => exercise.programmeGroup === group && exercise.active);
    if (!first) {
      throw new ProgrammeTemplateError(
        `No active exercise found for programme group "${group}" — cannot build a default template.`,
      );
    }
    return { programmeGroup: group, exerciseId: first.id };
  });

  return { slots };
}

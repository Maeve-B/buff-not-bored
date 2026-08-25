/**
 * The programme structure: which programme groups a session covers, in what
 * order, plus the explicit current template and its configurable per-group
 * exercise counts.
 *
 * Per the PROGRAMME MODEL CORRECTION: the current template must be
 * hand-authored data (see data/programme-template.ts), never inferred from
 * the exercise library's array order or length. The library (data/exercises.ts)
 * is a superset of what the template uses — "library" and "current workout"
 * are different concepts, on purpose.
 */

import { PROGRAMME_GROUPS, type Exercise, type ProgrammeGroup } from "./exercise.js";

/** Fixed session order per spec §9: Legs -> Back -> Chest -> Triceps -> Shoulders -> Biceps -> Core. */
export const PROGRAMME_ORDER: readonly ProgrammeGroup[] = PROGRAMME_GROUPS;

/**
 * "main" slots count toward a group's configured allocation; "finisher"
 * slots are a distinct, uncounted addendum that can be attached to any
 * programme group (not just legs) without affecting that group's count.
 */
export const SLOT_ROLES = ["main", "finisher"] as const;
export type SlotRole = (typeof SLOT_ROLES)[number];

export interface ProgrammeSlot {
  programmeGroup: ProgrammeGroup;
  exerciseId: string;
  /** Required (not defaulted) — this model avoids anything implicit, per the correction. */
  role: SlotRole;
}

/** The current normal structure: an explicit, hand-authored list of slots. */
export interface ProgrammeTemplate {
  slots: ProgrammeSlot[];
}

/**
 * The configurable target exercise count per programme group (counting only
 * "main" slots — finishers are uncounted). This is a standalone, editable
 * value — NOT derived from the template or hard-coded into `Exercise`/
 * `ProgrammeGroup` — so "reduce legs to 3 exercises" is a data edit here,
 * not a code change or a template mutation.
 */
export type ProgrammeAllocation = Record<ProgrammeGroup, number>;

/**
 * A per-session override of the standing `ProgrammeAllocation` (e.g. "make
 * this shorter"). Groups omitted here fall back to the standing allocation.
 * No generator consumes this yet (that's a future optimiser phase) — this
 * type exists now so the shape is settled and testable ahead of that.
 */
export type WorkoutAllocation = Partial<Record<ProgrammeGroup, number>>;

/** Merges a per-session override over the standing allocation. */
export function resolveWorkoutAllocation(
  base: ProgrammeAllocation,
  override?: WorkoutAllocation,
): ProgrammeAllocation {
  const resolved = { ...base };
  for (const group of PROGRAMME_ORDER) {
    const overrideValue = override?.[group];
    if (overrideValue !== undefined) {
      resolved[group] = overrideValue;
    }
  }
  return resolved;
}

export class ProgrammeTemplateError extends Error {}

/** Counts only "main" role slots per group — finishers are deliberately excluded. */
export function countMainSlotsByGroup(template: ProgrammeTemplate): Record<ProgrammeGroup, number> {
  const counts = Object.fromEntries(PROGRAMME_ORDER.map((group) => [group, 0])) as Record<ProgrammeGroup, number>;
  for (const slot of template.slots) {
    if (slot.role === "main") {
      counts[slot.programmeGroup] += 1;
    }
  }
  return counts;
}

/** Whether a template's main-slot counts match a given allocation, group by group. */
export function templateMatchesAllocation(template: ProgrammeTemplate, allocation: ProgrammeAllocation): boolean {
  const counts = countMainSlotsByGroup(template);
  return PROGRAMME_ORDER.every((group) => counts[group] === allocation[group]);
}

/**
 * Asserts a template's main-slot counts match an allocation, throwing with a
 * detailed message otherwise. Intended as a consistency guard between the
 * hand-authored template and allocation in data/programme-template.ts (e.g.
 * exercised by a test), not as runtime validation on every use.
 */
export function assertTemplateMatchesAllocation(template: ProgrammeTemplate, allocation: ProgrammeAllocation): void {
  const counts = countMainSlotsByGroup(template);
  const mismatches = PROGRAMME_ORDER.filter((group) => counts[group] !== allocation[group]);
  if (mismatches.length > 0) {
    const detail = mismatches
      .map((group) => `${group} (template has ${counts[group]}, allocation expects ${allocation[group]})`)
      .join(", ");
    throw new ProgrammeTemplateError(`Template main-slot counts don't match allocation for: ${detail}`);
  }
}

/**
 * Validates that every slot in a template references a real, active library
 * exercise belonging to the slot's declared programme group. Does not build
 * a session — see engine/workout-builder.ts for that (it performs this same
 * check as part of assembly; this standalone version is for validating a
 * template on its own, e.g. in tests, without going through the builder).
 */
export function validateTemplateAgainstLibrary(template: ProgrammeTemplate, library: Exercise[]): void {
  const byId = new Map(library.map((exercise) => [exercise.id, exercise]));
  const issues: string[] = [];

  for (const slot of template.slots) {
    const exercise = byId.get(slot.exerciseId);
    if (!exercise) {
      issues.push(`slot references unknown exercise id "${slot.exerciseId}"`);
      continue;
    }
    if (!exercise.active) {
      issues.push(`slot references inactive exercise "${slot.exerciseId}"`);
    }
    if (exercise.programmeGroup !== slot.programmeGroup) {
      issues.push(
        `slot declares group "${slot.programmeGroup}" but exercise "${slot.exerciseId}" belongs to "${exercise.programmeGroup}"`,
      );
    }
  }

  if (issues.length > 0) {
    throw new ProgrammeTemplateError(`Template failed validation against library:\n${issues.join("\n")}`);
  }
}

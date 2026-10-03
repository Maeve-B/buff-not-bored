/**
 * ExerciseCapability: the user's current personal working ability for an
 * exercise, independent of any workout. A third, distinct concept from the
 * other two weight/performance ideas already in this codebase — kept
 * deliberately separate, never collapsed:
 *
 *   1. ExerciseCapability (this file) — "what I currently believe I can do"
 *      for an exercise. Exists on its own; can be set manually, with zero
 *      workout history, and persists independently of any session.
 *   2. WeightRecommendation (entities/weight-adjustment.ts) — "what this
 *      SESSION recommends" for one exercise, derived from a base weight
 *      (today, the exercise's startingWeight; in future, this capability)
 *      plus any adjustments. Scoped to one workout, not persistent state.
 *   3. Actual logged performance (StrengthSet/SetLog) — what was actually
 *      done in one specific set/session. A historical fact, never mutated.
 *
 * `source` records provenance — "manual" (the user typed a number directly,
 * e.g. from a future profile/settings screen) or "progression" (the user
 * confirmed a progression engine's suggestion) — mirroring the existing
 * explicit/inferred provenance pattern used elsewhere in this codebase's
 * design (ARCHITECTURE.md's `Preference.source`). Both are still explicit,
 * user-confirmed writes: nothing ever updates a capability automatically in
 * the background. The progression engine itself is not wired to this yet
 * (that's a later phase) — this type only needs to exist and be settable.
 *
 * Deliberately separate from `Exercise` (entities/exercise.ts): `Exercise`
 * is shared catalog/reference data, curated rarely; capability is personal,
 * mutable state that changes as the user gets stronger, owned by the user,
 * not the catalog. See packages/db's schema.prisma for the persistence-side
 * rationale (same split, enforced as two tables, not one).
 */

import type { RepsUnit, WeightUnit } from "./exercise.js";

/** "manual" = the user set this directly; "progression" = the user confirmed a progression suggestion. Never set automatically. */
export const CAPABILITY_SOURCES = ["manual", "progression"] as const;
export type CapabilitySource = (typeof CAPABILITY_SOURCES)[number];

/**
 * One exercise's current capability. Not every field applies to every
 * exercise — a bodyweight exercise might only have `reps` (e.g. "15
 * pull-ups"), a timed exercise only `duration` (e.g. "90s plank"), a loaded
 * exercise typically `weight` + `reps` together. At least one of
 * weight/reps/duration must be present (see validation/exercise-capability.schema.ts) —
 * an empty capability record isn't meaningful.
 */
export interface ExerciseCapability {
  exerciseId: string;

  /** Absent for exercises with no external load. */
  weight?: number;
  weightUnit?: WeightUnit;

  reps?: number;
  repsUnit?: RepsUnit;

  /** Seconds — for duration-based exercises (e.g. a plank hold). */
  duration?: number;

  source: CapabilitySource;
  /** Optional free-text context, e.g. "felt strong", set alongside a manual edit. */
  note?: string;

  /** When this capability was last set — database-managed, never caller-supplied on write. */
  updatedAt: string;
}

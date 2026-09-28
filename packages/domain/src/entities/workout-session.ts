/**
 * The shape of an assembled workout session: warm-up -> main programme -> cool-down,
 * per PRODUCT_SPEC.md §7-9.
 */

import type { Exercise, RepsUnit } from "./exercise.js";
import type { SlotRole } from "./programme.js";

export interface DurationRange {
  minMinutes: number;
  maxMinutes: number;
}

/**
 * A single warm-up movement (spec §7). Warm-up steps are intentionally *not*
 * `Exercise` records: they don't count toward muscle coverage and don't
 * participate in progression, so they carry no weight/rep prescription here.
 */
export interface WarmupStep {
  order: number;
  name: string;
}

export interface WarmupPlan {
  steps: WarmupStep[];
  targetDuration: DurationRange;
}

/**
 * Cool-down (spec §8) is target areas + duration only — it explicitly does not
 * participate in workout optimisation, so target areas are free-form labels,
 * not typed against the `Muscle` enum used for coverage calculations.
 *
 * `targetAreas` is a flat list by design: more areas (or, later, named
 * stretches) can be appended without a shape change. If specific per-area
 * stretches are introduced later, this can grow a `StretchStep[]` alongside
 * (mirroring `WarmupStep`) without breaking existing callers.
 */
export interface CooldownPlan {
  targetAreas: string[];
  targetDuration: DurationRange;
}

/**
 * An exercise as prescribed *for this session*. Today (Phase 1) its
 * weight/reps/duration are a direct copy of the exercise's defaults; this is
 * kept as its own record — rather than reading straight from `Exercise` —
 * because a future progression engine (spec §11) will prescribe a session's
 * weight independently of the exercise's static `startingWeight`.
 */
export interface PlannedExercise {
  exercise: Exercise;
  /** "main" counts toward the group's ProgrammeAllocation; "finisher" is an uncounted addendum. */
  role: SlotRole;
  prescribedWeight?: number;
  prescribedReps?: number;
  repsUnit?: RepsUnit;
  prescribedDuration?: number;
}

export interface WorkoutSession {
  warmup: WarmupPlan;
  /**
   * Every exercise in the session's main programme, grouped by programme
   * group in the fixed order from spec §9 (Legs -> ... -> Core); each group
   * may contain multiple exercises (per its ProgrammeAllocation) plus any
   * finisher slots.
   */
  mainExercises: PlannedExercise[];
  cooldown: CooldownPlan;
  targetSessionDuration: DurationRange;
}

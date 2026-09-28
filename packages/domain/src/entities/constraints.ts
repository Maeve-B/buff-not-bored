/**
 * Shared optimisation vocabulary used by every Phase 2 engine (refresh,
 * reduction, equipment/location scoring, and — via buildWorkout — the
 * builder). Centralised here so "hard constraints must never be violated to
 * improve a soft score" (the load-bearing rule of the whole optimiser) is
 * enforced the same way everywhere, not reimplemented per engine.
 *
 * HARD constraints narrow which exercises are even eligible: violating one
 * makes a candidate invalid, full stop, regardless of how well it would
 * otherwise score. SOFT preferences only ever influence ranking among
 * already-valid candidates.
 */

import type { Equipment, Exercise, Location } from "./exercise.js";

export interface HardConstraints {
  /** Exercise ids that must never be selected (explicit user avoidance — spec §4.4). */
  excludedExerciseIds?: string[];
  /** If set, only exercises using one of these equipment types are eligible. */
  allowedEquipment?: Equipment[];
  /** If set, only exercises at one of these locations are eligible. */
  allowedLocations?: Location[];
  /**
   * Minimum number of primary muscles a replacement candidate must share
   * with the exercise it's replacing, for the replacement to count as
   * providing "appropriate muscle stimulus" (spec §12). Default 1 — a
   * replacement with zero primary-muscle overlap is never valid, no matter
   * how well it scores otherwise.
   */
  minimumPrimaryOverlap?: number;
}

export interface SoftPreferences {
  /** "Keep me at the bench" — favours candidates at this location. */
  preferredLocation?: Location;
  /** "Dumbbells only" as a soft nudge (use `hard.allowedEquipment` if it must never be violated). */
  preferredEquipment?: Equipment;
  /** Favour candidates that don't change equipment relative to the exercise being replaced. */
  minimizeEquipmentChanges?: boolean;
  /** Favour candidates that don't change location relative to the exercise being replaced. */
  minimizeLocationChanges?: boolean;
  /** Favour candidates whose prescribed weight is close to the exercise being replaced. */
  minimizeWeightChanges?: boolean;
  /** Exercise ids used recently, most-recent first — deprioritised as replacement candidates. */
  recentlyUsedExerciseIds?: string[];
  /**
   * Optional external preference weighting per exercise id (e.g. from a
   * future learned-preference store), in [-1, 1]. Not implemented by any
   * Phase 2 engine's data layer — this is a hook so refresh scoring has
   * somewhere to plug it in later without a signature change.
   */
  preferenceWeights?: Record<string, number>;
  /** Relative weight [0, 1] given to variety (not-recently-used) vs. other soft signals. Default 0.5. */
  varietyWeight?: number;
}

export interface OptimisationConstraints {
  hard?: HardConstraints;
  soft?: SoftPreferences;
}

/** Whether an exercise is allowed at all under the hard constraints (ignoring soft preferences). */
export function isExerciseAllowed(exercise: Exercise, hard: HardConstraints | undefined): boolean {
  if (!hard) return true;
  if (hard.excludedExerciseIds?.includes(exercise.id)) return false;
  if (hard.allowedEquipment && !hard.allowedEquipment.includes(exercise.equipment)) return false;
  if (hard.allowedLocations && !hard.allowedLocations.includes(exercise.location)) return false;
  return true;
}

/** Whether `candidate` provides "appropriate muscle stimulus" relative to `original`, per hard.minimumPrimaryOverlap. */
export function hasAdequatePrimaryOverlap(original: Exercise, candidate: Exercise, hard: HardConstraints | undefined): boolean {
  const minimumOverlap = hard?.minimumPrimaryOverlap ?? 1;
  if (minimumOverlap <= 0) return true;
  const originalPrimary = new Set(original.primaryMuscles);
  const sharedCount = candidate.primaryMuscles.filter((m) => originalPrimary.has(m)).length;
  return sharedCount >= minimumOverlap;
}

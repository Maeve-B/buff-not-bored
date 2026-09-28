/**
 * The boredom/refresh engine (spec §12). `refreshWorkout` replaces exercises
 * in a session with library alternates, always respecting hard constraints
 * and never selecting a replacement purely because it shares a programme
 * group — it must also provide "appropriate muscle stimulus" (spec §12.2).
 *
 * Two ways to choose which exercises get attempted:
 *  - Default ("I'm bored") mode: exactly one *main*-role exercise per
 *    programme group — the first main slot in that group, in session order.
 *    This is a documented assumption (the spec never specified which
 *    exercise within a multi-exercise group to replace); pass
 *    `options.targetExerciseIds` to target a specific exercise instead.
 *  - Targeted mode: `options.targetExerciseIds` names exactly which
 *    exercises to attempt replacing (all of them, not capped at one per
 *    group) — used by `buildWorkout` to force out any exercise that
 *    violates a hard constraint.
 *
 * Either way, any *other* main exercise in the session that violates a hard
 * constraint is *also* targeted automatically — a hard constraint must
 * never be left silently violated when a fix is possible (spec Phase 2 §7).
 * If no compliant replacement exists, the violating exercise is retained
 * and the decision is flagged `violatesHardConstraints: true` rather than
 * silently dropped.
 *
 * Deterministic: candidate ranking always ends in an exercise-id tie-break,
 * never randomness.
 */

import { hasAdequatePrimaryOverlap, isExerciseAllowed, type OptimisationConstraints, type SoftPreferences } from "../entities/constraints.js";
import type { Exercise, Muscle, ProgrammeGroup } from "../entities/exercise.js";
import type { PlannedExercise, WorkoutSession } from "../entities/workout-session.js";
import { scoreEquipmentAlignment } from "./equipment-optimiser.js";

export interface RejectedCandidate {
  exerciseId: string;
  reason: string;
}

export interface ReplacementDecision {
  programmeGroup: ProgrammeGroup;
  previousExerciseId: string;
  /** Equal to previousExerciseId when retained (replaced: false). */
  selectedExerciseId: string;
  replaced: boolean;
  reason: string;
  /** Primary muscles the selection preserves relative to the exercise it replaced (or all of them, if retained). */
  preservedPrimaryMuscles: Muscle[];
  /** True if previousExerciseId violates a hard constraint and could not be fixed — surfaced, never silently ignored. */
  violatesHardConstraints: boolean;
  rejectedCandidates: RejectedCandidate[];
}

export interface RefreshResult {
  session: WorkoutSession;
  decisions: ReplacementDecision[];
}

export interface RefreshOptions {
  /**
   * Exercise ids to attempt replacing. Any exercise elsewhere in the
   * session that violates a hard constraint is targeted in addition to
   * this list, regardless.
   *
   * - Omitted (undefined): default "I'm bored" behaviour — one main
   *   exercise per group, plus any hard-constraint violation.
   * - Provided (including `[]`): used as-is, plus any hard-constraint
   *   violation, but the default one-per-group boredom selection is
   *   skipped — pass `[]` to fix violations only, with no unsolicited
   *   variety substitution.
   */
  targetExerciseIds?: string[];
}

function scoreCandidate(
  candidate: Exercise,
  soft: SoftPreferences | undefined,
  previousExercise: Exercise,
): { total: number; explanation: string[] } {
  const equipmentResult = scoreEquipmentAlignment(candidate, soft, previousExercise);
  const explanation = [...equipmentResult.explanation];
  let varietyScore = 0;

  const recent = soft?.recentlyUsedExerciseIds ?? [];
  const varietyWeight = soft?.varietyWeight ?? 0.5;
  const recentIndex = recent.indexOf(candidate.id);
  if (recentIndex === -1) {
    varietyScore = 2 * varietyWeight;
    explanation.push(`+${varietyScore.toFixed(2)}: not recently used`);
  } else {
    const recencyPenalty = recent.length > 0 ? 2 * varietyWeight * (1 - recentIndex / recent.length) : 0;
    varietyScore = -recencyPenalty;
    explanation.push(`-${recencyPenalty.toFixed(2)}: recently used (position ${recentIndex} of ${recent.length} most-recently-used)`);
  }

  const preferenceScore = soft?.preferenceWeights?.[candidate.id] ?? 0;
  if (preferenceScore !== 0) {
    explanation.push(`${preferenceScore >= 0 ? "+" : ""}${preferenceScore.toFixed(2)}: learned preference weight`);
  }

  return { total: equipmentResult.score + varietyScore + preferenceScore, explanation };
}

function attemptReplacement(
  currentExercise: Exercise,
  library: Exercise[],
  otherSessionExerciseIds: Set<string>,
  constraints: OptimisationConstraints,
): ReplacementDecision {
  const { hard, soft } = constraints;
  const group = currentExercise.programmeGroup;
  const rejected: RejectedCandidate[] = [];
  const eligible: Exercise[] = [];

  for (const candidate of library) {
    if (candidate.id === currentExercise.id) continue;
    if (candidate.programmeGroup !== group) continue;
    if (!candidate.active) {
      rejected.push({ exerciseId: candidate.id, reason: "inactive in the library" });
      continue;
    }
    if (otherSessionExerciseIds.has(candidate.id)) {
      rejected.push({ exerciseId: candidate.id, reason: "already used elsewhere in this session" });
      continue;
    }
    if (!isExerciseAllowed(candidate, hard)) {
      rejected.push({ exerciseId: candidate.id, reason: "excluded by a hard constraint (explicit avoidance, equipment, or location)" });
      continue;
    }
    if (!hasAdequatePrimaryOverlap(currentExercise, candidate, hard)) {
      rejected.push({ exerciseId: candidate.id, reason: "insufficient primary-muscle overlap with the exercise it would replace — same group is not enough" });
      continue;
    }
    eligible.push(candidate);
  }

  const currentViolatesHard = !isExerciseAllowed(currentExercise, hard);

  if (eligible.length === 0) {
    return {
      programmeGroup: group,
      previousExerciseId: currentExercise.id,
      selectedExerciseId: currentExercise.id,
      replaced: false,
      reason: currentViolatesHard
        ? `HARD CONSTRAINT VIOLATION: "${currentExercise.id}" violates a hard constraint, but no compliant replacement exists in "${group}" — retained as there is no valid alternative.`
        : `No eligible replacement found for "${currentExercise.id}" in "${group}" — retained.`,
      preservedPrimaryMuscles: currentExercise.primaryMuscles,
      violatesHardConstraints: currentViolatesHard,
      rejectedCandidates: rejected,
    };
  }

  const scored = eligible
    .map((candidate) => ({ candidate, ...scoreCandidate(candidate, soft, currentExercise) }))
    .sort((a, b) => b.total - a.total || a.candidate.id.localeCompare(b.candidate.id));

  const best = scored[0]!;
  for (const runnerUp of scored.slice(1)) {
    rejected.push({
      exerciseId: runnerUp.candidate.id,
      reason: `scored lower than "${best.candidate.id}" (${runnerUp.total.toFixed(2)} vs ${best.total.toFixed(2)}): ${runnerUp.explanation.join("; ")}`,
    });
  }

  return {
    programmeGroup: group,
    previousExerciseId: currentExercise.id,
    selectedExerciseId: best.candidate.id,
    replaced: true,
    reason: `Selected "${best.candidate.id}" (score ${best.total.toFixed(2)}): ${best.explanation.join("; ")}`,
    preservedPrimaryMuscles: best.candidate.primaryMuscles.filter((m) => currentExercise.primaryMuscles.includes(m)),
    violatesHardConstraints: false,
    rejectedCandidates: rejected,
  };
}

export function refreshWorkout(
  session: WorkoutSession,
  library: Exercise[],
  constraints: OptimisationConstraints = {},
  options: RefreshOptions = {},
): RefreshResult {
  const libraryById = new Map(library.map((exercise) => [exercise.id, exercise]));

  const violatingIds = session.mainExercises
    .filter((pe) => pe.role === "main" && !isExerciseAllowed(pe.exercise, constraints.hard))
    .map((pe) => pe.exercise.id);

  let targetIds: string[];
  if (options.targetExerciseIds !== undefined) {
    // Explicitly provided (even as []) — use it as-is, plus any hard-constraint
    // violation, but do NOT fall back to the default one-per-group boredom
    // selection. This lets a caller (e.g. buildWorkout) force-fix violations
    // only, without triggering unsolicited variety substitution.
    targetIds = Array.from(new Set([...options.targetExerciseIds, ...violatingIds]));
  } else {
    const seenGroups = new Set<ProgrammeGroup>();
    const defaultTargets: string[] = [];
    for (const pe of session.mainExercises) {
      if (pe.role !== "main") continue;
      if (seenGroups.has(pe.exercise.programmeGroup)) continue;
      seenGroups.add(pe.exercise.programmeGroup);
      defaultTargets.push(pe.exercise.id);
    }
    targetIds = Array.from(new Set([...defaultTargets, ...violatingIds]));
  }

  const sessionExerciseIds = new Set(session.mainExercises.map((pe) => pe.exercise.id));
  const decisions: ReplacementDecision[] = [];
  const replacementByOldId = new Map<string, Exercise>();

  for (const targetId of targetIds) {
    const plannedExercise = session.mainExercises.find((pe) => pe.exercise.id === targetId && pe.role === "main");
    if (!plannedExercise) continue; // not a main-role exercise currently in the session — nothing to do

    const currentExercise = plannedExercise.exercise;
    const otherSessionIds = new Set([...sessionExerciseIds].filter((id) => id !== currentExercise.id));
    const decision = attemptReplacement(currentExercise, library, otherSessionIds, constraints);
    decisions.push(decision);

    if (decision.replaced) {
      const replacement = libraryById.get(decision.selectedExerciseId)!;
      replacementByOldId.set(currentExercise.id, replacement);
      sessionExerciseIds.delete(currentExercise.id);
      sessionExerciseIds.add(replacement.id);
    }
  }

  const newMainExercises: PlannedExercise[] = session.mainExercises.map((pe) => {
    const replacement = replacementByOldId.get(pe.exercise.id);
    if (!replacement) return pe;
    return {
      exercise: replacement,
      role: pe.role,
      prescribedWeight: replacement.startingWeight,
      prescribedReps: replacement.prescribedReps,
      repsUnit: replacement.repsUnit,
      prescribedDuration: replacement.prescribedDuration,
    };
  });

  return {
    session: { ...session, mainExercises: newMainExercises },
    decisions,
  };
}

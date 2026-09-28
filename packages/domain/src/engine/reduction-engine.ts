/**
 * Exercise-count reduction: "make this shorter" (spec §10). Reduces one or
 * more programme groups' exercise counts, per the required algorithm shape:
 *
 *   FILTER -> SCORE -> SELECT -> VALIDATE
 *
 * FILTER:   candidates for removal are a group's current "main" exercises
 *           (finishers are never touched — they're a distinct, uncounted
 *           addendum, per the programme model correction).
 * SCORE:    each candidate is scored by how redundant its primary-muscle
 *           coverage is elsewhere in the *original* full session (higher =
 *           more backup coverage = safer to remove), tie-broken by
 *           equipment/location alignment with any soft preference supplied.
 * SELECT:   remove the most redundant candidates first, walking down the
 *           ranked list until the requested count is reached.
 * VALIDATE: before actually committing each removal, re-check *live*
 *           whole-session coverage (accounting for every removal already
 *           committed, including in earlier groups) — a candidate whose
 *           removal would drop a required muscle's total exposure to zero
 *           is skipped, and the engine tries the next-most-redundant one.
 *           If a group cannot be reduced to the requested count without an
 *           unacceptable gap, the whole call throws `ReductionError` — a
 *           gap is *reported*, never silently produced.
 *
 * A "required" muscle is any muscle that is a PRIMARY muscle of at least
 * one exercise in the original (pre-reduction) main session. Secondary-only
 * original coverage isn't required to survive reduction — a documented
 * simplification, not an oversight (see EXERCISE_AUDIT.md-style flags in
 * the Phase 2 report for why).
 */

import type { SoftPreferences } from "../entities/constraints.js";
import type { Exercise, Muscle, ProgrammeGroup } from "../entities/exercise.js";
import { calculateMuscleCoverage, getExposureCount } from "../entities/muscle-coverage.js";
import { PROGRAMME_ORDER, type WorkoutAllocation } from "../entities/programme.js";
import type { PlannedExercise, WorkoutSession } from "../entities/workout-session.js";
import { rankByEquipmentAlignment } from "./equipment-optimiser.js";

export interface CoverageGapWarning {
  programmeGroup: ProgrammeGroup;
  muscle: Muscle;
  message: string;
}

export class ReductionError extends Error {
  constructor(
    message: string,
    public readonly gaps: CoverageGapWarning[],
  ) {
    super(message);
    this.name = "ReductionError";
  }
}

export interface ExerciseRedundancyScore {
  exerciseId: string;
  /** Minimum backup exposure (elsewhere in the original session) across this exercise's primary muscles — its weakest-link contribution. Higher = more redundant = safer to remove. */
  score: number;
  rationale: string[];
}

export interface ReductionGroupDecision {
  programmeGroup: ProgrammeGroup;
  originalCount: number;
  requestedCount: number;
  removedExerciseIds: string[];
  retainedExerciseIds: string[];
  scores: ExerciseRedundancyScore[];
}

export interface ReductionResult {
  session: WorkoutSession;
  decisions: ReductionGroupDecision[];
}

export interface ReduceExerciseCountOptions {
  /** Used only as a SELECT-step tie-break among similarly-redundant candidates, never to override coverage validity. */
  soft?: SoftPreferences;
}

function groupMainExercisesByGroup(session: WorkoutSession): Map<ProgrammeGroup, PlannedExercise[]> {
  const byGroup = new Map<ProgrammeGroup, PlannedExercise[]>();
  for (const plannedExercise of session.mainExercises) {
    if (plannedExercise.role !== "main") continue; // finishers are never reduction candidates
    const group = plannedExercise.exercise.programmeGroup;
    const list = byGroup.get(group) ?? [];
    list.push(plannedExercise);
    byGroup.set(group, list);
  }
  return byGroup;
}

/**
 * Reduces one or more programme groups' exercise counts. `allocation` is
 * sparse (`WorkoutAllocation`) — only the groups you name are considered
 * for reduction; every other group is left untouched, matching "Legs: 3,
 * Core: 2" leaving Chest/Back/Triceps/Shoulders/Biceps as-is.
 */
export function reduceExerciseCount(
  session: WorkoutSession,
  allocation: WorkoutAllocation,
  options: ReduceExerciseCountOptions = {},
): ReductionResult {
  const mainByGroup = groupMainExercisesByGroup(session);

  // Validate the request itself before touching anything (atomic: either
  // every requested group can be satisfied, or nothing is changed).
  for (const group of PROGRAMME_ORDER) {
    const requested = allocation[group];
    if (requested === undefined) continue;
    if (requested < 1) {
      throw new ReductionError(
        `Requested allocation for "${group}" is ${requested}, but every programme group must retain at least 1 exercise (spec §3 — meaningful exposure across all groups).`,
        [],
      );
    }
    const current = mainByGroup.get(group)?.length ?? 0;
    if (requested > current) {
      throw new ReductionError(
        `Requested allocation for "${group}" is ${requested}, which exceeds its current ${current} main exercises — reduceExerciseCount only reduces, it does not add exercises.`,
        [],
      );
    }
  }

  // Whole-session context, fixed for the SCORE step (deliberately *not*
  // recomputed as removals are committed — see module doc).
  const allMainExercises: Exercise[] = session.mainExercises
    .filter((pe) => pe.role === "main")
    .map((pe) => pe.exercise);
  const originalCoverage = calculateMuscleCoverage(allMainExercises);
  const requiredMuscles = new Set(
    originalCoverage.musclesTrained.filter((muscle) => (originalCoverage.entries.get(muscle)?.primaryExposures ?? 0) > 0),
  );

  const decisions: ReductionGroupDecision[] = [];
  const removedIds = new Set<string>();

  for (const group of PROGRAMME_ORDER) {
    const groupExercises = mainByGroup.get(group) ?? [];
    const requested = allocation[group];
    if (requested === undefined || requested >= groupExercises.length) continue;

    const toRemoveCount = groupExercises.length - requested;

    // SCORE. Redundancy is the *minimum* backup exposure across an
    // exercise's primary muscles (its weakest link), not the average.
    // Averaging would let one abundantly-covered muscle (e.g. glutes, which
    // shows up as secondary coverage almost everywhere) mask that another
    // of the exercise's primary muscles (e.g. adductors) is scarce —
    // exactly the case that would wrongly mark Sumo Squats as safe to
    // remove despite it being the session's only real adductor stimulus.
    // The minimum protects an exercise's most scarce contribution, which is
    // what "contribution to required muscle coverage" (spec Phase 2 §4)
    // actually means.
    const scored: ExerciseRedundancyScore[] = groupExercises.map(({ exercise }) => {
      const others = allMainExercises.filter((e) => e.id !== exercise.id);
      const otherCoverage = calculateMuscleCoverage(others);
      const rationale: string[] = [`primary muscles: ${exercise.primaryMuscles.join(", ") || "(none)"}`];
      const backups: number[] = [];
      for (const muscle of exercise.primaryMuscles) {
        const backupExposure = getExposureCount(otherCoverage, muscle);
        backups.push(backupExposure);
        rationale.push(`  "${muscle}": ${backupExposure} other exposure(s) elsewhere in the original session if removed`);
      }
      const score = backups.length > 0 ? Math.min(...backups) : 0;
      rationale.push(`redundancy score: ${score} (minimum backup across its primary muscles — higher = safer to remove)`);
      return { exerciseId: exercise.id, score, rationale };
    });

    // Equipment/location tie-break: rank the group's own exercises by soft
    // alignment so, among equally redundant candidates, the less-aligned
    // one is removed first (keeping the more-aligned ones).
    const equipmentRanked = rankByEquipmentAlignment(
      groupExercises.map((pe) => pe.exercise),
      options.soft,
    );
    const equipmentScoreById = new Map(equipmentRanked.map((r) => [r.exercise.id, r.score]));

    // SELECT: most redundant first, tie-broken by lowest equipment
    // alignment, then by id for full determinism.
    const removalOrder = [...scored].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const eqA = equipmentScoreById.get(a.exerciseId) ?? 0;
      const eqB = equipmentScoreById.get(b.exerciseId) ?? 0;
      if (eqA !== eqB) return eqA - eqB;
      return a.exerciseId.localeCompare(b.exerciseId);
    });

    // VALIDATE (live, cumulative across every group processed so far)
    const removedThisGroup: string[] = [];
    const gapsThisGroup: CoverageGapWarning[] = [];
    for (const candidate of removalOrder) {
      if (removedThisGroup.length >= toRemoveCount) break;
      const exercise = groupExercises.find((pe) => pe.exercise.id === candidate.exerciseId)!.exercise;

      const tentativeRemaining = allMainExercises.filter(
        (e) => e.id !== exercise.id && !removedIds.has(e.id) && !removedThisGroup.includes(e.id),
      );
      const tentativeCoverage = calculateMuscleCoverage(tentativeRemaining);

      const gapMuscles = exercise.primaryMuscles.filter(
        (muscle) => requiredMuscles.has(muscle) && getExposureCount(tentativeCoverage, muscle) === 0,
      );

      if (gapMuscles.length > 0) {
        for (const muscle of gapMuscles) {
          gapsThisGroup.push({
            programmeGroup: group,
            muscle,
            message: `Removing "${exercise.id}" would drop all training exposure to "${muscle}" — no other retained exercise covers it.`,
          });
        }
        continue;
      }

      removedThisGroup.push(exercise.id);
    }

    if (removedThisGroup.length < toRemoveCount) {
      throw new ReductionError(
        `Cannot reduce "${group}" from ${groupExercises.length} to ${requested} without an unacceptable muscle-coverage gap.`,
        gapsThisGroup,
      );
    }

    for (const id of removedThisGroup) removedIds.add(id);

    decisions.push({
      programmeGroup: group,
      originalCount: groupExercises.length,
      requestedCount: requested,
      removedExerciseIds: removedThisGroup,
      retainedExerciseIds: groupExercises.map((pe) => pe.exercise.id).filter((id) => !removedThisGroup.includes(id)),
      scores: scored,
    });
  }

  const reducedMainExercises = session.mainExercises.filter((pe) => !removedIds.has(pe.exercise.id));

  return {
    session: { ...session, mainExercises: reducedMainExercises },
    decisions,
  };
}

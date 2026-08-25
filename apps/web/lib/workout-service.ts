/**
 * The thin application layer between the UI and @buff-not-bored/domain.
 *
 * This file is the ONLY place allowed to import the domain engine's
 * optimisation functions. It never decides muscle coverage, replacements,
 * reductions, equipment scoring, or progression itself — it calls the
 * domain functions that do, and reshapes their (already-decided) output
 * into UI-friendly summaries. Components call these functions; they never
 * call `refreshWorkout`/`reduceExerciseCount`/`recommendProgression` etc.
 * directly, and never reimplement what those functions already do.
 */

import {
  buildDefaultSession,
  calculateMuscleCoverage,
  countTransitions,
  distinctEquipment,
  EXERCISES,
  getExposureCount,
  PROGRAMME_ORDER,
  reduceExerciseCount,
  ReductionError,
  recommendProgression,
  refreshWorkout,
  type CoverageGapWarning,
  type Equipment,
  type Exercise,
  type Muscle,
  type PlannedExercise,
  type ProgrammeGroup,
  type ProgressionRecommendation,
  type ReductionResult,
  type RefreshResult,
  type ReplacementDecision,
  type SoftPreferences,
  type WorkoutAllocation,
  type WorkoutSession,
} from "@buff-not-bored/domain";
import type { CompletedWorkout, SetLog } from "./types";

export const WORKOUT_NAME = "Full Body";

/** Today's workout, built directly from the authored programme template — no persistence in this phase. */
export function getTodayWorkout(): WorkoutSession {
  return buildDefaultSession(EXERCISES);
}

function mainExercisesOf(session: WorkoutSession): PlannedExercise[] {
  return session.mainExercises.filter((pe) => pe.role === "main");
}

/** Programme groups actually present in a session's main programme, in the fixed spec §9 order. */
export function getProgrammeGroupsPresent(session: WorkoutSession): ProgrammeGroup[] {
  const present = new Set(mainExercisesOf(session).map((pe) => pe.exercise.programmeGroup));
  return PROGRAMME_ORDER.filter((group) => present.has(group));
}

function countMainByGroup(session: WorkoutSession): Partial<Record<ProgrammeGroup, number>> {
  const counts: Partial<Record<ProgrammeGroup, number>> = {};
  for (const pe of mainExercisesOf(session)) {
    counts[pe.exercise.programmeGroup] = (counts[pe.exercise.programmeGroup] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Swap (single-exercise substitution)
// ---------------------------------------------------------------------------

export interface SwapResult {
  session: WorkoutSession;
  decision: ReplacementDecision;
}

/** Swaps one exercise using the deterministic refresh engine, targeted at exactly that exercise. */
export function swapExercise(session: WorkoutSession, exerciseId: string): SwapResult {
  const result = refreshWorkout(session, EXERCISES, {}, { targetExerciseIds: [exerciseId] });
  const decision = result.decisions.find((d) => d.previousExerciseId === exerciseId);
  if (!decision) {
    throw new Error(`swapExercise: no decision produced for "${exerciseId}" — is it a main-role exercise in this session?`);
  }
  return { session: result.session, decision };
}

// ---------------------------------------------------------------------------
// "I'm Bored" refresh preview
// ---------------------------------------------------------------------------

export interface RefreshChoices {
  changeOnePerGroup: boolean;
  shorter: boolean;
  stayNearBench: boolean;
  minimizeEquipmentChanges: boolean;
}

export const DEFAULT_REFRESH_CHOICES: RefreshChoices = {
  changeOnePerGroup: true,
  shorter: false,
  stayNearBench: false,
  minimizeEquipmentChanges: false,
};

export interface MuscleExposureChange {
  muscle: Muscle;
  before: number;
  after: number;
}

export interface RefreshPreviewSummary {
  changedExercises: { previous: Exercise; next: Exercise; group: ProgrammeGroup }[];
  removedExercises: { exercise: Exercise; group: ProgrammeGroup }[];
  unchangedCount: number;
  /** Muscles that had coverage before but have none after — the engine is designed to never allow this; surfaced for transparency. */
  droppedMuscles: Muscle[];
  /** Muscles whose total exposure count changed (informational, not a problem by itself). */
  changedExposures: MuscleExposureChange[];
  equipmentTypesAfter: Equipment[];
  equipmentChangesBefore: number;
  equipmentChangesAfter: number;
  locationChangesBefore: number;
  locationChangesAfter: number;
}

export interface RefreshPreviewResult {
  session: WorkoutSession;
  refreshResult?: RefreshResult;
  reductionResult?: ReductionResult;
  summary: RefreshPreviewSummary;
  /** Present if a requested reduction was impossible without a coverage gap — the original session (unchanged) is what's in `session` in that case. */
  error?: { message: string; gaps: CoverageGapWarning[] };
}

function buildShorterAllocation(session: WorkoutSession): WorkoutAllocation {
  const counts = countMainByGroup(session);
  const allocation: WorkoutAllocation = {};
  for (const group of PROGRAMME_ORDER) {
    const count = counts[group] ?? 0;
    if (count > 1) allocation[group] = count - 1;
  }
  return allocation;
}

function summarizePreview(before: WorkoutSession, after: WorkoutSession): RefreshPreviewSummary {
  const beforeMain = mainExercisesOf(before);
  const afterMain = mainExercisesOf(after);
  const beforeById = new Map(beforeMain.map((pe) => [pe.exercise.id, pe.exercise]));
  const afterById = new Map(afterMain.map((pe) => [pe.exercise.id, pe.exercise]));

  const changedExercises: RefreshPreviewSummary["changedExercises"] = [];
  const removedExercises: RefreshPreviewSummary["removedExercises"] = [];

  // A simple positional diff isn't meaningful here (slots can shift when a
  // group shrinks) — instead: each group's before/after exercise-id sets
  // are compared (ids within a group are always unique, by construction of
  // both engines), so "swapped for a different exercise" and "removed
  // entirely" (reduction) are both visible. Unmatched before/after ids are
  // paired positionally as "changed"; any leftover unmatched-before ids
  // (when the group shrank) are "removed".
  for (const group of PROGRAMME_ORDER) {
    const beforeIds = beforeMain.filter((pe) => pe.exercise.programmeGroup === group).map((pe) => pe.exercise.id);
    const afterIds = afterMain.filter((pe) => pe.exercise.programmeGroup === group).map((pe) => pe.exercise.id);
    const afterIdSet = new Set(afterIds);
    const beforeIdSet = new Set(beforeIds);

    const unmatchedBefore = beforeIds.filter((id) => !afterIdSet.has(id));
    const unmatchedAfter = afterIds.filter((id) => !beforeIdSet.has(id));

    const pairs = Math.min(unmatchedBefore.length, unmatchedAfter.length);
    for (let i = 0; i < pairs; i++) {
      changedExercises.push({ previous: beforeById.get(unmatchedBefore[i]!)!, next: afterById.get(unmatchedAfter[i]!)!, group });
    }
    for (let i = pairs; i < unmatchedBefore.length; i++) {
      removedExercises.push({ exercise: beforeById.get(unmatchedBefore[i]!)!, group });
    }
  }

  const unchangedCount = beforeMain.length - changedExercises.length - removedExercises.length;

  const beforeCoverage = calculateMuscleCoverage(beforeMain.map((pe) => pe.exercise));
  const afterCoverage = calculateMuscleCoverage(afterMain.map((pe) => pe.exercise));
  const droppedMuscles = beforeCoverage.musclesTrained.filter((muscle) => getExposureCount(afterCoverage, muscle) === 0);
  const changedExposures: MuscleExposureChange[] = beforeCoverage.musclesTrained
    .map((muscle) => ({ muscle, before: getExposureCount(beforeCoverage, muscle), after: getExposureCount(afterCoverage, muscle) }))
    .filter((entry) => entry.before !== entry.after);

  const beforeTransitions = countTransitions(beforeMain.map((pe) => pe.exercise));
  const afterTransitions = countTransitions(afterMain.map((pe) => pe.exercise));

  return {
    changedExercises,
    removedExercises,
    unchangedCount,
    droppedMuscles,
    changedExposures,
    equipmentTypesAfter: distinctEquipment(afterMain.map((pe) => pe.exercise)),
    equipmentChangesBefore: beforeTransitions.equipmentChanges,
    equipmentChangesAfter: afterTransitions.equipmentChanges,
    locationChangesBefore: beforeTransitions.locationChanges,
    locationChangesAfter: afterTransitions.locationChanges,
  };
}

/**
 * Builds a preview of what "I'm Bored" would produce, without mutating the
 * current session. Maps the four UI checkboxes onto domain constraints:
 * reduction happens first (fewer slots), then refresh for variety among
 * whatever remains — soft location/equipment preferences apply to both.
 */
export function previewRefresh(session: WorkoutSession, choices: RefreshChoices): RefreshPreviewResult {
  const soft: SoftPreferences = {};
  if (choices.stayNearBench) soft.preferredLocation = "bench";
  if (choices.minimizeEquipmentChanges) soft.minimizeEquipmentChanges = true;

  let working = session;
  let reductionResult: ReductionResult | undefined;
  let refreshResult: RefreshResult | undefined;
  let error: RefreshPreviewResult["error"];

  if (choices.shorter) {
    const allocation = buildShorterAllocation(working);
    if (Object.keys(allocation).length > 0) {
      try {
        reductionResult = reduceExerciseCount(working, allocation, { soft });
        working = reductionResult.session;
      } catch (e) {
        if (e instanceof ReductionError) {
          error = { message: e.message, gaps: e.gaps };
        } else {
          throw e;
        }
      }
    }
  }

  if (!error && choices.changeOnePerGroup) {
    refreshResult = refreshWorkout(working, EXERCISES, { soft });
    working = refreshResult.session;
  }

  const summary = summarizePreview(session, error ? session : working);

  return { session: error ? session : working, refreshResult, reductionResult, summary, error };
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export function computeProgressionForLog(planned: PlannedExercise, log: SetLog): ProgressionRecommendation {
  return recommendProgression({
    exercise: planned.exercise,
    prescribedWeight: planned.prescribedWeight,
    prescribedReps: planned.prescribedReps,
    actualWeight: log.actualWeight,
    actualReps: log.actualReps,
    completed: log.completed,
  });
}

// ---------------------------------------------------------------------------
// Set logging input-shaping
//
// `completed` isn't an optimisation decision — it's a basic derivation from
// the numbers the user just entered (did they hit the prescribed reps/
// duration?), needed because recommendProgression takes it as a raw input
// rather than deriving it itself. Kept here, not in a component, alongside
// the rest of the domain-facing shaping.
// ---------------------------------------------------------------------------

export interface SetLogInput {
  actualWeight?: number;
  actualReps?: number;
  actualDuration?: number;
}

function deriveCompleted(planned: PlannedExercise, input: SetLogInput): boolean {
  if (planned.prescribedReps !== undefined && input.actualReps !== undefined) {
    return input.actualReps >= planned.prescribedReps;
  }
  if (planned.prescribedDuration !== undefined && input.actualDuration !== undefined) {
    return input.actualDuration >= planned.prescribedDuration;
  }
  return true;
}

export function buildSetLog(planned: PlannedExercise, input: SetLogInput): SetLog {
  return {
    exerciseId: planned.exercise.id,
    actualWeight: input.actualWeight,
    actualReps: input.actualReps,
    actualDuration: input.actualDuration,
    completed: deriveCompleted(planned, input),
    loggedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// History / Progress lookups
// ---------------------------------------------------------------------------

/**
 * For each exercise ever logged, the most recent (planned, log) pair —
 * pulling the `PlannedExercise` from whichever historical session snapshot
 * that log belongs to (its prescription may differ from today's if the
 * exercise was swapped in the meantime). A simple most-recent-by-date
 * lookup, not an optimisation decision.
 */
export function getLatestLoggedPerformances(history: CompletedWorkout[]): { planned: PlannedExercise; log: SetLog }[] {
  const latest = new Map<string, { planned: PlannedExercise; log: SetLog }>();
  // `history` is newest-first (the store prepends on completion) — keep the first (=latest) log seen per exercise id.
  for (const workout of history) {
    for (const log of workout.setLogs) {
      if (latest.has(log.exerciseId)) continue;
      const planned = workout.session.mainExercises.find((pe) => pe.exercise.id === log.exerciseId);
      if (planned) latest.set(log.exerciseId, { planned, log });
    }
  }
  return Array.from(latest.values());
}

export { PROGRAMME_ORDER };

"use client";

/**
 * In-memory store for the Classic Strength flow — same pattern as lib/store.ts
 * (Circuit): bookkeeping + calls into lib/strength-service.ts, no optimisation
 * or progression logic here.
 *
 * Persistence: see lib/store.ts's header comment — the same workoutId/
 * snapshot/save-queue/local-fallback pattern applies here identically.
 */

import type { CurrentWeights, StrengthSession } from "@buff-not-bored/domain";
import { countCompletedSets, hasLoggedSet } from "@buff-not-bored/domain";
import { create } from "zustand";
import { persistWorkoutSnapshot } from "./actions/save-workout";
import { clearFallbackSnapshotIfRevision, writeFallbackSnapshot } from "./local-fallback";
import { mergeServerWeights, persistStartingWeight } from "./starting-weight";
import {
  buildStrengthSession,
  logStrengthSet,
  nextStrengthSessionId,
  prescribeSessionWeights,
  resolveStartingWeight,
  STRENGTH_PROGRAMME,
  strengthWorkoutName,
  type StrengthSetLogInput,
} from "./strength-service";
import type { CompletedStrengthWorkout, SaveStatus, StrengthWorkoutSnapshot } from "./types";

export type WorkoutStatus = "idle" | "in_progress" | "completed";
export type { SaveStatus };

/** The subset of domain `WorkoutStatus` a snapshot save ever carries — distinct from the local `WorkoutStatus` above (UI state, includes "idle"). */
type PersistableStatus = "in_progress" | "completed";

interface StrengthAppData {
  workoutId: string;
  /** Which of the programme's sessions this is, e.g. "monday". */
  sessionId: string;
  /** True once you've picked a session yourself, or the rotation moved on in this tab, so the page's suggestion no longer replaces it. */
  sessionChosen: boolean;
  session: StrengthSession;
  /** Your weights, loaded by the page from the server; first-use weights are added here as you log them. */
  currentWeights: CurrentWeights;
  status: WorkoutStatus;
  startedAt?: number;
  completedAt?: number;
  history: CompletedStrengthWorkout[];
  saveStatus: SaveStatus;
  saveError?: string;
  /** Set when a first-use starting weight didn't save. */
  weightSaveError?: string;
}

interface StrengthAppActions {
  applyCurrentWeights: (weights: CurrentWeights) => void;
  /** The session the rotation says is due. Applied only before you start, and only if you haven't picked one. */
  applyNextSession: (sessionId: string) => void;
  /** Picks one of the programme's sessions before starting. */
  chooseSession: (sessionId: string) => void;
  startWorkout: () => void;
  logSet: (exerciseId: string, setNumber: number, input: StrengthSetLogInput) => void;
  completeWorkout: () => void;
  startNewWorkout: () => void;
}

type StrengthAppState = StrengthAppData & StrengthAppActions;

function freshData(currentWeights: CurrentWeights = {}, sessionId = nextStrengthSessionId(undefined)): StrengthAppData {
  return {
    workoutId: crypto.randomUUID(),
    sessionId,
    sessionChosen: false,
    session: buildStrengthSession(sessionId, currentWeights),
    currentWeights,
    status: "idle",
    startedAt: undefined,
    completedAt: undefined,
    history: [],
    saveStatus: "idle",
    saveError: undefined,
    weightSaveError: undefined,
  };
}

/** Exported so tests can reset the store's data fields between cases. */
export function getInitialStrengthState(): StrengthAppData {
  return freshData();
}

function buildSnapshot(state: StrengthAppData, status: PersistableStatus): StrengthWorkoutSnapshot {
  return {
    id: state.workoutId,
    dateIso: new Date().toISOString(),
    workoutName: strengthWorkoutName(state.sessionId),
    workoutType: "classic_strength",
    status,
    session: state.session,
    programmeId: STRENGTH_PROGRAMME.id,
    scheduledWorkoutId: state.sessionId,
  };
}

export const useStrengthStore = create<StrengthAppState>((set, get) => {
  // Serializes network saves for this store so they execute, and settle
  // saveStatus, strictly in the order their triggering actions happened.
  let saveQueue: Promise<void> = Promise.resolve();
  // Monotonically increasing — tags each local fallback write so an older
  // save's success can never delete a newer, not-yet-confirmed write (see
  // lib/local-fallback.ts's doc comment for the exact race this prevents).
  let nextRevision = 0;

  /**
   * Writes the synchronous local fallback immediately, then queues the
   * network save. `saving` is set right away (always safe to re-assert);
   * `saved`/`error` are only ever set from inside a job's own turn in the
   * queue, so a stale job can never overwrite a newer job's result. The
   * fallback is only cleared once ITS OWN revision's save succeeds.
   */
  function persistAndTrack(status: PersistableStatus) {
    const revision = ++nextRevision;
    writeFallbackSnapshot(buildSnapshot(get(), status), revision);
    set({ saveStatus: "saving", saveError: undefined });

    saveQueue = saveQueue.then(async () => {
      const snapshot = buildSnapshot(get(), status);
      try {
        const result = await persistWorkoutSnapshot(snapshot);
        if (result.ok) {
          clearFallbackSnapshotIfRevision(snapshot.id, revision);
          set({ saveStatus: "saved", saveError: undefined });
        } else {
          set({ saveStatus: "error", saveError: result.error });
        }
      } catch (error) {
        set({ saveStatus: "error", saveError: error instanceof Error ? error.message : "Unknown error while saving workout" });
      }
    });
  }

  async function recordStartingWeight(exerciseName: string, exerciseId: string, weight: number) {
    const error = await persistStartingWeight(exerciseName, exerciseId, weight);
    if (error) set({ weightSaveError: error });
  }

  return {
    ...freshData(),

    // Re-prescribes the session you already have (keeping any refresh or swap), never rebuilding it.
    // A workout in progress only gets blank weights filled in (§3.3).
    applyCurrentWeights: (weights) =>
      set((state) => {
        const currentWeights = mergeServerWeights(state.currentWeights, weights);
        return { currentWeights, session: prescribeSessionWeights(state.session, currentWeights, state.status !== "idle") };
      }),

    applyNextSession: (sessionId) =>
      set((state) => {
        if (state.status !== "idle" || state.sessionChosen || state.sessionId === sessionId) return {};
        return { sessionId, session: buildStrengthSession(sessionId, state.currentWeights) };
      }),

    chooseSession: (sessionId) =>
      set((state) => {
        if (state.status !== "idle") return {};
        return { sessionId, sessionChosen: true, session: buildStrengthSession(sessionId, state.currentWeights) };
      }),

    startWorkout: () => {
      set({ status: "in_progress", startedAt: Date.now() });
      persistAndTrack("in_progress");
    },

    logSet: (exerciseId, setNumber, input) => {
      set((state) => ({ session: logStrengthSet(state.session, exerciseId, setNumber, input) }));
      const starting = resolveStartingWeight(get().session, exerciseId, get().currentWeights, input.actualWeight);
      if (starting) {
        set((state) => ({ session: starting.session, currentWeights: { ...state.currentWeights, [exerciseId]: starting.weight } }));
        const name = get().session.exercises.find((se) => se.exercise.id === exerciseId)?.exercise.name ?? exerciseId;
        void recordStartingWeight(name, exerciseId, starting.weight);
      }
      persistAndTrack("in_progress");
    },

    completeWorkout: () => {
      const state = get();
      const { completed, total } = countCompletedSets(state.session);
      const completedAt = Date.now();
      const entry: CompletedStrengthWorkout = {
        id: state.workoutId,
        dateIso: new Date(completedAt).toISOString(),
        workoutName: strengthWorkoutName(state.sessionId),
        workoutType: "classic_strength",
        durationMs: completedAt - (state.startedAt ?? completedAt),
        totalSets: total,
        setsCompleted: completed,
        session: state.session,
      };
      set({ status: "completed", completedAt, history: [entry, ...state.history] });
      persistAndTrack("completed");
    },

    // Deliberately does NOT clear the previous workout's local fallback —
    // an unsynced entry must survive the user moving on, for a future
    // recovery feature. It's only ever removed by its own save succeeding
    // (see persistAndTrack above).
    // The rotation moves on once a set was logged (D-011); otherwise the same session is offered again.
    // Once it has moved on here, a page still holding an older suggestion can't move it back.
    startNewWorkout: () =>
      set((state) => {
        const advanced = hasLoggedSet(state.session);
        const sessionId = advanced ? nextStrengthSessionId(state.sessionId) : state.sessionId;
        return { ...freshData(state.currentWeights, sessionId), sessionChosen: advanced, history: state.history };
      }),
  };
});

"use client";

/**
 * In-memory store for the Classic Strength flow — same pattern as lib/store.ts
 * (Circuit): bookkeeping + calls into lib/strength-service.ts, no optimisation
 * or progression logic here.
 *
 * Persistence: see lib/store.ts's header comment — the same workoutId/
 * snapshot/save-queue/local-fallback pattern applies here identically.
 */

import type { StrengthSession } from "@buff-not-bored/domain";
import { countCompletedSets } from "@buff-not-bored/domain";
import { create } from "zustand";
import { persistWorkoutSnapshot } from "./actions/save-workout";
import { clearFallbackSnapshotIfRevision, writeFallbackSnapshot } from "./local-fallback";
import { getTodayStrengthSession, logStrengthSet, STRENGTH_WORKOUT_NAME, type StrengthSetLogInput } from "./strength-service";
import type { CompletedStrengthWorkout, SaveStatus, StrengthWorkoutSnapshot } from "./types";

export type WorkoutStatus = "idle" | "in_progress" | "completed";
export type { SaveStatus };

/** The subset of domain `WorkoutStatus` a snapshot save ever carries — distinct from the local `WorkoutStatus` above (UI state, includes "idle"). */
type PersistableStatus = "in_progress" | "completed";

interface StrengthAppData {
  workoutId: string;
  session: StrengthSession;
  status: WorkoutStatus;
  startedAt?: number;
  completedAt?: number;
  history: CompletedStrengthWorkout[];
  saveStatus: SaveStatus;
  saveError?: string;
}

interface StrengthAppActions {
  startWorkout: () => void;
  logSet: (exerciseId: string, setNumber: number, input: StrengthSetLogInput) => void;
  completeWorkout: () => void;
  startNewWorkout: () => void;
}

type StrengthAppState = StrengthAppData & StrengthAppActions;

function freshData(): StrengthAppData {
  return {
    workoutId: crypto.randomUUID(),
    session: getTodayStrengthSession(),
    status: "idle",
    startedAt: undefined,
    completedAt: undefined,
    history: [],
    saveStatus: "idle",
    saveError: undefined,
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
    workoutName: STRENGTH_WORKOUT_NAME,
    workoutType: "classic_strength",
    status,
    session: state.session,
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

  return {
    ...freshData(),

    startWorkout: () => {
      set({ status: "in_progress", startedAt: Date.now() });
      persistAndTrack("in_progress");
    },

    logSet: (exerciseId, setNumber, input) => {
      set((state) => ({ session: logStrengthSet(state.session, exerciseId, setNumber, input) }));
      persistAndTrack("in_progress");
    },

    completeWorkout: () => {
      const state = get();
      const { completed, total } = countCompletedSets(state.session);
      const completedAt = Date.now();
      const entry: CompletedStrengthWorkout = {
        id: state.workoutId,
        dateIso: new Date(completedAt).toISOString(),
        workoutName: STRENGTH_WORKOUT_NAME,
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
    startNewWorkout: () => set((state) => ({ ...freshData(), history: state.history })),
  };
});

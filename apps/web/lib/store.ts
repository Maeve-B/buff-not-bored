"use client";

/**
 * The app's single client-side store. Every action here either does
 * trivial state bookkeeping or calls straight into lib/workout-service.ts
 * (which is the only file that talks to @buff-not-bored/domain). No
 * optimisation logic lives here.
 *
 * Persistence: each workout attempt gets one stable `workoutId` (generated
 * here, at `startWorkout`/`startNewWorkout` — never at completion). Every
 * meaningful moment (start, each logged set, completion) fires a
 * snapshot save under that same id via `persistWorkoutSnapshot`
 * (lib/actions/save-workout.ts). Saving never blocks the logging UI —
 * `logSet`/`completeWorkout` update local state synchronously first, then
 * kick off the save as a side effect.
 *
 * Saves for one workout are serialized through a per-store promise-chain
 * queue (`saveQueue`), not fired independently: each queued job builds its
 * snapshot from live state only once it's actually its turn to run, and
 * only updates `saveStatus` after its own network call settles — so an
 * older action's save can never execute, or overwrite saveStatus, after a
 * newer one already has. This is what prevents an in-flight save for an
 * earlier logged set from racing a later one and silently overwriting it
 * in the database.
 *
 * A synchronous localStorage fallback (lib/local-fallback.ts) is written
 * at the same three points, independent of the network queue, so a tab
 * closed before a queued save completes doesn't lose that action from the
 * device too — see that file's doc comment for exactly what this does and
 * doesn't guarantee.
 */

import type { Exercise, ReplacementDecision, WorkoutSession } from "@buff-not-bored/domain";
import { create } from "zustand";
import { persistWorkoutSnapshot } from "./actions/save-workout";
import { clearFallbackSnapshotIfRevision, writeFallbackSnapshot } from "./local-fallback";
import {
  buildSetLog,
  DEFAULT_REFRESH_CHOICES,
  getTodayWorkout,
  previewRefresh,
  swapExercise,
  WORKOUT_NAME,
  type RefreshChoices,
  type RefreshPreviewResult,
  type SetLogInput,
} from "./workout-service";
import type { CircuitWorkoutSnapshot, CompletedWorkout, SaveStatus, SetLog } from "./types";

export type WorkoutStatus = "idle" | "in_progress" | "completed";
export type { SaveStatus };

/** The subset of domain `WorkoutStatus` a snapshot save ever carries — distinct from the local `WorkoutStatus` above (UI state, includes "idle"). */
type PersistableStatus = "in_progress" | "completed";

export interface LastSwap {
  previous: Exercise;
  next: Exercise;
  decision: ReplacementDecision;
}

interface AppData {
  workoutId: string;
  session: WorkoutSession;
  status: WorkoutStatus;
  setLogs: Record<string, SetLog>;
  startedAt?: number;
  completedAt?: number;
  history: CompletedWorkout[];
  refreshChoices: RefreshChoices;
  refreshPreview?: RefreshPreviewResult;
  lastSwap?: LastSwap;
  saveStatus: SaveStatus;
  saveError?: string;
}

interface AppActions {
  startWorkout: () => void;
  logSet: (exerciseId: string, input: SetLogInput) => void;
  swap: (exerciseId: string) => void;
  clearLastSwap: () => void;
  setRefreshChoices: (choices: Partial<RefreshChoices>) => void;
  generateRefreshPreview: () => void;
  acceptRefreshPreview: () => void;
  discardRefreshPreview: () => void;
  completeWorkout: () => void;
  startNewWorkout: () => void;
}

type AppState = AppData & AppActions;

function freshData(): AppData {
  return {
    workoutId: crypto.randomUUID(),
    session: getTodayWorkout(),
    status: "idle",
    setLogs: {},
    startedAt: undefined,
    completedAt: undefined,
    history: [],
    refreshChoices: DEFAULT_REFRESH_CHOICES,
    refreshPreview: undefined,
    lastSwap: undefined,
    saveStatus: "idle",
    saveError: undefined,
  };
}

/** Exported so tests can reset the store's data fields between cases (`useAppStore.setState(getInitialState())`). */
export function getInitialState(): AppData {
  return freshData();
}

function buildSnapshot(state: AppData, status: PersistableStatus): CircuitWorkoutSnapshot {
  return {
    id: state.workoutId,
    dateIso: new Date().toISOString(),
    workoutName: WORKOUT_NAME,
    workoutType: "circuit",
    status,
    session: state.session,
    setLogs: Object.values(state.setLogs),
  };
}

export const useAppStore = create<AppState>((set, get) => {
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

    logSet: (exerciseId, input) => {
      set((state) => {
        const planned = state.session.mainExercises.find((pe) => pe.exercise.id === exerciseId);
        if (!planned) return {};
        const log = buildSetLog(planned, input);
        return { setLogs: { ...state.setLogs, [exerciseId]: log } };
      });
      persistAndTrack("in_progress");
    },

    swap: (exerciseId) =>
      set((state) => {
        const previousPlanned = state.session.mainExercises.find((pe) => pe.exercise.id === exerciseId);
        const { session, decision } = swapExercise(state.session, exerciseId);
        const nextPlanned = session.mainExercises.find((pe) => pe.exercise.id === decision.selectedExerciseId);
        const { [exerciseId]: _dropped, ...restLogs } = state.setLogs;
        return {
          session,
          setLogs: restLogs,
          lastSwap:
            previousPlanned && nextPlanned ? { previous: previousPlanned.exercise, next: nextPlanned.exercise, decision } : undefined,
        };
      }),

    clearLastSwap: () => set({ lastSwap: undefined }),

    setRefreshChoices: (choices) => set((state) => ({ refreshChoices: { ...state.refreshChoices, ...choices } })),

    generateRefreshPreview: () => set((state) => ({ refreshPreview: previewRefresh(state.session, state.refreshChoices) })),

    acceptRefreshPreview: () =>
      set((state) => {
        if (!state.refreshPreview) return {};
        const newIds = new Set(state.refreshPreview.session.mainExercises.map((pe) => pe.exercise.id));
        const setLogs = Object.fromEntries(Object.entries(state.setLogs).filter(([id]) => newIds.has(id)));
        return { session: state.refreshPreview.session, refreshPreview: undefined, setLogs };
      }),

    discardRefreshPreview: () => set({ refreshPreview: undefined }),

    completeWorkout: () => {
      const state = get();
      const mainExercises = state.session.mainExercises.filter((pe) => pe.role === "main");
      const exercisesCompleted = mainExercises.filter((pe) => state.setLogs[pe.exercise.id]?.completed).length;
      const completedAt = Date.now();
      const entry: CompletedWorkout = {
        id: state.workoutId,
        dateIso: new Date(completedAt).toISOString(),
        workoutName: WORKOUT_NAME,
        workoutType: "circuit",
        durationMs: completedAt - (state.startedAt ?? completedAt),
        totalExercises: mainExercises.length,
        exercisesCompleted,
        session: state.session,
        setLogs: Object.values(state.setLogs),
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

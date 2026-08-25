"use client";

/**
 * The app's single client-side store — in-memory only, per Phase 3 scope
 * (no database yet). Every action here either does trivial state bookkeeping
 * or calls straight into lib/workout-service.ts (which is the only file
 * that talks to @buff-not-bored/domain). No optimisation logic lives here.
 */

import type { Exercise, ReplacementDecision, WorkoutSession } from "@buff-not-bored/domain";
import { create } from "zustand";
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
import type { CompletedWorkout, SetLog } from "./types";

export type WorkoutStatus = "idle" | "in_progress" | "completed";

export interface LastSwap {
  previous: Exercise;
  next: Exercise;
  decision: ReplacementDecision;
}

interface AppData {
  session: WorkoutSession;
  status: WorkoutStatus;
  setLogs: Record<string, SetLog>;
  startedAt?: number;
  completedAt?: number;
  history: CompletedWorkout[];
  refreshChoices: RefreshChoices;
  refreshPreview?: RefreshPreviewResult;
  lastSwap?: LastSwap;
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
    session: getTodayWorkout(),
    status: "idle",
    setLogs: {},
    startedAt: undefined,
    completedAt: undefined,
    history: [],
    refreshChoices: DEFAULT_REFRESH_CHOICES,
    refreshPreview: undefined,
    lastSwap: undefined,
  };
}

/** Exported so tests can reset the store's data fields between cases (`useAppStore.setState(getInitialState())`). */
export function getInitialState(): AppData {
  return freshData();
}

export const useAppStore = create<AppState>((set) => ({
  ...freshData(),

  startWorkout: () => set({ status: "in_progress", startedAt: Date.now() }),

  logSet: (exerciseId, input) =>
    set((state) => {
      const planned = state.session.mainExercises.find((pe) => pe.exercise.id === exerciseId);
      if (!planned) return {};
      const log = buildSetLog(planned, input);
      return { setLogs: { ...state.setLogs, [exerciseId]: log } };
    }),

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

  completeWorkout: () =>
    set((state) => {
      const mainExercises = state.session.mainExercises.filter((pe) => pe.role === "main");
      const exercisesCompleted = mainExercises.filter((pe) => state.setLogs[pe.exercise.id]?.completed).length;
      const completedAt = Date.now();
      const entry: CompletedWorkout = {
        id: `workout-${completedAt}`,
        dateIso: new Date(completedAt).toISOString(),
        workoutName: WORKOUT_NAME,
        durationMs: completedAt - (state.startedAt ?? completedAt),
        totalExercises: mainExercises.length,
        exercisesCompleted,
        session: state.session,
        setLogs: Object.values(state.setLogs),
      };
      return { status: "completed", completedAt, history: [entry, ...state.history] };
    }),

  startNewWorkout: () => set((state) => ({ ...freshData(), history: state.history })),
}));

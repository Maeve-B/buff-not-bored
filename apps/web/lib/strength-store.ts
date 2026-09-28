"use client";

/**
 * In-memory store for the Classic Strength flow — same pattern as lib/store.ts
 * (Circuit): bookkeeping + calls into lib/strength-service.ts, no optimisation
 * or progression logic here.
 */

import type { StrengthSession } from "@buff-not-bored/domain";
import { countCompletedSets } from "@buff-not-bored/domain";
import { create } from "zustand";
import { getTodayStrengthSession, logStrengthSet, STRENGTH_WORKOUT_NAME, type StrengthSetLogInput } from "./strength-service";
import type { CompletedStrengthWorkout } from "./types";

export type WorkoutStatus = "idle" | "in_progress" | "completed";

interface StrengthAppData {
  session: StrengthSession;
  status: WorkoutStatus;
  startedAt?: number;
  completedAt?: number;
  history: CompletedStrengthWorkout[];
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
    session: getTodayStrengthSession(),
    status: "idle",
    startedAt: undefined,
    completedAt: undefined,
    history: [],
  };
}

/** Exported so tests can reset the store's data fields between cases. */
export function getInitialStrengthState(): StrengthAppData {
  return freshData();
}

export const useStrengthStore = create<StrengthAppState>((set) => ({
  ...freshData(),

  startWorkout: () => set({ status: "in_progress", startedAt: Date.now() }),

  logSet: (exerciseId, setNumber, input) =>
    set((state) => ({ session: logStrengthSet(state.session, exerciseId, setNumber, input) })),

  completeWorkout: () =>
    set((state) => {
      const { completed, total } = countCompletedSets(state.session);
      const completedAt = Date.now();
      const entry: CompletedStrengthWorkout = {
        id: `strength-${completedAt}`,
        dateIso: new Date(completedAt).toISOString(),
        workoutName: STRENGTH_WORKOUT_NAME,
        workoutType: "classic_strength",
        durationMs: completedAt - (state.startedAt ?? completedAt),
        totalSets: total,
        setsCompleted: completed,
        session: state.session,
      };
      return { status: "completed", completedAt, history: [entry, ...state.history] };
    }),

  startNewWorkout: () => set((state) => ({ ...freshData(), history: state.history })),
}));

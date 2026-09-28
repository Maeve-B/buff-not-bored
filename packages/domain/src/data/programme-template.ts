/**
 * The current normal programme: an explicit, hand-authored selection from
 * the exercise library (data/exercises.ts), per the PROGRAMME MODEL
 * CORRECTION. This is deliberately NOT derived from the library's array
 * order or length — every slot below is a specific choice.
 *
 * PROGRAMME_ALLOCATION is the corresponding configurable target count per
 * programme group (counting only "main" slots; finishers are uncounted).
 * The two are kept as separate values on purpose — see entities/programme.ts
 * for why — but should stay consistent; test/programme.test.ts asserts that
 * with assertTemplateMatchesAllocation.
 */

import type { ProgrammeAllocation, ProgrammeTemplate } from "../entities/programme.js";

export const PROGRAMME_ALLOCATION: ProgrammeAllocation = {
  legs: 5,
  back: 5,
  chest: 3,
  triceps: 3,
  shoulders: 3,
  biceps: 3,
  core: 3,
};

export const PROGRAMME_TEMPLATE: ProgrammeTemplate = {
  slots: [
    // ---- LEGS (5 main + 1 finisher) ----
    { programmeGroup: "legs", exerciseId: "squats", role: "main" },
    { programmeGroup: "legs", exerciseId: "squat-pulse", role: "main" },
    { programmeGroup: "legs", exerciseId: "lunges", role: "main" },
    { programmeGroup: "legs", exerciseId: "sumo-squats", role: "main" },
    { programmeGroup: "legs", exerciseId: "squat-calf-raise", role: "main" },
    { programmeGroup: "legs", exerciseId: "bodyweight-squat-pulses", role: "finisher" },

    // ---- BACK (5 main) ----
    { programmeGroup: "back", exerciseId: "deadlifts", role: "main" },
    { programmeGroup: "back", exerciseId: "bent-over-row", role: "main" },
    { programmeGroup: "back", exerciseId: "single-arm-dumbbell-row", role: "main" },
    { programmeGroup: "back", exerciseId: "good-mornings", role: "main" },
    { programmeGroup: "back", exerciseId: "superman-holds", role: "main" },

    // ---- CHEST (3 main) ----
    { programmeGroup: "chest", exerciseId: "flat-bench-press", role: "main" },
    { programmeGroup: "chest", exerciseId: "bench-flyes", role: "main" },
    { programmeGroup: "chest", exerciseId: "push-ups", role: "main" },

    // ---- TRICEPS (3 main) ----
    { programmeGroup: "triceps", exerciseId: "lying-tricep-extensions", role: "main" },
    { programmeGroup: "triceps", exerciseId: "close-grip-bench-press", role: "main" },
    { programmeGroup: "triceps", exerciseId: "tricep-kickbacks", role: "main" },

    // ---- SHOULDERS (3 main) ----
    { programmeGroup: "shoulders", exerciseId: "overhead-press", role: "main" },
    { programmeGroup: "shoulders", exerciseId: "lateral-raises", role: "main" },
    { programmeGroup: "shoulders", exerciseId: "upright-row", role: "main" },

    // ---- BICEPS (3 main) ----
    { programmeGroup: "biceps", exerciseId: "barbell-curl", role: "main" },
    { programmeGroup: "biceps", exerciseId: "alternating-dumbbell-curl", role: "main" },
    { programmeGroup: "biceps", exerciseId: "hammer-curl", role: "main" },

    // ---- CORE (3 main) ----
    { programmeGroup: "core", exerciseId: "plank", role: "main" },
    { programmeGroup: "core", exerciseId: "russian-twists", role: "main" },
    { programmeGroup: "core", exerciseId: "bicycle-crunches", role: "main" },
  ],
};

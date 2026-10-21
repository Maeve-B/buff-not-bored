/**
 * Preset Programme 1 — Full Body 3× + Pull-Up (spec v2 §10.1), seeded
 * exactly: Maeve's Monday / Wednesday / Friday programme. Pull-up work comes
 * first in every session. Starting loads are not seeded: every weight starts
 * blank and is entered at first use (DECISIONS.md D-003, D-011).
 */

import type { PresetProgramme, PresetSlot } from "../entities/preset-programme.js";

const PULL_UP_WORK: PresetSlot[] = [
  { exerciseId: "assisted-pull-up", sets: 3, reps: { min: 4, max: 8 } },
  { exerciseId: "assisted-dead-hang", sets: 3, seconds: { min: 20, max: 30 } },
];

export const PRESET_PROGRAMME_1: PresetProgramme = {
  id: "preset-programme-1",
  name: "Full Body 3× + Pull-Up",
  goal: "Strength and muscle, with a pull-up, glute and core emphasis.",
  sessions: [
    {
      id: "monday",
      dayLabel: "Monday",
      focus: "Squat and push",
      slots: [
        ...PULL_UP_WORK,
        { exerciseId: "squats", sets: 3, reps: { min: 6, max: 10 } },
        { exerciseId: "flat-db-press", sets: 3, reps: { min: 8, max: 12 } },
        { exerciseId: "seated-cable-row", sets: 3, reps: { min: 8, max: 12 }, supersetGroup: "row-raise" },
        { exerciseId: "lateral-raises", sets: 2, reps: { min: 12, max: 20 }, supersetGroup: "row-raise" },
        { exerciseId: "captains-chair-knee-raise", sets: 2, reps: { min: 8, max: 12 } },
      ],
    },
    {
      id: "wednesday",
      dayLabel: "Wednesday",
      focus: "Deadlift and shoulders",
      slots: [
        ...PULL_UP_WORK,
        { exerciseId: "deadlifts", sets: 3, reps: { min: 5, max: 8 } },
        { exerciseId: "overhead-press", sets: 3, reps: { min: 6, max: 10 } },
        { exerciseId: "lat-pulldown", sets: 3, reps: { min: 8, max: 12 } },
        { exerciseId: "leg-curl", sets: 3, reps: { min: 10, max: 15 } },
        { exerciseId: "cable-woodchop", sets: 2, reps: { min: 10, max: 10 } },
      ],
    },
    {
      id: "friday",
      dayLabel: "Friday",
      focus: "Glutes and legs",
      slots: [
        ...PULL_UP_WORK,
        { exerciseId: "hip-thrust-machine", sets: 3, reps: { min: 8, max: 15 } },
        { exerciseId: "leg-press", sets: 3, reps: { min: 10, max: 15 } },
        { exerciseId: "incline-db-press", sets: 3, reps: { min: 8, max: 12 } },
        { exerciseId: "chest-supported-db-row", sets: 2, reps: { min: 8, max: 12 }, supersetGroup: "row-raise" },
        { exerciseId: "lateral-raises", sets: 2, reps: { min: 12, max: 20 }, supersetGroup: "row-raise" },
        { exerciseId: "farmer-carry", sets: 3, seconds: { min: 30, max: 45 } },
      ],
    },
  ],
};

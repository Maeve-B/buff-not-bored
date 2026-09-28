/**
 * The warm-up sequence, per PRODUCT_SPEC.md §7.
 *
 * These are intentionally not `Exercise` catalog entries — the spec is
 * explicit that warm-up items don't count toward muscle coverage and don't
 * participate in progression, and their names don't map 1:1 onto catalog
 * exercises (e.g. "Bicep Curls" vs. the catalog's specific curl variants).
 */

import type { WarmupPlan } from "../entities/workout-session.js";

export const WARMUP_PLAN: WarmupPlan = {
  steps: [
    { order: 1, name: "Squats" },
    { order: 2, name: "Squat + Upright Row" },
    { order: 3, name: "Bicep Curls" },
    { order: 4, name: "Overhead Press" },
  ],
  targetDuration: { minMinutes: 5, maxMinutes: 6 },
};

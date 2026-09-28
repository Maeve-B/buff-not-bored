/**
 * The cool-down plan, per PRODUCT_SPEC.md §8. Target areas + duration only —
 * cool-down does not participate in workout optimisation.
 */

import type { CooldownPlan } from "../entities/workout-session.js";

export const COOLDOWN_PLAN: CooldownPlan = {
  targetAreas: [
    "quads",
    "hamstrings",
    "chest",
    "lats",
    "shoulders",
    "triceps",
    "biceps",
    "hip flexors",
  ],
  targetDuration: { minMinutes: 3, maxMinutes: 5 },
};

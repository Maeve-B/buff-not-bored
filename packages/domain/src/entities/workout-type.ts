/**
 * WorkoutType: describes HOW a workout is structured/performed — genuinely
 * different session semantics, not a styling variant of one universal shape.
 *
 * Circuit and Classic Strength are the first two; deliberately a plain
 * string union (matching every other closed vocabulary in this codebase —
 * ProgrammeGroup, Equipment, Location, ...) so adding a new type later
 * (supersets, HIIT, EMOM, AMRAP, mobility, conditioning) is a one-line
 * addition here plus a new branch on the `Workout` discriminated union
 * (entities/workout.ts) and a new builder (engine/*.ts) — never a change to
 * exercise selection, muscle coverage, or equipment optimisation, which
 * operate on the exercise library independently of workout type.
 */
export const WORKOUT_TYPES = ["circuit", "classic_strength"] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  circuit: "Circuit",
  classic_strength: "Classic Strength",
};

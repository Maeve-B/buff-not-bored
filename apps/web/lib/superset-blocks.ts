import type { StrengthExercise } from "@buff-not-bored/domain";

/** One exercise on its own, or a superset pair shown together. */
export type StrengthBlock = { kind: "single"; exercise: StrengthExercise } | { kind: "superset"; exercises: StrengthExercise[] };

/** Groups a session's exercises in order, joining neighbours that share a superset group. Pure presentation. */
export function toStrengthBlocks(exercises: StrengthExercise[]): StrengthBlock[] {
  const blocks: StrengthBlock[] = [];
  for (const exercise of exercises) {
    const last = blocks[blocks.length - 1];
    if (exercise.supersetGroup !== undefined && last?.kind === "superset" && last.exercises[0]!.supersetGroup === exercise.supersetGroup) {
      last.exercises.push(exercise);
    } else if (exercise.supersetGroup !== undefined) {
      blocks.push({ kind: "superset", exercises: [exercise] });
    } else {
      blocks.push({ kind: "single", exercise });
    }
  }
  return blocks;
}

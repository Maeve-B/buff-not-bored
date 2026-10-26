"use client";

import { readinessFromLastTime, type StrengthExercise } from "@buff-not-bored/domain";
import Link from "next/link";
import { formatReadiness } from "@/lib/format";
import { useStrengthStore } from "@/lib/strength-store";

/**
 * "Ready to go up" from the last time you did this exercise (§7.4, D-014):
 * a notification only, gone once you've changed the weight. `compact` is
 * the overview's one-liner, linking to the exercise page so you can change
 * the weight before you start; the exercise card's line has no link,
 * because a change made mid-workout only applies from next time (§3.3).
 * Proposed, not designed: plain text (design-first).
 */
export function LastTimeNudge({ strengthExercise, compact = false }: { strengthExercise: StrengthExercise; compact?: boolean }) {
  const last = useStrengthStore((s) => s.lastTime[strengthExercise.exercise.id]);
  const workoutId = useStrengthStore((s) => s.workoutId);
  if (!last || last.workoutId === workoutId) return null;

  const readiness = readinessFromLastTime(strengthExercise, last);
  if (!readiness) return null;
  const { headline, detail } = formatReadiness(strengthExercise, readiness);

  if (compact) {
    // Bodyweight work has no weight to change, so there's nothing to link to.
    if (readiness.incrementOptions.length === 0) return <span className="block text-xs text-slate-600">{headline}</span>;
    return (
      <Link href={`/exercises/${strengthExercise.exercise.id}`} className="block text-xs font-normal text-slate-600 underline underline-offset-2">
        {headline}: change weight
      </Link>
    );
  }
  return (
    <p className="mt-1 text-xs text-slate-600">
      <span className="font-semibold">{headline}.</span> Last time: {detail}
    </p>
  );
}

"use client";

import type { ExerciseWeightHistoryEntry } from "@buff-not-bored/db";
import { lowerIsProgress, toDisplayWeight, type Exercise } from "@buff-not-bored/domain";
import { formatDate, formatWeight } from "@/lib/format";
import { useWeightUnit } from "@/lib/weight-unit";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";

const DELTA = {
  increase: { icon: "↑", className: "text-emerald-600" },
  decrease: { icon: "↓", className: "text-amber-600" },
  unchanged: { icon: "→", className: "text-slate-400" },
} as const;

/** For assisted exercises less assistance is progress, so the colours swap (§9.1); the arrow still shows the direction. */
const ASSISTANCE_DELTA = {
  ...DELTA,
  increase: { ...DELTA.increase, className: DELTA.decrease.className },
  decrease: { ...DELTA.decrease, className: DELTA.increase.className },
} as const;

/** `undefined` for the first entry — there's nothing before it to compare against. */
function deltaFor(current: number, previous: number | undefined): keyof typeof DELTA | undefined {
  if (previous === undefined) return undefined;
  if (current > previous) return "increase";
  if (current < previous) return "decrease";
  return "unchanged";
}

/** Every weight recorded for an exercise, oldest first — merges completed-workout performance with manually-saved capability weights (see lib/actions/exercise-weight-history.ts); purely a display of whatever that merge already produced. */
export function ExerciseWeightHistory({
  exercise,
  history,
}: {
  exercise: Pick<Exercise, "loadDirection">;
  history: ExerciseWeightHistoryEntry[];
}) {
  const unit = useWeightUnit();
  const assisted = lowerIsProgress(exercise);
  const deltas = assisted ? ASSISTANCE_DELTA : DELTA;
  if (history.length === 0) {
    return assisted ? (
      <EmptyState
        title="No assistance history yet"
        description="Complete a workout, or save your assistance above, to see it here."
      />
    ) : (
      <EmptyState
        title="No weight history yet"
        description="Complete a workout, or save a weight above, to see your recorded weights here."
      />
    );
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{assisted ? "Assistance History" : "Weight History"}</h2>
      <div className="flex flex-col gap-2">
        {history.map((entry, index) => {
          // Compare what you see, so two entries that read the same never get an up or down arrow.
          const previous = index > 0 ? toDisplayWeight(history[index - 1]!.weight, unit) : undefined;
          const delta = deltaFor(toDisplayWeight(entry.weight, unit), previous);
          return (
            <div
              key={`${entry.dateIso}-${index}`}
              className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm text-slate-600">{formatDate(entry.dateIso)}</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                {formatWeight(entry.weight, unit)}
                {delta && (
                  <span className={deltas[delta].className} aria-hidden>
                    {deltas[delta].icon}
                  </span>
                )}
                {delta && assisted && delta !== "unchanged" && (
                  <span className="sr-only">{delta === "decrease" ? "less assistance" : "more assistance"}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

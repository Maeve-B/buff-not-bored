import type { ExerciseWeightHistoryEntry } from "@buff-not-bored/db";
import { formatDate } from "@/lib/format";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";

const DELTA = {
  increase: { icon: "↑", className: "text-emerald-600" },
  decrease: { icon: "↓", className: "text-amber-600" },
  unchanged: { icon: "→", className: "text-slate-400" },
} as const;

/** `undefined` for the first entry — there's nothing before it to compare against. */
function deltaFor(current: number, previous: number | undefined): keyof typeof DELTA | undefined {
  if (previous === undefined) return undefined;
  if (current > previous) return "increase";
  if (current < previous) return "decrease";
  return "unchanged";
}

/** Every weight recorded for an exercise, oldest first — merges completed-workout performance with manually-saved capability weights (see lib/actions/exercise-weight-history.ts); purely a display of whatever that merge already produced. */
export function ExerciseWeightHistory({ history }: { history: ExerciseWeightHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <EmptyState
        title="No weight history yet"
        description="Complete a workout, or save a weight above, to see your recorded weights here."
      />
    );
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Weight History</h2>
      <div className="flex flex-col gap-2">
        {history.map((entry, index) => {
          const previous = index > 0 ? history[index - 1]!.weight : undefined;
          const delta = deltaFor(entry.weight, previous);
          return (
            <div
              key={`${entry.dateIso}-${index}`}
              className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm text-slate-600">{formatDate(entry.dateIso)}</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                {entry.weight}kg
                {delta && (
                  <span className={DELTA[delta].className} aria-hidden>
                    {DELTA[delta].icon}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

"use client";

import { WORKOUT_TYPE_LABELS } from "@buff-not-bored/domain";
import { formatDate, formatDurationMinutes } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { toHistoryEntry as toCircuitHistoryEntry } from "@/lib/workout-service";
import { useStrengthStore } from "@/lib/strength-store";
import { toHistoryEntry as toStrengthHistoryEntry } from "@/lib/strength-service";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";

/** Merges completed workouts from every workout type's own store into one chronological list — each store keeps its own richer type; this only reads the shared display projection (lib/types.ts HistoryEntry). */
export function HistoryList() {
  const circuitHistory = useAppStore((s) => s.history);
  const strengthHistory = useStrengthStore((s) => s.history);

  const entries = [...circuitHistory.map(toCircuitHistoryEntry), ...strengthHistory.map(toStrengthHistoryEntry)].sort(
    (a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime(),
  );

  if (entries.length === 0) {
    return <EmptyState title="No workouts yet" description="Complete a workout to see it here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <Card key={entry.id} className="flex items-center justify-between p-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">{entry.workoutName}</p>
              <Badge>{WORKOUT_TYPE_LABELS[entry.workoutType]}</Badge>
            </div>
            <p className="text-xs text-slate-500">{formatDate(entry.dateIso)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">{formatDurationMinutes(entry.durationMs)}</p>
            <p className="text-xs text-slate-500">{entry.completedLabel}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

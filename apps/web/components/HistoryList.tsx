"use client";

import { formatDate, formatDurationMinutes } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";

export function HistoryList() {
  const history = useAppStore((s) => s.history);

  if (history.length === 0) {
    return <EmptyState title="No workouts yet" description="Complete a workout to see it here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {history.map((entry) => (
        <Card key={entry.id} className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-bold text-slate-900">{entry.workoutName}</p>
            <p className="text-xs text-slate-500">{formatDate(entry.dateIso)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">{formatDurationMinutes(entry.durationMs)}</p>
            <p className="text-xs text-slate-500">
              {entry.exercisesCompleted}/{entry.totalExercises} exercises
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

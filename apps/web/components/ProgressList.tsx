"use client";

import { useAppStore } from "@/lib/store";
import { computeProgressionForLog, getLatestLoggedPerformances } from "@/lib/workout-service";
import { ProgressionBadge } from "./ProgressionBadge";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";

export function ProgressList() {
  const history = useAppStore((s) => s.history);
  const performances = getLatestLoggedPerformances(history);

  if (performances.length === 0) {
    return (
      <EmptyState
        title="No progress yet"
        description="Complete a workout and log your sets to see progression recommendations here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {performances.map(({ planned, log }) => {
        const recommendation = computeProgressionForLog(planned, log);
        return (
          <Card key={planned.exercise.id} className="flex items-center justify-between p-4">
            <span className="text-sm font-bold text-slate-900">{planned.exercise.name}</span>
            <ProgressionBadge recommendation={recommendation} prescribedWeight={planned.prescribedWeight} />
          </Card>
        );
      })}
    </div>
  );
}

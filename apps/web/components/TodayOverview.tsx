"use client";

import { useState } from "react";
import { formatDurationRange, formatProgrammeGroup } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { getProgrammeGroupsPresent, WORKOUT_NAME } from "@/lib/workout-service";
import { RefreshModal } from "./RefreshModal";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";

export function TodayOverview() {
  const session = useAppStore((s) => s.session);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const [refreshOpen, setRefreshOpen] = useState(false);

  const groups = getProgrammeGroupsPresent(session);

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-600">Today</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{WORKOUT_NAME}</h1>
        <p className="mt-1 text-slate-500">{formatDurationRange(session.targetSessionDuration)}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {groups.map((group) => (
            <Chip key={group}>{formatProgrammeGroup(group)}</Chip>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" onClick={startWorkout} className="w-full">
            Start Workout
          </Button>
          <Button size="lg" variant="outline" onClick={() => setRefreshOpen(true)} className="w-full">
            ↻ I&apos;m Bored
          </Button>
        </div>
      </Card>

      {refreshOpen && <RefreshModal onClose={() => setRefreshOpen(false)} />}
    </div>
  );
}

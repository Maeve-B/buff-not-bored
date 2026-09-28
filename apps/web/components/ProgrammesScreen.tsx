"use client";

import { getCurrentWeekNumberFor, getTrainingProgrammes, todayIso } from "@/lib/programme-service";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

export function ProgrammesScreen() {
  const programmes = getTrainingProgrammes();
  const today = todayIso();

  return (
    <div className="flex flex-col gap-4">
      {programmes.map((programme) => {
        const weekNumber = getCurrentWeekNumberFor(programme, today);
        const inProgress = weekNumber >= 1 && weekNumber <= programme.totalWeeks;
        const clampedWeek = Math.max(1, Math.min(weekNumber, programme.totalWeeks));

        return (
          <Card key={programme.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{programme.name}</h2>
                {programme.description && <p className="mt-0.5 text-sm text-slate-500">{programme.description}</p>}
              </div>
              <Badge tone={inProgress ? "accent" : "neutral"}>
                {inProgress ? `Week ${clampedWeek} of ${programme.totalWeeks}` : `${programme.totalWeeks} weeks`}
              </Badge>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {programme.weeks.map((week) => (
                <div
                  key={week.weekNumber}
                  className={`rounded-xl px-3 py-2 ${week.weekNumber === weekNumber ? "bg-accent-50" : "bg-slate-50"}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Week {week.weekNumber}</p>
                  <p className="text-sm text-slate-700">{week.workouts.map((w) => `${w.label}: ${w.name}`).join(" · ")}</p>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

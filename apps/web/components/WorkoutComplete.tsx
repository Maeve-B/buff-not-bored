"use client";

import { formatDurationMinutes } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { computeProgressionForLog } from "@/lib/workout-service";
import { ProgressionBadge } from "./ProgressionBadge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

export function WorkoutComplete() {
  const session = useAppStore((s) => s.session);
  const setLogs = useAppStore((s) => s.setLogs);
  const startedAt = useAppStore((s) => s.startedAt);
  const completedAt = useAppStore((s) => s.completedAt);
  const startNewWorkout = useAppStore((s) => s.startNewWorkout);

  const mainExercises = session.mainExercises.filter((pe) => pe.role === "main");
  const totalExercises = mainExercises.length;
  const exercisesCompleted = mainExercises.filter((pe) => setLogs[pe.exercise.id]?.completed).length;
  const durationMs = (completedAt ?? Date.now()) - (startedAt ?? completedAt ?? Date.now());

  const loggedExercises = mainExercises.filter((pe) => setLogs[pe.exercise.id]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Workout Complete</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Nice work 💪</h1>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatDurationMinutes(durationMs)}</p>
            <p className="text-xs text-slate-500">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {exercisesCompleted}/{totalExercises}
            </p>
            <p className="text-xs text-slate-500">Exercises completed</p>
          </div>
        </div>
      </Card>

      {loggedExercises.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Progression recommendations</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {loggedExercises.map((planned) => {
              const log = setLogs[planned.exercise.id]!;
              const recommendation = computeProgressionForLog(planned, log);
              return (
                <li key={planned.exercise.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-800">{planned.exercise.name}</span>
                  <ProgressionBadge recommendation={recommendation} prescribedWeight={planned.prescribedWeight} />
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Button size="lg" className="w-full" onClick={startNewWorkout}>
        Done
      </Button>
    </div>
  );
}

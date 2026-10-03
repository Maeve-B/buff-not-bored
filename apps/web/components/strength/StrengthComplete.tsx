"use client";

import { countCompletedSets } from "@buff-not-bored/domain";
import { formatDurationMinutes } from "@/lib/format";
import { computeProgressionForSet } from "@/lib/strength-service";
import { useStrengthStore } from "@/lib/strength-store";
import { ProgressionBadge } from "../ProgressionBadge";
import { SaveStatusNote } from "../SaveStatusNote";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function StrengthComplete() {
  const session = useStrengthStore((s) => s.session);
  const startedAt = useStrengthStore((s) => s.startedAt);
  const completedAt = useStrengthStore((s) => s.completedAt);
  const startNewWorkout = useStrengthStore((s) => s.startNewWorkout);
  const saveStatus = useStrengthStore((s) => s.saveStatus);
  const saveError = useStrengthStore((s) => s.saveError);

  const { completed, total } = countCompletedSets(session);
  const durationMs = (completedAt ?? Date.now()) - (startedAt ?? completedAt ?? Date.now());

  // One progression recommendation per exercise, from its last logged set.
  const loggedExercises = session.exercises
    .map((se) => ({
      se,
      lastLoggedSet: [...se.sets].reverse().find((set) => set.actualReps !== undefined || set.actualDuration !== undefined),
    }))
    .filter((entry): entry is { se: (typeof session.exercises)[number]; lastLoggedSet: NonNullable<typeof entry.lastLoggedSet> } =>
      Boolean(entry.lastLoggedSet),
    );

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Workout Complete</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Nice work 💪</h1>
        <SaveStatusNote status={saveStatus} error={saveError} />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatDurationMinutes(durationMs)}</p>
            <p className="text-xs text-slate-500">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {completed}/{total}
            </p>
            <p className="text-xs text-slate-500">Sets completed</p>
          </div>
        </div>
      </Card>

      {loggedExercises.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Progression recommendations</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {loggedExercises.map(({ se, lastLoggedSet }) => {
              const recommendation = computeProgressionForSet(se, lastLoggedSet);
              return (
                <li key={se.exercise.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-800">{se.exercise.name}</span>
                  <ProgressionBadge recommendation={recommendation} prescribedWeight={lastLoggedSet.targetWeight} />
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

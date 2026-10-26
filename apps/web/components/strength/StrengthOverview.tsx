"use client";

import { formatSetsAndRange } from "@/lib/format";
import { STRENGTH_PROGRAMME, strengthSessionPlan } from "@/lib/strength-service";
import { useStrengthStore } from "@/lib/strength-store";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { LastTimeNudge } from "./LastTimeNudge";

/**
 * The session due next in the programme, with a picker for any of its
 * sessions (D-011). Proposed, not designed: the picker is part of the
 * design-first set-logging flow.
 */
export function StrengthOverview() {
  const session = useStrengthStore((s) => s.session);
  const sessionId = useStrengthStore((s) => s.sessionId);
  const chooseSession = useStrengthStore((s) => s.chooseSession);
  const startWorkout = useStrengthStore((s) => s.startWorkout);

  const plan = strengthSessionPlan(sessionId);
  const totalSets = session.exercises.reduce((sum, se) => sum + se.sets.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-600">{STRENGTH_PROGRAMME.name}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{plan.dayLabel}</h1>
        <p className="text-lg font-semibold text-slate-700">{plan.focus}</p>
        <p className="mt-1 text-slate-500">
          {session.exercises.length} exercises · {totalSets} sets
        </p>

        <div role="group" aria-label="Choose a session" className="mt-4 grid grid-cols-3 gap-2">
          {STRENGTH_PROGRAMME.sessions.map((option) => {
            const selected = option.id === sessionId;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseSession(option.id)}
                className={`rounded-lg border px-2 py-2 text-sm font-semibold ${
                  selected ? "border-accent-600 bg-accent-50 text-accent-700" : "border-slate-200 text-slate-600 active:bg-slate-100"
                }`}
              >
                {option.dayLabel.slice(0, 3)}
              </button>
            );
          })}
        </div>

        <Button size="lg" onClick={startWorkout} className="mt-6 w-full">
          Start Workout
        </Button>
      </Card>

      <Card className="p-4">
        <ul className="flex flex-col divide-y divide-slate-100">
          {session.exercises.map((se) => (
            <li key={se.exercise.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="font-semibold text-slate-800">
                {se.exercise.name}
                {se.supersetGroup && <span className="ml-2 text-xs font-bold uppercase text-accent-700">superset</span>}
                <LastTimeNudge strengthExercise={se} compact />
              </span>
              <span className="shrink-0 tabular-nums text-slate-500">{formatSetsAndRange(se)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

"use client";

import { assessReadiness, countCompletedSets } from "@buff-not-bored/domain";
import Link from "next/link";
import { formatDurationMinutes, formatReadiness } from "@/lib/format";
import { useStrengthStore } from "@/lib/strength-store";
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

  // One readiness notification per exercise you logged (§7.4, D-014).
  const notifications = session.exercises.flatMap((se) => {
    const readiness = assessReadiness(se);
    return readiness ? [{ se, readiness }] : [];
  });

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

      {/* Proposed, not designed: plain text until the Phase 1 nudge design (design-first). */}
      {notifications.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Progress this session</h2>
          <p className="mt-1 text-xs text-slate-500">Change a weight on its exercise page whenever you choose.</p>
          <ul className="mt-3 flex flex-col gap-3">
            {notifications.map(({ se, readiness }) => {
              const { headline, detail } = formatReadiness(se, readiness);
              return (
                <li key={se.exercise.id} className="flex flex-col">
                  <span className="flex items-baseline justify-between gap-3">
                    <Link href={`/exercises/${se.exercise.id}`} className="text-sm font-semibold text-slate-800 underline-offset-2 hover:underline">
                      {se.exercise.name}
                    </Link>
                    <span className={`text-sm font-semibold ${readiness.kind === "ready" ? "text-emerald-600" : "text-slate-500"}`}>
                      {headline}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500">{detail}</span>
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

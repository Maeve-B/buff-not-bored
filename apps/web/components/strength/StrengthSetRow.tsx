"use client";

import type { StrengthSet } from "@buff-not-bored/domain";
import { useState } from "react";
import { formatTargetVolume } from "@/lib/format";
import { useStrengthStore } from "@/lib/strength-store";

export function StrengthSetRow({ exerciseId, set }: { exerciseId: string; set: StrengthSet }) {
  const logSet = useStrengthStore((s) => s.logSet);
  const isDuration = set.targetDuration !== undefined;
  const hasWeight = set.targetWeight !== undefined;
  const logged = set.actualReps !== undefined || set.actualDuration !== undefined;

  const [weight, setWeight] = useState(set.targetWeight ?? 0);
  const [volume, setVolume] = useState(set.targetReps ?? set.targetDuration ?? 0);

  function handleComplete() {
    logSet(
      exerciseId,
      set.setNumber,
      isDuration ? { actualDuration: volume } : { actualWeight: hasWeight ? weight : undefined, actualReps: volume },
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
        logged ? (set.completed ? "bg-emerald-50" : "bg-amber-50") : "bg-slate-50"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">Set {set.setNumber}</p>
        <p className="text-xs text-slate-500">
          Target: {formatTargetVolume({ prescribedReps: set.targetReps, repsUnit: set.repsUnit, prescribedDuration: set.targetDuration })}
          {hasWeight ? ` @ ${set.targetWeight}kg` : ""}
        </p>
      </div>

      {logged ? (
        <span className={`text-sm font-semibold ${set.completed ? "text-emerald-700" : "text-amber-700"}`}>
          {set.actualWeight !== undefined ? `${set.actualWeight}kg × ` : ""}
          {isDuration ? `${set.actualDuration}s` : `${set.actualReps} reps`}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          {hasWeight && (
            <input
              type="number"
              inputMode="decimal"
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              aria-label={`Set ${set.setNumber} weight`}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums"
            />
          )}
          <input
            type="number"
            inputMode="numeric"
            step={1}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label={`Set ${set.setNumber} ${isDuration ? "duration" : "reps"}`}
            className="w-14 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums"
          />
          <button
            type="button"
            onClick={handleComplete}
            aria-label={`Complete set ${set.setNumber}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-600 font-bold text-white active:bg-accent-700"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  );
}

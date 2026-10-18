"use client";

import { parseEnteredWeight, WEIGHT_STEP_KG } from "@buff-not-bored/domain";
import type { StrengthSet } from "@buff-not-bored/domain";
import { useEffect, useState } from "react";
import { formatTargetVolume } from "@/lib/format";
import { useStrengthStore } from "@/lib/strength-store";

/**
 * One set. `loaded` says whether the exercise takes a weight at all; a
 * loaded set with no target weight is a first use, so its weight box starts
 * empty for you to fill in (spec §10.1). Working skeleton only: this is
 * part of the design-first set-logging screen.
 */
export function StrengthSetRow({ exerciseId, set, loaded }: { exerciseId: string; set: StrengthSet; loaded: boolean }) {
  const logSet = useStrengthStore((s) => s.logSet);
  const isDuration = set.targetDuration !== undefined;
  const hasWeight = loaded && !isDuration;
  const needsWeight = hasWeight && set.targetWeight === undefined;
  const logged = set.actualReps !== undefined || set.actualDuration !== undefined;

  const [weight, setWeight] = useState(set.targetWeight?.toString() ?? "");

  // When a first-use weight fills this set's target, show it — unless you've already typed something here.
  useEffect(() => {
    if (set.targetWeight !== undefined) setWeight((typed) => (typed === "" ? set.targetWeight!.toString() : typed));
  }, [set.targetWeight]);
  const [volume, setVolume] = useState(set.targetReps ?? set.targetDuration ?? 0);

  function handleComplete() {
    logSet(
      exerciseId,
      set.setNumber,
      isDuration
        ? { actualDuration: volume }
        : { actualWeight: hasWeight ? parseEnteredWeight(weight) : undefined, actualReps: volume },
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
          {hasWeight && !needsWeight ? ` @ ${set.targetWeight}kg` : ""}
        </p>
        {needsWeight && !logged && <p className="text-xs font-medium text-accent-700">Enter your weight</p>}
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
              step={WEIGHT_STEP_KG}
              value={weight}
              placeholder="kg"
              onChange={(e) => setWeight(e.target.value)}
              aria-label={`Set ${set.setNumber} weight`}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums"
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

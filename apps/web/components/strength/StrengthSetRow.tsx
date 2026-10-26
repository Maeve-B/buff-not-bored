"use client";

import { displayWeightStep, isLoaded, isSetLogged, parseDisplayedWeight, toDisplayWeight } from "@buff-not-bored/domain";
import type { Exercise, StrengthSet } from "@buff-not-bored/domain";
import { useEffect, useState } from "react";
import { formatLoggedSet, formatWeightInputLabel } from "@/lib/format";
import { useStrengthStore } from "@/lib/strength-store";
import { useWeightUnit } from "@/lib/weight-unit";

/**
 * One set: reps (or seconds) then weight, each with a small label beneath
 * (D-009). A loaded exercise takes a weight (or assistance) whether it's
 * counted in reps or seconds; a loaded set with no target weight is a first
 * use, so its weight box starts empty for you to fill in (spec §10.1).
 * Working skeleton only: this is part of the design-first set-logging screen.
 */
export function StrengthSetRow({ exercise, set }: { exercise: Exercise; set: StrengthSet }) {
  const logSet = useStrengthStore((s) => s.logSet);
  const unit = useWeightUnit();
  const exerciseId = exercise.id;
  const isDuration = set.targetDuration !== undefined;
  const hasWeight = isLoaded(exercise);
  const logged = isSetLogged(set);

  // The weight box shows and takes your unit (S-006); the target itself stays in kg.
  const shownTarget = set.targetWeight !== undefined ? toDisplayWeight(set.targetWeight, unit).toString() : "";
  const [weight, setWeight] = useState(shownTarget);

  // When a first-use weight fills this set's target, show it — unless you've already typed something here.
  useEffect(() => {
    if (shownTarget !== "") setWeight((typed) => (typed === "" ? shownTarget : typed));
  }, [shownTarget]);
  const [volume, setVolume] = useState(set.targetReps ?? set.targetDuration ?? 0);

  const loggedWeight = hasWeight ? parseDisplayedWeight(weight, unit, set.targetWeight) : undefined;

  function handleComplete() {
    logSet(
      exerciseId,
      set.setNumber,
      isDuration ? { actualDuration: volume, actualWeight: loggedWeight } : { actualReps: volume, actualWeight: loggedWeight },
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
        logged ? (set.completed ? "bg-emerald-50" : "bg-amber-50") : "bg-slate-50"
      }`}
    >
      <p className="text-sm font-semibold text-slate-800">Set {set.setNumber}</p>

      {logged ? (
        <span className={`text-sm font-semibold ${set.completed ? "text-emerald-700" : "text-amber-700"}`}>
          {formatLoggedSet(set, unit)}
        </span>
      ) : (
        <div className="flex items-start gap-2">
          <LabelledInput label={isDuration ? "seconds" : set.repsUnit === "per_side" ? "reps / side" : "reps"}>
            <input
              type="number"
              inputMode="numeric"
              step={1}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label={`Set ${set.setNumber} ${isDuration ? "duration" : "reps"}`}
              className="w-14 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums"
            />
          </LabelledInput>
          {hasWeight && (
            <LabelledInput label={formatWeightInputLabel(exercise, unit)}>
              <input
                type="number"
                inputMode="decimal"
                step={displayWeightStep(unit)}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                aria-label={`Set ${set.setNumber} weight`}
                className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums"
              />
            </LabelledInput>
          )}
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

/** An input with its small label underneath. */
function LabelledInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col items-center gap-0.5">
      {children}
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
    </label>
  );
}

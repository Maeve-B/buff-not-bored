"use client";

import { isLoaded, parseEnteredWeight, WEIGHT_STEP_KG, type PlannedExercise } from "@buff-not-bored/domain";
import { useEffect, useState } from "react";
import { formatEquipment, formatLoggedSet, formatTargetVolume, formatTargetWeight, getFormCue } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Stepper } from "./ui/Stepper";

export function ExerciseCard({ planned }: { planned: PlannedExercise }) {
  const exerciseId = planned.exercise.id;
  const log = useAppStore((s) => s.setLogs[exerciseId]);
  const logSet = useAppStore((s) => s.logSet);
  const swap = useAppStore((s) => s.swap);

  const isDuration = planned.prescribedDuration !== undefined;
  const hasWeight = isLoaded(planned.exercise) && !isDuration;
  // A loaded exercise with no prescribed weight is a first use: you type the weight once (spec §10.1).
  // Working skeleton only, as part of the design-first set-logging screen.
  const needsWeight = hasWeight && planned.prescribedWeight === undefined;

  const [weight, setWeight] = useState(planned.prescribedWeight ?? 0);
  const [typedWeight, setTypedWeight] = useState("");
  const [volume, setVolume] = useState(planned.prescribedReps ?? planned.prescribedDuration ?? 0);

  // If this exercise gets swapped for a different one (new id, new defaults), reset the local inputs.
  useEffect(() => {
    setWeight(planned.prescribedWeight ?? 0);
    setTypedWeight("");
    setVolume(planned.prescribedReps ?? planned.prescribedDuration ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  function loggedWeight(): number | undefined {
    if (!hasWeight) return undefined;
    if (!needsWeight) return weight;
    return parseEnteredWeight(typedWeight);
  }

  function handleLogSet() {
    logSet(
      exerciseId,
      isDuration ? { actualDuration: volume } : { actualWeight: loggedWeight(), actualReps: volume },
    );
  }

  const cue = getFormCue(planned.exercise);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{planned.exercise.name}</h3>
            {planned.role === "finisher" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Finisher
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatTargetVolume(planned)} · {formatTargetWeight(planned.exercise, planned.prescribedWeight)} ·{" "}
            {formatEquipment(planned.exercise.equipment)}
          </p>
          {cue && <p className="mt-1 text-xs text-slate-400">{cue}</p>}
        </div>
        <button
          type="button"
          onClick={() => swap(exerciseId)}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 active:bg-slate-100"
        >
          Swap
        </button>
      </div>

      {log ? (
        <div
          className={`mt-4 flex items-center justify-between rounded-xl px-4 py-3 ${
            log.completed ? "bg-emerald-50" : "bg-amber-50"
          }`}
        >
          <span className={`text-sm font-semibold ${log.completed ? "text-emerald-700" : "text-amber-700"}`}>
            {log.completed ? "✓ Logged" : "Logged · below target"}
          </span>
          <span className={`text-sm ${log.completed ? "text-emerald-700" : "text-amber-700"}`}>
            {formatLoggedSet({ ...log, actualWeight: hasWeight ? log.actualWeight : undefined, repsUnit: planned.repsUnit })}
          </span>
        </div>
      ) : (
        <>
          {/* Reps (or seconds) before weight, as everywhere (D-009). */}
          <div className="mt-4 flex flex-wrap items-center justify-around gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
            <Stepper
              label={isDuration ? "Seconds" : "Reps"}
              value={volume}
              step={isDuration ? 5 : 1}
              suffix={isDuration ? "s" : ""}
              onChange={setVolume}
            />
            {hasWeight && !needsWeight && (
              <Stepper
                label="Weight"
                value={weight}
                step={planned.exercise.equipment === "barbell" ? 2.5 : 0.5}
                suffix="kg"
                onChange={setWeight}
              />
            )}
            {needsWeight && (
              <label className="flex flex-col items-center gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weight (kg)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={WEIGHT_STEP_KG}
                  min={0}
                  placeholder="kg"
                  value={typedWeight}
                  onChange={(e) => setTypedWeight(e.target.value)}
                  aria-label={`${planned.exercise.name} weight`}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-center text-lg font-bold tabular-nums"
                />
              </label>
            )}
          </div>
          <Button className="mt-4 w-full" onClick={handleLogSet}>
            Log Set
          </Button>
        </>
      )}
    </Card>
  );
}

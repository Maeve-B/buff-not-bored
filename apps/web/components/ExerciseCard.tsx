"use client";

import type { PlannedExercise } from "@buff-not-bored/domain";
import { useEffect, useState } from "react";
import { formatEquipment, formatTargetVolume, formatTargetWeight, getFormCue } from "@/lib/format";
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
  const hasWeight = planned.prescribedWeight !== undefined;

  const [weight, setWeight] = useState(planned.prescribedWeight ?? 0);
  const [volume, setVolume] = useState(planned.prescribedReps ?? planned.prescribedDuration ?? 0);

  // If this exercise gets swapped for a different one (new id, new defaults), reset the local inputs.
  useEffect(() => {
    setWeight(planned.prescribedWeight ?? 0);
    setVolume(planned.prescribedReps ?? planned.prescribedDuration ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  function handleLogSet() {
    logSet(
      exerciseId,
      isDuration ? { actualDuration: volume } : { actualWeight: hasWeight ? weight : undefined, actualReps: volume },
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
            {formatTargetWeight(planned.exercise, planned.prescribedWeight)} · {formatTargetVolume(planned)} ·{" "}
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
            {hasWeight && log.actualWeight !== undefined ? `${log.actualWeight}kg × ` : ""}
            {isDuration ? `${log.actualDuration}s` : `${log.actualReps} reps`}
          </span>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-around gap-4 border-t border-slate-100 pt-4">
            {hasWeight && (
              <Stepper
                label="Weight"
                value={weight}
                step={planned.exercise.equipment === "barbell" ? 2.5 : 0.5}
                suffix="kg"
                onChange={setWeight}
              />
            )}
            <Stepper
              label={isDuration ? "Seconds" : "Reps"}
              value={volume}
              step={isDuration ? 5 : 1}
              suffix={isDuration ? "s" : ""}
              onChange={setVolume}
            />
          </div>
          <Button className="mt-4 w-full" onClick={handleLogSet}>
            Log Set
          </Button>
        </>
      )}
    </Card>
  );
}

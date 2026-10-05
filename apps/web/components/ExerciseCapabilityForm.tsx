"use client";

import { useState } from "react";
import { REPS_UNITS, WEIGHT_UNITS, type Exercise, type ExerciseCapability, type ExerciseCapabilityInput } from "@buff-not-bored/domain";
import { saveExerciseCapability } from "@/lib/actions/exercise-capability";
import type { SaveStatus } from "@/lib/store";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

/** Parses a numeric input's string value, treating blank as "unset" rather than 0. */
function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function ExerciseCapabilityForm({
  exercise,
  initialCapability,
}: {
  exercise: Exercise;
  initialCapability: ExerciseCapability | undefined;
}) {
  const [weight, setWeight] = useState(initialCapability?.weight?.toString() ?? "");
  const [weightUnit, setWeightUnit] = useState(initialCapability?.weightUnit ?? WEIGHT_UNITS[0]);
  const [reps, setReps] = useState(initialCapability?.reps?.toString() ?? "");
  const [repsUnit, setRepsUnit] = useState(initialCapability?.repsUnit ?? REPS_UNITS[0]);
  const [duration, setDuration] = useState(initialCapability?.duration?.toString() ?? "");
  const [note, setNote] = useState(initialCapability?.note ?? "");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedWeight = parseOptionalNumber(weight);
    const parsedReps = parseOptionalNumber(reps);
    const parsedDuration = parseOptionalNumber(duration);

    const input: ExerciseCapabilityInput = {
      exerciseId: exercise.id,
      weight: parsedWeight,
      weightUnit: parsedWeight !== undefined ? weightUnit : undefined,
      reps: parsedReps,
      repsUnit: parsedReps !== undefined ? repsUnit : undefined,
      duration: parsedDuration,
      source: "manual",
      note: note.trim() === "" ? undefined : note.trim(),
    };

    setStatus("saving");
    setError(undefined);
    const result = await saveExerciseCapability(input);
    if (result.ok) {
      setStatus("saved");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <label className="flex-1 text-sm font-semibold text-slate-700">
            Weight
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="w-28 text-sm font-semibold text-slate-700">
            Unit
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as (typeof WEIGHT_UNITS)[number])}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {WEIGHT_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex-1 text-sm font-semibold text-slate-700">
            Reps
            <input
              type="number"
              inputMode="numeric"
              step="1"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="w-28 text-sm font-semibold text-slate-700">
            Unit
            <select
              value={repsUnit}
              onChange={(e) => setRepsUnit(e.target.value as (typeof REPS_UNITS)[number])}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {REPS_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-sm font-semibold text-slate-700">
          Duration (seconds)
          <input
            type="number"
            inputMode="numeric"
            step="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Note (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save"}
        </Button>
        {status === "saved" && <p className="text-xs font-medium text-emerald-600">Saved</p>}
        {status === "error" && (
          <p className="text-xs font-medium text-red-600">Couldn&apos;t save this capability{error ? `: ${error}` : ""}</p>
        )}
      </form>
    </Card>
  );
}

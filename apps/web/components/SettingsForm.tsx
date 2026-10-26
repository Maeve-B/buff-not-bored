"use client";

import { DISPLAY_UNITS, type DisplayUnit } from "@buff-not-bored/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveWeightUnit } from "@/lib/actions/settings";
import { useWeightUnit } from "@/lib/weight-unit";
import { Card } from "./ui/Card";

const UNIT_LABELS: Record<DisplayUnit, string> = { kg: "Kilograms (kg)", lb: "Pounds (lb)" };

/** The weight unit choice. Saving refreshes the page so every weight on screen follows it. */
export function SettingsForm() {
  const router = useRouter();
  const saved = useWeightUnit();
  // Shows your pick straight away and keeps it while the page refreshes to the new unit.
  const [picked, setPicked] = useState<DisplayUnit | undefined>(undefined);
  const unit = picked ?? saved;
  const [error, setError] = useState<string | undefined>(undefined);
  const saving = picked !== undefined && picked !== saved && !error;

  async function choose(next: DisplayUnit) {
    if (next === unit || saving) return;
    setPicked(next);
    setError(undefined);
    const result = await saveWeightUnit(next);
    if (result.ok) router.refresh();
    else {
      setPicked(undefined);
      setError(result.error);
    }
  }

  return (
    <Card className="p-4">
      <fieldset>
        <legend className="text-sm font-bold uppercase tracking-wide text-slate-500">Units</legend>
        <p className="mt-1 text-xs text-slate-500">Every weight is shown and entered in this unit. Switching never changes what you've saved.</p>
        <div className="mt-3 flex flex-col gap-2">
          {DISPLAY_UNITS.map((option) => (
            <label key={option} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
              <input type="radio" name="weight-unit" value={option} checked={unit === option} disabled={saving} onChange={() => choose(option)} />
              {UNIT_LABELS[option]}
            </label>
          ))}
        </div>
        {saving && <p className="mt-2 text-xs text-slate-400">Saving…</p>}
        {error && <p className="mt-2 text-xs font-medium text-red-600">Couldn&apos;t save: {error}</p>}
      </fieldset>
    </Card>
  );
}

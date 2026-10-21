import type { StrengthExercise } from "@buff-not-bored/domain";
import { formatEquipment, formatRecommendedRest, formatRestPeriod, formatSetsAndRange } from "@/lib/format";
import { Card } from "../ui/Card";
import { StrengthSetRow } from "./StrengthSetRow";

/**
 * One exercise and its sets. Inside a superset the pair shares one rest
 * line (StrengthActiveWorkout), so `showRest` is off there.
 */
export function StrengthExerciseCard({
  strengthExercise,
  showRest = true,
}: {
  strengthExercise: StrengthExercise;
  showRest?: boolean;
}) {
  // Any authored note first (e.g. Squat Pulse's range of motion), else the library's first form cue (§9.1).
  const cue = strengthExercise.exercise.notes ?? strengthExercise.exercise.cues.form[0];
  const rest = strengthExercise.recommendedRest
    ? formatRecommendedRest(strengthExercise.recommendedRest)
    : strengthExercise.restSeconds !== undefined
      ? `Rest ${formatRestPeriod(strengthExercise.restSeconds)}`
      : undefined;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-slate-900">{strengthExercise.exercise.name}</h3>
        {strengthExercise.role === "finisher" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            Finisher
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-slate-500">
        {formatSetsAndRange(strengthExercise)} · {formatEquipment(strengthExercise.exercise.equipment)}
      </p>
      {showRest && rest && <p className="text-xs text-slate-500">{rest}</p>}
      {cue && <p className="mt-1 text-xs text-slate-400">{cue}</p>}

      <div className="mt-3 flex flex-col gap-2">
        {strengthExercise.sets.map((set) => (
          <StrengthSetRow key={set.setNumber} exercise={strengthExercise.exercise} set={set} />
        ))}
      </div>
    </Card>
  );
}

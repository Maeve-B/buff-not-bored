import type { StrengthExercise } from "@buff-not-bored/domain";
import { formatEquipment, formatRestPeriod, getFormCue } from "@/lib/format";
import { Card } from "../ui/Card";
import { StrengthSetRow } from "./StrengthSetRow";

export function StrengthExerciseCard({ strengthExercise }: { strengthExercise: StrengthExercise }) {
  const cue = getFormCue(strengthExercise.exercise);

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
        {formatEquipment(strengthExercise.exercise.equipment)}
        {strengthExercise.restSeconds !== undefined ? ` · Rest ${formatRestPeriod(strengthExercise.restSeconds)}` : ""}
      </p>
      {cue && <p className="mt-1 text-xs text-slate-400">{cue}</p>}

      <div className="mt-3 flex flex-col gap-2">
        {strengthExercise.sets.map((set) => (
          <StrengthSetRow key={set.setNumber} exerciseId={strengthExercise.exercise.id} set={set} />
        ))}
      </div>
    </Card>
  );
}

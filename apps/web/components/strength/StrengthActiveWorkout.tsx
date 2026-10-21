"use client";

import { countCompletedSets, type StrengthExercise, type TargetRange } from "@buff-not-bored/domain";
import { formatRecommendedRest } from "@/lib/format";
import { strengthWorkoutName } from "@/lib/strength-service";
import { useStrengthStore } from "@/lib/strength-store";
import { toStrengthBlocks } from "@/lib/superset-blocks";
import { SaveStatusNote } from "../SaveStatusNote";
import { Button } from "../ui/Button";
import { StrengthExerciseCard } from "./StrengthExerciseCard";

/** A superset's shared rest: the longer recommendation of the pair. */
function pairRest(exercises: StrengthExercise[]): TargetRange | undefined {
  const rests = exercises.flatMap((se) => (se.recommendedRest ? [se.recommendedRest] : []));
  return rests.reduce<TargetRange | undefined>((longest, rest) => (!longest || rest.max > longest.max ? rest : longest), undefined);
}

export function StrengthActiveWorkout() {
  const session = useStrengthStore((s) => s.session);
  const sessionId = useStrengthStore((s) => s.sessionId);
  const completeWorkout = useStrengthStore((s) => s.completeWorkout);
  const saveStatus = useStrengthStore((s) => s.saveStatus);
  const saveError = useStrengthStore((s) => s.saveError);
  const weightSaveError = useStrengthStore((s) => s.weightSaveError);

  const { completed, total } = countCompletedSets(session);
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex flex-col gap-6 pb-28 sm:pb-10">
      <div className="sticky top-[57px] z-[5] -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold text-slate-900">{strengthWorkoutName(sessionId)}</h1>
          <span className="text-sm font-semibold text-slate-500">
            {completed}/{total} sets logged
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-accent-600 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="text-right">
          <SaveStatusNote status={saveStatus} error={saveError} weightError={weightSaveError} />
        </div>
      </div>

      {/* The programme's own order. A superset pair sits in one box. Proposed, not designed (set logging is design-first). */}
      {toStrengthBlocks(session.exercises).map((block) =>
        block.kind === "single" ? (
          <StrengthExerciseCard key={block.exercise.exercise.id} strengthExercise={block.exercise} />
        ) : (
          <section
            key={block.exercises.map((se) => se.exercise.id).join("+")}
            aria-label={`Superset: ${block.exercises.map((se) => se.exercise.name).join(" and ")}`}
            className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-accent-500 p-2"
          >
            <div className="px-2 pt-1">
              <p className="text-xs font-bold uppercase tracking-wide text-accent-700">Superset · alternate sets</p>
              {pairRest(block.exercises) && <p className="text-xs text-slate-500">{formatRecommendedRest(pairRest(block.exercises)!)}, after both</p>}
            </div>
            {block.exercises.map((se) => (
              <StrengthExerciseCard key={se.exercise.id} strengthExercise={se} showRest={false} />
            ))}
          </section>
        ),
      )}

      <div className="fixed inset-x-0 bottom-16 z-10 border-t border-slate-200 bg-white p-3 sm:static sm:border-none sm:bg-transparent sm:p-0">
        <Button size="lg" className="mx-auto block w-full max-w-2xl" onClick={completeWorkout}>
          Finish Workout
        </Button>
      </div>
    </div>
  );
}

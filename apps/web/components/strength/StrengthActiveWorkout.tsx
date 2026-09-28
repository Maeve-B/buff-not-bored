"use client";

import { countCompletedSets, PROGRAMME_ORDER } from "@buff-not-bored/domain";
import { formatProgrammeGroup } from "@/lib/format";
import { STRENGTH_WORKOUT_NAME } from "@/lib/strength-service";
import { useStrengthStore } from "@/lib/strength-store";
import { Button } from "../ui/Button";
import { StrengthExerciseCard } from "./StrengthExerciseCard";

export function StrengthActiveWorkout() {
  const session = useStrengthStore((s) => s.session);
  const completeWorkout = useStrengthStore((s) => s.completeWorkout);

  const { completed, total } = countCompletedSets(session);
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const groups = PROGRAMME_ORDER.filter((group) => session.exercises.some((se) => se.exercise.programmeGroup === group));

  return (
    <div className="flex flex-col gap-6 pb-28 sm:pb-10">
      <div className="sticky top-[57px] z-[5] -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold text-slate-900">{STRENGTH_WORKOUT_NAME}</h1>
          <span className="text-sm font-semibold text-slate-500">
            {completed}/{total} sets logged
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-accent-600 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {groups.map((group) => (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{formatProgrammeGroup(group)}</h2>
          {session.exercises
            .filter((se) => se.exercise.programmeGroup === group)
            .map((se) => (
              <StrengthExerciseCard key={se.exercise.id} strengthExercise={se} />
            ))}
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-16 z-10 border-t border-slate-200 bg-white p-3 sm:static sm:border-none sm:bg-transparent sm:p-0">
        <Button size="lg" className="mx-auto block w-full max-w-2xl" onClick={completeWorkout}>
          Finish Workout
        </Button>
      </div>
    </div>
  );
}

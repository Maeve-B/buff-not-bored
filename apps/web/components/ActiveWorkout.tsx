"use client";

import { formatProgrammeGroup } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { getProgrammeGroupsPresent, WORKOUT_NAME } from "@/lib/workout-service";
import { CooldownCard } from "./CooldownCard";
import { ExerciseCard } from "./ExerciseCard";
import { SwapBanner } from "./SwapBanner";
import { Button } from "./ui/Button";
import { WarmupCard } from "./WarmupCard";

export function ActiveWorkout() {
  const session = useAppStore((s) => s.session);
  const setLogs = useAppStore((s) => s.setLogs);
  const completeWorkout = useAppStore((s) => s.completeWorkout);

  const groups = getProgrammeGroupsPresent(session);
  const mainExercises = session.mainExercises;
  const mainOnly = mainExercises.filter((pe) => pe.role === "main");
  const loggedCount = mainOnly.filter((pe) => setLogs[pe.exercise.id]).length;
  const progressPercent = mainOnly.length === 0 ? 0 : Math.round((loggedCount / mainOnly.length) * 100);

  return (
    <div className="flex flex-col gap-6 pb-28 sm:pb-10">
      <div className="sticky top-[57px] z-[5] -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold text-slate-900">{WORKOUT_NAME}</h1>
          <span className="text-sm font-semibold text-slate-500">
            {loggedCount}/{mainOnly.length} logged
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-accent-600 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <SwapBanner />

      <WarmupCard warmup={session.warmup} />

      {groups.map((group) => (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{formatProgrammeGroup(group)}</h2>
          {mainExercises
            .filter((pe) => pe.exercise.programmeGroup === group)
            .map((pe) => (
              <ExerciseCard key={pe.exercise.id} planned={pe} />
            ))}
        </section>
      ))}

      <CooldownCard cooldown={session.cooldown} />

      <div className="fixed inset-x-0 bottom-16 z-10 border-t border-slate-200 bg-white p-3 sm:static sm:border-none sm:bg-transparent sm:p-0">
        <Button size="lg" className="mx-auto block w-full max-w-2xl" onClick={completeWorkout}>
          Finish Workout
        </Button>
      </div>
    </div>
  );
}

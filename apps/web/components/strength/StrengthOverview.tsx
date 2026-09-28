"use client";

import { PROGRAMME_ORDER } from "@buff-not-bored/domain";
import { formatProgrammeGroup } from "@/lib/format";
import { STRENGTH_WORKOUT_NAME } from "@/lib/strength-service";
import { useStrengthStore } from "@/lib/strength-store";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";

export function StrengthOverview() {
  const session = useStrengthStore((s) => s.session);
  const startWorkout = useStrengthStore((s) => s.startWorkout);

  const groups = PROGRAMME_ORDER.filter((group) => session.exercises.some((se) => se.exercise.programmeGroup === group));
  const totalSets = session.exercises.reduce((sum, se) => sum + se.sets.length, 0);

  return (
    <Card className="p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent-600">Classic Strength</p>
      <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{STRENGTH_WORKOUT_NAME}</h1>
      <p className="mt-1 text-slate-500">
        {session.exercises.length} exercises · {totalSets} sets
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {groups.map((group) => (
          <Chip key={group}>{formatProgrammeGroup(group)}</Chip>
        ))}
      </div>

      <Button size="lg" onClick={startWorkout} className="mt-6 w-full">
        Start Workout
      </Button>
    </Card>
  );
}

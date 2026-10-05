import Link from "next/link";
import { EXERCISES, PROGRAMME_GROUPS } from "@buff-not-bored/domain";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default function ExercisesPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Exercises" subtitle="View and edit your current working ability" />
      <div className="flex flex-col gap-6">
        {PROGRAMME_GROUPS.map((group) => {
          const exercises = EXERCISES.filter((exercise) => exercise.programmeGroup === group);
          if (exercises.length === 0) return null;
          return (
            <div key={group}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{group}</h2>
              <div className="flex flex-col gap-2">
                {exercises.map((exercise) => (
                  <Link key={exercise.id} href={`/exercises/${exercise.id}`}>
                    <Card className="flex items-center justify-between p-4 transition-colors hover:border-accent-300">
                      <span className="font-semibold text-slate-900">{exercise.name}</span>
                      <span aria-hidden className="text-slate-400">
                        ›
                      </span>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

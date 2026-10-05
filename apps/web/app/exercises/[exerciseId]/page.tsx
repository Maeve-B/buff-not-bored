import { notFound } from "next/navigation";
import { EXERCISES } from "@buff-not-bored/domain";
import { loadExerciseCapability } from "@/lib/actions/exercise-capability";
import { ExerciseCapabilityForm } from "@/components/ExerciseCapabilityForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function ExerciseCapabilityPage({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = await params;
  const exercise = EXERCISES.find((candidate) => candidate.id === exerciseId);
  if (!exercise) notFound();

  const capability = await loadExerciseCapability(exerciseId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={exercise.name} subtitle="Your current working ability" />
      <ExerciseCapabilityForm exercise={exercise} initialCapability={capability} />
    </div>
  );
}

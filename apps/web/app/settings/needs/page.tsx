import { EXERCISES } from "@buff-not-bored/domain";
import { NeedsProfileForm } from "@/components/NeedsProfileForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadNeedsProfile } from "@/lib/actions/needs-profile";

// Your saved answers are read on every visit.
export const dynamic = "force-dynamic";

export default async function NeedsPage() {
  const profile = await loadNeedsProfile();
  const exercises = EXERCISES.map((exercise) => ({ id: exercise.id, name: exercise.name }));
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Your training needs" subtitle="What your programme will be built around" />
      <NeedsProfileForm initial={profile} exercises={exercises} />
    </div>
  );
}

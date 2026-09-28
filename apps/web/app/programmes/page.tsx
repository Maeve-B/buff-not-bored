import { ProgrammesScreen } from "@/components/ProgrammesScreen";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ProgrammesPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Programmes" subtitle="Multi-week training plans" />
      <ProgrammesScreen />
    </div>
  );
}

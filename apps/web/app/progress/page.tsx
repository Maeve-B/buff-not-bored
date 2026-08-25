import { ProgressList } from "@/components/ProgressList";

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-slate-900">Progress</h1>
      <ProgressList />
    </div>
  );
}

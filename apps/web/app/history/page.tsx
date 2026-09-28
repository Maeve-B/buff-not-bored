import { HistoryList } from "@/components/HistoryList";

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-slate-900">History</h1>
      <HistoryList />
    </div>
  );
}

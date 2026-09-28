export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

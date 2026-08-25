import type { WarmupPlan } from "@buff-not-bored/domain";
import { formatDurationRange } from "@/lib/format";
import { Card } from "./ui/Card";

export function WarmupCard({ warmup }: { warmup: WarmupPlan }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Warm-up</h2>
        <span className="text-xs text-slate-400">{formatDurationRange(warmup.targetDuration)}</span>
      </div>
      <ol className="mt-2 flex flex-wrap gap-2">
        {warmup.steps.map((step) => (
          <li key={step.order} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            {step.order}. {step.name}
          </li>
        ))}
      </ol>
    </Card>
  );
}

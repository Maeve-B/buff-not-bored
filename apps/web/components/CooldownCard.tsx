import type { CooldownPlan } from "@buff-not-bored/domain";
import { formatDurationRange } from "@/lib/format";
import { Card } from "./ui/Card";

export function CooldownCard({ cooldown }: { cooldown: CooldownPlan }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Cool-down</h2>
        <span className="text-xs text-slate-400">{formatDurationRange(cooldown.targetDuration)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {cooldown.targetAreas.map((area) => (
          <span key={area} className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize text-slate-700">
            {area}
          </span>
        ))}
      </div>
    </Card>
  );
}

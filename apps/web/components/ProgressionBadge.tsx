import type { ProgressionRecommendation } from "@buff-not-bored/domain";

const ICONS: Record<ProgressionRecommendation["type"], string> = {
  increase: "↑",
  maintain: "→",
  reduce: "↓",
  insufficient_data: "•",
};

const COLORS: Record<ProgressionRecommendation["type"], string> = {
  increase: "text-emerald-600",
  maintain: "text-slate-500",
  reduce: "text-amber-600",
  insufficient_data: "text-slate-400",
};

const LABELS: Record<ProgressionRecommendation["type"], string> = {
  increase: "Recommended progression",
  maintain: "Maintain",
  reduce: "Reduce",
  insufficient_data: "No data yet",
};

/** Renders a domain ProgressionRecommendation — this component only displays what the progression engine already decided. */
export function ProgressionBadge({
  recommendation,
  prescribedWeight,
}: {
  recommendation: ProgressionRecommendation;
  prescribedWeight?: number;
}) {
  const { type, suggestedWeight } = recommendation;
  return (
    <span className={`flex flex-col items-end text-sm font-semibold ${COLORS[type]}`}>
      {prescribedWeight !== undefined && suggestedWeight !== undefined && (
        <span className="text-xs font-normal text-slate-500">
          {prescribedWeight}kg → {suggestedWeight}kg
        </span>
      )}
      <span>
        {ICONS[type]} {LABELS[type]}
      </span>
    </span>
  );
}

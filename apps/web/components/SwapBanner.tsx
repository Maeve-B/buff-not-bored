"use client";

import { useAppStore } from "@/lib/store";

/** Shows what a swap actually changed, per the "enough information to understand what changed" requirement — not just a silently-updated card. */
export function SwapBanner() {
  const lastSwap = useAppStore((s) => s.lastSwap);
  const clearLastSwap = useAppStore((s) => s.clearLastSwap);

  if (!lastSwap) return null;

  const changed = lastSwap.previous.id !== lastSwap.next.id;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-800">
      <span>
        {changed ? (
          <>
            Swapped <span className="font-semibold line-through">{lastSwap.previous.name}</span> →{" "}
            <span className="font-semibold">{lastSwap.next.name}</span>
          </>
        ) : (
          <>No valid replacement for {lastSwap.previous.name} — kept as-is.</>
        )}
      </span>
      <button type="button" onClick={clearLastSwap} aria-label="Dismiss" className="shrink-0 text-lg text-accent-500">
        ✕
      </button>
    </div>
  );
}

"use client";

function decimalsOf(value: number): number {
  return (value.toString().split(".")[1] ?? "").length;
}

/** Rounds away floating-point noise, keeping as many decimals as the value or the step has (20.25 + 2.5 stays 22.75). */
function roundTo(value: number, current: number, step: number): number {
  return Number(value.toFixed(Math.max(decimalsOf(current), decimalsOf(step))));
}

interface StepperProps {
  label: string;
  value: number;
  step?: number;
  min?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, step = 1, min = 0, suffix = "", onChange }: StepperProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 active:bg-slate-200"
          onClick={() => onChange(Math.max(min, roundTo(value - step, value, step)))}
        >
          −
        </button>
        <span className="min-w-[4.5rem] text-center text-2xl font-bold tabular-nums text-slate-900">
          {value}
          {suffix}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 active:bg-slate-200"
          onClick={() => onChange(roundTo(value + step, value, step))}
        >
          +
        </button>
      </div>
    </div>
  );
}

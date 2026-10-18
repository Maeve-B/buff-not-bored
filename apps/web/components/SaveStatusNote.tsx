import type { SaveStatus } from "@/lib/store";

/** Save-status indicator (plus any first-use weight that failed to save) for a completion screen — shared by Circuit and Classic Strength so a failed save is never silently indistinguishable from a successful one. */
export function SaveStatusNote({ status, error, weightError }: { status: SaveStatus; error?: string; weightError?: string }) {
  return (
    <>
      <WorkoutSaveStatus status={status} error={error} />
      {weightError && <p className="mt-1 text-xs font-medium text-red-600">{weightError}</p>}
    </>
  );
}

function WorkoutSaveStatus({ status, error }: { status: SaveStatus; error?: string }) {
  if (status === "saving") {
    return <p className="mt-2 text-xs font-medium text-slate-400">Saving…</p>;
  }
  if (status === "saved") {
    return <p className="mt-2 text-xs font-medium text-emerald-600">Saved</p>;
  }
  if (status === "error") {
    return <p className="mt-2 text-xs font-medium text-red-600">Couldn&apos;t save this workout{error ? `: ${error}` : ""}</p>;
  }
  return null;
}

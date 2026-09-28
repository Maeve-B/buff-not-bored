"use client";

import type { RefreshPreviewResult } from "@/lib/workout-service";
import { useAppStore } from "@/lib/store";
import { formatProgrammeGroup } from "@/lib/format";
import { Button } from "./ui/Button";

export function RefreshModal({ onClose }: { onClose: () => void }) {
  const choices = useAppStore((s) => s.refreshChoices);
  const setChoices = useAppStore((s) => s.setRefreshChoices);
  const generatePreview = useAppStore((s) => s.generateRefreshPreview);
  const acceptPreview = useAppStore((s) => s.acceptRefreshPreview);
  const discardPreview = useAppStore((s) => s.discardRefreshPreview);
  const preview = useAppStore((s) => s.refreshPreview);

  function handleKeepCurrent() {
    discardPreview();
    onClose();
  }

  function handleUseThis() {
    acceptPreview();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/40 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="I'm Bored"
    >
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">↻ I&apos;m Bored</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {!preview ? (
          <>
            <p className="mt-1 text-sm text-slate-500">Choose how you&apos;d like today&apos;s workout refreshed.</p>
            <div className="mt-4 flex flex-col gap-3">
              <CheckboxRow
                label="Change one exercise from each group"
                checked={choices.changeOnePerGroup}
                onChange={(v) => setChoices({ changeOnePerGroup: v })}
              />
              <CheckboxRow label="Make workout shorter" checked={choices.shorter} onChange={(v) => setChoices({ shorter: v })} />
              <CheckboxRow
                label="Stay near bench"
                checked={choices.stayNearBench}
                onChange={(v) => setChoices({ stayNearBench: v })}
              />
              <CheckboxRow
                label="Minimise equipment changes"
                checked={choices.minimizeEquipmentChanges}
                onChange={(v) => setChoices({ minimizeEquipmentChanges: v })}
              />
            </div>
            <Button size="lg" className="mt-6 w-full" onClick={generatePreview}>
              Preview Changes
            </Button>
          </>
        ) : (
          <RefreshPreviewView preview={preview} onKeepCurrent={handleKeepCurrent} onUseThis={handleUseThis} />
        )}
      </div>
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 active:bg-slate-50">
      <input
        type="checkbox"
        className="h-5 w-5 accent-accent-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm font-medium text-slate-800">{label}</span>
    </label>
  );
}

function RefreshPreviewView({
  preview,
  onKeepCurrent,
  onUseThis,
}: {
  preview: RefreshPreviewResult;
  onKeepCurrent: () => void;
  onUseThis: () => void;
}) {
  if (preview.error) {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{preview.error.message}</p>
        <Button size="lg" variant="outline" className="w-full" onClick={onKeepCurrent}>
          Back
        </Button>
      </div>
    );
  }

  const { summary } = preview;
  const hasChanges = summary.changedExercises.length > 0 || summary.removedExercises.length > 0;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {!hasChanges && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          No changes were possible with these options — everything eligible is already in your session.
        </p>
      )}

      {summary.changedExercises.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Changed</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {summary.changedExercises.map((change) => (
              <li key={change.previous.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {formatProgrammeGroup(change.group)}
                </span>
                <div>
                  <span className="text-slate-400 line-through">{change.previous.name}</span>{" "}
                  <span className="font-semibold text-slate-900">→ {change.next.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.removedExercises.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Removed</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {summary.removedExercises.map((removed) => (
              <li key={removed.exercise.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {removed.exercise.name}{" "}
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  ({formatProgrammeGroup(removed.group)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {summary.droppedMuscles.length === 0
          ? "✓ Muscle coverage maintained"
          : `⚠ Coverage dropped for: ${summary.droppedMuscles.join(", ")}`}
      </div>

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Equipment changes: {summary.equipmentChangesBefore} → {summary.equipmentChangesAfter} · Location changes:{" "}
        {summary.locationChangesBefore} → {summary.locationChangesAfter}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" variant="outline" className="w-full" onClick={onKeepCurrent}>
          Keep Current
        </Button>
        <Button size="lg" className="w-full" onClick={onUseThis}>
          Use This Workout
        </Button>
      </div>
    </div>
  );
}

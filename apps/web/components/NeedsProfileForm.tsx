"use client";

/**
 * Your training needs (spec §6.1, S-008). Proposed, not designed: this is a
 * plain working skeleton for the design-first onboarding screens. Every
 * check is the domain's (checkNeedsProfile), shown next to its answer.
 */

import {
  checkNeedsProfile,
  deriveTrainingStatus,
  displayWeightStep,
  EMPHASES,
  GYM_EQUIPMENT,
  JOINT_STRESS_TAGS,
  MAX_DAYS_PER_WEEK,
  MIN_DAYS_PER_WEEK,
  NEEDS_GOALS,
  parseDisplayedWeight,
  TECHNIQUE_CONFIDENCE,
  toDisplayWeight,
  TRAINING_DURATIONS,
  TRAINING_KINDS,
  type Emphasis,
  type GymEquipment,
  type JointStressTag,
  type NeedsProfile,
  type NeedsProfileIssue,
  type SavedNeedsProfile,
  type Weekday,
} from "@buff-not-bored/domain";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { saveNeedsProfile } from "@/lib/actions/needs-profile";
import { formatDate } from "@/lib/format";
import {
  DURATION_LABELS,
  EMPHASIS_LABELS,
  EQUIPMENT_LABELS,
  GOAL_LABELS,
  KIND_LABELS,
  LIMITATION_LABELS,
  STATUS_LABELS,
  TECHNIQUE_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/needs-labels";
import { useWeightUnit } from "@/lib/weight-unit";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

/** The answers as the form holds them: blank until chosen. */
type Draft = Omit<NeedsProfile, "goal" | "trainingDuration" | "trainingKind" | "techniqueConfidence" | "heaviestDumbbellKg" | "sessionMinutes"> &
  Partial<Pick<NeedsProfile, "goal" | "trainingDuration" | "trainingKind" | "techniqueConfidence">> & {
    heaviestDumbbellText: string;
    sessionMinutesText: string;
  };

const DAYS = Array.from({ length: MAX_DAYS_PER_WEEK - MIN_DAYS_PER_WEEK + 1 }, (_, i) => MIN_DAYS_PER_WEEK + i);

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function NeedsProfileForm({
  initial,
  exercises,
}: {
  initial: SavedNeedsProfile | undefined;
  exercises: { id: string; name: string }[];
}) {
  const router = useRouter();
  const unit = useWeightUnit();
  const [draft, setDraft] = useState<Draft>(() => ({
    goal: initial?.goal,
    emphasis: initial?.emphasis,
    trainingDuration: initial?.trainingDuration,
    trainingKind: initial?.trainingKind,
    techniqueConfidence: initial?.techniqueConfidence,
    daysPerWeek: initial?.daysPerWeek ?? 3,
    preferredDays: initial?.preferredDays ?? [],
    sessionMinutesText: String(initial?.sessionMinutes ?? 60),
    equipment: initial?.equipment ?? [],
    heaviestDumbbellText: initial?.heaviestDumbbellKg !== undefined ? String(toDisplayWeight(initial.heaviestDumbbellKg, unit)) : "",
    limitations: initial?.limitations ?? [],
    limitationNote: initial?.limitationNote,
    avoidExerciseIds: initial?.avoidExerciseIds ?? [],
    favouriteExerciseIds: initial?.favouriteExerciseIds ?? [],
    likesDislikes: initial?.likesDislikes,
    source: "form",
  }));
  const [issues, setIssues] = useState<NeedsProfileIssue[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const exerciseIds = useMemo(() => new Set(exercises.map((e) => e.id)), [exercises]);

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    if (status === "saved") setStatus("idle");
  };
  const experience =
    draft.trainingDuration && draft.trainingKind && draft.techniqueConfidence
      ? deriveTrainingStatus({ trainingDuration: draft.trainingDuration, trainingKind: draft.trainingKind, techniqueConfidence: draft.techniqueConfidence })
      : undefined;
  const issuesFor = (...fields: (keyof NeedsProfile)[]) => issues.filter((issue) => fields.includes(issue.field));

  /** The draft as a profile, plus any problems the domain finds (missing choices included). */
  function toProfile(): { profile?: NeedsProfile; problems: NeedsProfileIssue[] } {
    const missing: NeedsProfileIssue[] = [];
    if (!draft.goal) missing.push({ field: "goal", message: "Choose a goal." });
    if (!draft.trainingDuration) missing.push({ field: "trainingDuration", message: "Say how long you've trained regularly." });
    if (!draft.trainingKind) missing.push({ field: "trainingKind", message: "Say what kind of training it was." });
    if (!draft.techniqueConfidence) missing.push({ field: "techniqueConfidence", message: "Say how confident your technique is." });
    const dumbbellText = draft.equipment.includes("dumbbells") ? draft.heaviestDumbbellText : "";
    const heaviestDumbbellKg = dumbbellText.trim() === "" ? undefined : parseDisplayedWeight(dumbbellText, unit, initial?.heaviestDumbbellKg);
    if (dumbbellText.trim() !== "" && heaviestDumbbellKg === undefined) {
      missing.push({ field: "heaviestDumbbellKg", message: `Enter your heaviest dumbbell as a number of ${unit}, or leave it blank.` });
    }
    const sessionMinutes = draft.sessionMinutesText.trim() === "" ? Number.NaN : Number(draft.sessionMinutesText);
    const { heaviestDumbbellText: _dumbbell, sessionMinutesText: _minutes, ...rest } = draft;
    // Unanswered choices get stand-ins only so every other problem shows at the same time.
    const profile: NeedsProfile = {
      ...rest,
      goal: draft.goal ?? "strength",
      trainingDuration: draft.trainingDuration ?? "under_2_months",
      trainingKind: draft.trainingKind ?? "free_weights",
      techniqueConfidence: draft.techniqueConfidence ?? "some",
      sessionMinutes,
      heaviestDumbbellKg,
      limitationNote: draft.limitationNote?.trim() || undefined,
      likesDislikes: draft.likesDislikes?.trim() || undefined,
    };
    const found = checkNeedsProfile(profile, exerciseIds).filter((issue) => !missing.some((m) => m.field === issue.field));
    const problems = [...missing, ...found];
    return { profile: problems.length === 0 ? profile : undefined, problems };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { profile, problems } = toProfile();
    setIssues(problems);
    setError(undefined);
    if (!profile || problems.length > 0) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    const result = await saveNeedsProfile(profile);
    if (result.ok) {
      setStatus("saved");
      router.refresh();
    } else if ("issues" in result) {
      setIssues(result.issues);
      setStatus("error");
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Section title="Goal" issues={issuesFor("goal", "emphasis")}>
        <Choices name="goal" options={NEEDS_GOALS} labels={GOAL_LABELS} value={draft.goal} onChange={(goal) => update({ goal })} />
        <p className="mt-3 text-sm font-semibold text-slate-700">Emphasis (optional)</p>
        <Choices<Emphasis | "none">
          name="emphasis"
          options={["none", ...EMPHASES]}
          labels={{ none: "None", ...EMPHASIS_LABELS }}
          value={draft.emphasis ?? "none"}
          onChange={(value) => update({ emphasis: value === "none" ? undefined : value })}
        />
      </Section>

      <Section title="Experience" issues={issuesFor("trainingDuration", "trainingKind", "techniqueConfidence")}>
        <p className="text-sm font-semibold text-slate-700">How long have you trained regularly?</p>
        <Choices name="duration" options={TRAINING_DURATIONS} labels={DURATION_LABELS} value={draft.trainingDuration} onChange={(trainingDuration) => update({ trainingDuration })} />
        <p className="mt-3 text-sm font-semibold text-slate-700">What kind of training?</p>
        <Choices name="kind" options={TRAINING_KINDS} labels={KIND_LABELS} value={draft.trainingKind} onChange={(trainingKind) => update({ trainingKind })} />
        <p className="mt-3 text-sm font-semibold text-slate-700">How confident is your technique on the main lifts?</p>
        <Choices name="technique" options={TECHNIQUE_CONFIDENCE} labels={TECHNIQUE_LABELS} value={draft.techniqueConfidence} onChange={(techniqueConfidence) => update({ techniqueConfidence })} />
        <p className="mt-3 text-sm text-slate-600" aria-live="polite">
          Your experience level: <span className="font-semibold">{experience ? STATUS_LABELS[experience] : "answer the three questions"}</span>
        </p>
      </Section>

      <Section title="Schedule" issues={issuesFor("daysPerWeek", "preferredDays", "sessionMinutes")}>
        <p className="text-sm font-semibold text-slate-700">Days a week</p>
        <Choices name="days" options={DAYS} labels={Object.fromEntries(DAYS.map((d) => [d, `${d}`]))} value={draft.daysPerWeek} onChange={(daysPerWeek) => update({ daysPerWeek })} />
        <p className="mt-3 text-sm font-semibold text-slate-700">Preferred days (optional, pick {draft.daysPerWeek})</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, i) => {
            const day = (i + 1) as Weekday;
            return (
              <Check key={label} label={label} checked={draft.preferredDays.includes(day)} onChange={() => update({ preferredDays: toggle(draft.preferredDays, day).sort((a, b) => a - b) })} />
            );
          })}
        </div>
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Session length (minutes)
          <input
            type="number"
            inputMode="numeric"
            value={draft.sessionMinutesText}
            onChange={(e) => update({ sessionMinutesText: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </Section>

      <Section title="Equipment" issues={issuesFor("equipment", "heaviestDumbbellKg")}>
        <div className="flex flex-col gap-1">
          {GYM_EQUIPMENT.map((item) => (
            <Check key={item} label={EQUIPMENT_LABELS[item]} checked={draft.equipment.includes(item)} onChange={() => update({ equipment: toggle<GymEquipment>(draft.equipment, item) })} />
          ))}
        </div>
        {draft.equipment.includes("dumbbells") && (
          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Heaviest dumbbell ({unit}, optional)
            <input
              type="number"
              inputMode="decimal"
              step={displayWeightStep(unit)}
              value={draft.heaviestDumbbellText}
              onChange={(e) => update({ heaviestDumbbellText: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        )}
      </Section>

      <Section title="Limitations" issues={issuesFor("limitations", "limitationNote")}>
        <div className="flex flex-wrap gap-2">
          {JOINT_STRESS_TAGS.map((tag) => (
            <Check key={tag} label={LIMITATION_LABELS[tag]} checked={draft.limitations.includes(tag)} onChange={() => update({ limitations: toggle<JointStressTag>(draft.limitations, tag) })} />
          ))}
        </div>
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Anything else to know? (optional)
          <textarea
            rows={2}
            value={draft.limitationNote ?? ""}
            onChange={(e) => update({ limitationNote: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </Section>

      <Section title="Exercises you like and avoid" issues={issuesFor("avoidExerciseIds", "favouriteExerciseIds", "likesDislikes", "source")}>
        <ExercisePicker label="Avoid" exercises={exercises} selected={draft.avoidExerciseIds} onChange={(avoidExerciseIds) => update({ avoidExerciseIds })} />
        <ExercisePicker label="Favourites" exercises={exercises} selected={draft.favouriteExerciseIds} onChange={(favouriteExerciseIds) => update({ favouriteExerciseIds })} />
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Likes and dislikes (optional)
          <textarea
            rows={2}
            value={draft.likesDislikes ?? ""}
            onChange={(e) => update({ likesDislikes: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </Section>

      <Button type="submit" size="lg" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : initial ? "Save changes" : "Save my training needs"}
      </Button>
      {status === "saved" && <p className="text-sm font-medium text-emerald-600">Saved. Your programme will be built around these answers.</p>}
      {status === "error" && issues.length > 0 && <p className="text-sm font-medium text-red-600">Some answers need a look (marked above).</p>}
      {status === "error" && error && <p className="text-sm font-medium text-red-600">Couldn&apos;t save: {error}</p>}
      {initial && <p className="text-xs text-slate-500">Last confirmed {formatDate(initial.confirmedAt)}.</p>}
    </form>
  );
}

function Section({ title, issues, children }: { title: string; issues: NeedsProfileIssue[]; children: ReactNode }) {
  return (
    <Card className="p-4">
      <fieldset>
        <legend className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</legend>
        {children}
        {issues.map((issue) => (
          <p key={`${issue.field}-${issue.message}`} role="alert" className="mt-2 text-xs font-medium text-red-600">
            {issue.message}
          </p>
        ))}
      </fieldset>
    </Card>
  );
}

function Choices<T extends string | number>({
  name,
  options,
  labels,
  value,
  onChange,
}: {
  name: string;
  options: readonly T[];
  labels: Record<string, string>;
  value: T | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={String(option)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800">
          <input type="radio" name={name} checked={value === option} onChange={() => onChange(option)} />
          {labels[String(option)]}
        </label>
      ))}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

/** Tick-list of library exercises, folded away until you open it. */
function ExercisePicker({
  label,
  exercises,
  selected,
  onChange,
}: {
  label: string;
  exercises: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <details className="mt-2 rounded-lg border border-slate-200 px-3 py-2">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">
        {label} (optional) · {selected.length} chosen
      </summary>
      <div className="mt-2 flex flex-col gap-1" role="group" aria-label={label}>
        {exercises.map((exercise) => (
          <Check
            key={exercise.id}
            label={exercise.name}
            checked={selected.includes(exercise.id)}
            onChange={() => onChange(toggle(selected, exercise.id))}
          />
        ))}
      </div>
    </details>
  );
}

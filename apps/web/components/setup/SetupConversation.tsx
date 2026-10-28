"use client";

/**
 * The setup conversation on Home (S-015, D-018): your training needs, one
 * question at a time. Proposed, not designed: a plain working skeleton for
 * the design-first Home and onboarding screens. The script — order, which
 * questions apply, and every check — is the domain's (needs-conversation.ts).
 * Your place is saved after every step (D-020), so you can carry on later.
 */

import {
  afterAnswer,
  applicableSteps,
  checkStepAnswer,
  conversationStep,
  displayWeightStep,
  EMPHASES,
  experienceFrom,
  GYM_EQUIPMENT,
  JOINT_STRESS_TAGS,
  MAX_DAYS_PER_WEEK,
  MIN_DAYS_PER_WEEK,
  NEEDS_GOALS,
  parseDisplayedWeight,
  previousStepId,
  questionProgress,
  SESSION_MINUTE_CHOICES,
  skipStep,
  stepForField,
  TECHNIQUE_CONFIDENCE,
  toDisplayWeight,
  TRAINING_DURATIONS,
  TRAINING_KINDS,
  type NeedsAnswers,
  type NeedsConversationDraft,
  type NeedsProfileIssue,
  type StepId,
  type Weekday,
} from "@buff-not-bored/domain";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { finishConversation, saveConversationDraft } from "@/lib/actions/needs-conversation";
import { STEP_NAMES, STEP_QUESTIONS } from "@/lib/needs-conversation-copy";
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
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type Exercises = { id: string; name: string }[];

const DAY_CHOICES = Array.from({ length: MAX_DAYS_PER_WEEK - MIN_DAYS_PER_WEEK + 1 }, (_, i) => MIN_DAYS_PER_WEEK + i);

/** The options for each single-choice question, as [value, label]. */
function singleOptions(id: StepId): [string | number, string][] {
  switch (id) {
    case "goal":
      return NEEDS_GOALS.map((v) => [v, GOAL_LABELS[v]]);
    case "emphasis":
      return EMPHASES.map((v) => [v, EMPHASIS_LABELS[v]]);
    case "trainingDuration":
      return TRAINING_DURATIONS.map((v) => [v, DURATION_LABELS[v]]);
    case "trainingKind":
      return TRAINING_KINDS.map((v) => [v, KIND_LABELS[v]]);
    case "techniqueConfidence":
      return TECHNIQUE_CONFIDENCE.map((v) => [v, TECHNIQUE_LABELS[v]]);
    case "daysPerWeek":
      return DAY_CHOICES.map((v) => [v, `${v} days`]);
    case "sessionMinutes":
      return SESSION_MINUTE_CHOICES.map((v) => [v, `${v} minutes`]);
    default:
      return [];
  }
}

/** Your answer to a question, in words, for the summary. */
function describeAnswer(id: StepId, answers: NeedsAnswers, exercises: Exercises, unit: "kg" | "lb"): string {
  const names = (ids: string[] = []) => ids.map((x) => exercises.find((e) => e.id === x)?.name ?? x).join(", ") || "None";
  switch (id) {
    case "goal":
      return answers.goal ? GOAL_LABELS[answers.goal] : "—";
    case "emphasis":
      return answers.emphasis ? EMPHASIS_LABELS[answers.emphasis] : "None";
    case "trainingDuration":
      return answers.trainingDuration ? DURATION_LABELS[answers.trainingDuration] : "—";
    case "trainingKind":
      return answers.trainingKind ? KIND_LABELS[answers.trainingKind] : "—";
    case "techniqueConfidence":
      return answers.techniqueConfidence ? TECHNIQUE_LABELS[answers.techniqueConfidence] : "—";
    case "daysPerWeek":
      return answers.daysPerWeek ? `${answers.daysPerWeek} days` : "—";
    case "preferredDays":
      return answers.preferredDays?.length ? answers.preferredDays.map((d) => WEEKDAY_LABELS[d - 1]).join(", ") : "Any days";
    case "sessionMinutes":
      return answers.sessionMinutes ? `${answers.sessionMinutes} minutes` : "—";
    case "equipment":
      return answers.equipment?.map((x) => EQUIPMENT_LABELS[x]).join(", ") || "—";
    case "heaviestDumbbell":
      return answers.heaviestDumbbellKg !== undefined ? `${toDisplayWeight(answers.heaviestDumbbellKg, unit)}${unit}` : "Not given";
    case "limitations":
      return answers.limitations?.map((x) => LIMITATION_LABELS[x]).join(", ") || "None";
    case "limitationNote":
      return answers.limitationNote || "None";
    case "avoid":
      return names(answers.avoidExerciseIds);
    case "favourites":
      return names(answers.favouriteExerciseIds);
    case "likesDislikes":
      return answers.likesDislikes || "None";
    default:
      return "";
  }
}

function toggle<T>(list: T[] = [], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function SetupConversation({ initialDraft, exercises }: { initialDraft: NeedsConversationDraft | undefined; exercises: Exercises }) {
  const router = useRouter();
  const unit = useWeightUnit();
  const exerciseIds = useMemo(() => new Set(exercises.map((e) => e.id)), [exercises]);

  const [answers, setAnswers] = useState<NeedsAnswers>(initialDraft?.answers ?? {});
  const [stepId, setStepId] = useState<StepId>(initialDraft?.stepId ?? "goal");
  const [answered, setAnswered] = useState<StepId[]>(initialDraft?.answered ?? []);
  const [issues, setIssues] = useState<NeedsProfileIssue[]>([]);
  const [saveNote, setSaveNote] = useState<string | undefined>(undefined);
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(false);

  const step = conversationStep(stepId);
  const progress = questionProgress(stepId, answers);

  // Place-saves run one after another, so an older one can never land after a newer one (or after Save).
  const saving = useRef<Promise<unknown>>(Promise.resolve());

  /** Saves your place; a failure is noted, never blocks you. */
  function keepPlace(draft: NeedsConversationDraft) {
    saving.current = saving.current.then(() =>
      saveConversationDraft(draft).then((result) => setSaveNote(result.ok ? undefined : "I couldn't save your place just now.")),
    );
  }

  /** Moves on with these answers (after a check), to the next question or back to the summary. */
  function moveOn(next: NeedsAnswers, from: StepId = stepId) {
    const problems = checkStepAnswer(from, next, exerciseIds);
    setAnswers(next);
    if (problems.length > 0) {
      setIssues(problems);
      return;
    }
    setIssues([]);
    const target = afterAnswer(from, answers, next, answered);
    const passed = answered.includes(from) ? answered : [...answered, from];
    const nowAnswered = target === "summary" && !passed.includes("summary") ? [...passed, "summary" as StepId] : passed;
    setAnswered(nowAnswered);
    setStepId(target);
    keepPlace({ answers: next, stepId: target, answered: nowAnswered, paused: false });
  }

  function goBack() {
    setIssues([]);
    const target = previousStepId(stepId, answers);
    setStepId(target);
    keepPlace({ answers, stepId: target, answered, paused: false });
  }

  async function notNow() {
    await saving.current;
    const result = await saveConversationDraft({ answers, stepId, answered, paused: true });
    if (result.ok) router.refresh();
    else setSaveNote("I couldn't save your place just now. Try again in a moment.");
  }

  function change(id: StepId) {
    setIssues([]);
    setStepId(id);
    keepPlace({ answers, stepId: id, answered, paused: false });
  }

  async function save() {
    setFinishing(true);
    await saving.current; // so a place-save can't land after the conversation is finished
    const result = await finishConversation(answers);
    setFinishing(false);
    if (result.ok) {
      setDone(true);
      return;
    }
    if ("issues" in result) setIssues(result.issues);
    else setSaveNote(`Couldn't save: ${result.error}`);
  }

  if (done) {
    return (
      <Card className="p-6">
        <p className="text-lg font-bold text-slate-900">Saved. Your programme comes next.</p>
        <p className="mt-1 text-sm text-slate-600">You can change any answer in Settings → Your training needs.</p>
        <Button size="lg" className="mt-4 w-full" onClick={() => router.refresh()}>
          Go to Home
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{progress ? `Question ${progress.number} of ${progress.of}` : step.kind === "summary" ? "Nearly done" : ""}</span>
        <button type="button" onClick={notNow} className="font-semibold underline underline-offset-2">
          Not now
        </button>
      </div>

      <Card className="p-5">
        <p className="text-lg font-bold text-slate-900">
          {stepId === "experience" ? experienceMessage(answers) : STEP_QUESTIONS[stepId]}
        </p>

        <div className="mt-4">
          <StepInput
            key={stepId}
            stepId={stepId}
            answers={answers}
            exercises={exercises}
            unit={unit}
            onAnswer={moveOn}
            onSkip={() => moveOn(skipStep(stepId, answers))}
            optional={step.optional}
          />
        </div>

        {stepId === "summary" && (
          <ul className="flex flex-col divide-y divide-slate-100">
            {applicableSteps(answers)
              .filter((s) => s.field !== undefined)
              .map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="block text-xs text-slate-500">{STEP_NAMES[s.id]}</span>
                    <span className="text-slate-900">{describeAnswer(s.id, answers, exercises, unit)}</span>
                  </span>
                  <button type="button" onClick={() => change(s.id)} className="shrink-0 text-xs font-semibold underline underline-offset-2">
                    Change
                  </button>
                </li>
              ))}
          </ul>
        )}

        {issues.map((issue) => {
          const target = stepForField(issue.field);
          return (
            <p key={`${issue.field}-${issue.message}`} role="alert" className="mt-3 text-sm font-medium text-red-600">
              {stepId === "summary" && target ? `${STEP_NAMES[target]}: ` : ""}
              {issue.message}
              {stepId === "summary" && target && (
                <button type="button" onClick={() => change(target)} className="ml-2 underline underline-offset-2">
                  Answer it
                </button>
              )}
            </p>
          );
        })}

        {stepId === "summary" && (
          <Button size="lg" className="mt-4 w-full" disabled={finishing} onClick={save}>
            {finishing ? "Saving…" : "Save"}
          </Button>
        )}
      </Card>

      {stepId !== "goal" && (
        <button type="button" onClick={goBack} className="self-start text-sm font-semibold text-slate-600 underline underline-offset-2">
          Back
        </button>
      )}
      {saveNote && <p className="text-xs text-amber-700">{saveNote}</p>}
    </div>
  );
}

function experienceMessage(answers: NeedsAnswers): string {
  const level = experienceFrom(answers);
  return level ? `Thanks! Sounds like you're ${STATUS_LABELS[level].toLowerCase()}.` : "Thanks!";
}

/** The answer controls for one question. Plain skeleton (design-first). */
function StepInput({
  stepId,
  answers,
  exercises,
  unit,
  optional,
  onAnswer,
  onSkip,
}: {
  stepId: StepId;
  answers: NeedsAnswers;
  exercises: Exercises;
  unit: "kg" | "lb";
  optional: boolean;
  onAnswer: (next: NeedsAnswers) => void;
  onSkip: () => void;
}) {
  const step = conversationStep(stepId);
  const skip = optional ? (
    <button type="button" onClick={onSkip} className="mt-3 text-sm font-semibold text-slate-600 underline underline-offset-2">
      Skip
    </button>
  ) : null;

  if (step.kind === "result") {
    return (
      <Button className="w-full" onClick={() => onAnswer(answers)}>
        Carry on
      </Button>
    );
  }

  if (step.kind === "single") {
    const field = step.field!;
    const current = answers[field];
    return (
      <div className="flex flex-col gap-2">
        {singleOptions(stepId).map(([value, label]) => (
          <button
            key={String(value)}
            type="button"
            aria-pressed={current === value}
            onClick={() => onAnswer({ ...answers, [field]: value })}
            className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold ${
              current === value ? "border-accent-600 bg-accent-50 text-accent-700" : "border-slate-200 text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
        {skip}
      </div>
    );
  }

  if (step.kind === "multi") return <MultiInput stepId={stepId} answers={answers} onAnswer={onAnswer} skip={skip} />;
  if (step.kind === "days") return <DaysInput answers={answers} onAnswer={onAnswer} skip={skip} />;
  if (step.kind === "number") return <DumbbellInput answers={answers} unit={unit} onAnswer={onAnswer} skip={skip} />;
  if (step.kind === "text") return <TextInput field={step.field as "limitationNote" | "likesDislikes"} answers={answers} onAnswer={onAnswer} skip={skip} />;
  if (step.kind === "exercises") {
    return <ExercisesInput field={step.field as "avoidExerciseIds" | "favouriteExerciseIds"} answers={answers} exercises={exercises} onAnswer={onAnswer} skip={skip} />;
  }
  return null;
}

function Tick({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function MultiInput({
  stepId,
  answers,
  onAnswer,
  skip,
}: {
  stepId: StepId;
  answers: NeedsAnswers;
  onAnswer: (next: NeedsAnswers) => void;
  skip: React.ReactNode;
}) {
  const isEquipment = stepId === "equipment";
  const [picked, setPicked] = useState<string[]>((isEquipment ? answers.equipment : answers.limitations) ?? []);
  const options = isEquipment
    ? GYM_EQUIPMENT.map((v) => [v, EQUIPMENT_LABELS[v]] as const)
    : JOINT_STRESS_TAGS.map((v) => [v, LIMITATION_LABELS[v]] as const);
  return (
    <div className="flex flex-col gap-1">
      {options.map(([value, label]) => (
        <Tick key={value} label={label} checked={picked.includes(value)} onChange={() => setPicked(toggle(picked, value))} />
      ))}
      <Button className="mt-3 w-full" onClick={() => onAnswer({ ...answers, [isEquipment ? "equipment" : "limitations"]: picked })}>
        Done
      </Button>
      {skip}
    </div>
  );
}

function DaysInput({ answers, onAnswer, skip }: { answers: NeedsAnswers; onAnswer: (next: NeedsAnswers) => void; skip: React.ReactNode }) {
  const [picked, setPicked] = useState<Weekday[]>(answers.preferredDays ?? []);
  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">Pick {answers.daysPerWeek ?? ""} days, or skip for any days.</p>
      <div className="flex flex-wrap gap-2">
        {WEEKDAY_LABELS.map((label, i) => {
          const day = (i + 1) as Weekday;
          return <Tick key={label} label={label} checked={picked.includes(day)} onChange={() => setPicked(toggle(picked, day).sort((a, b) => a - b))} />;
        })}
      </div>
      <Button className="mt-3 w-full" onClick={() => onAnswer({ ...answers, preferredDays: picked })}>
        Done
      </Button>
      {skip}
    </div>
  );
}

function DumbbellInput({
  answers,
  unit,
  onAnswer,
  skip,
}: {
  answers: NeedsAnswers;
  unit: "kg" | "lb";
  onAnswer: (next: NeedsAnswers) => void;
  skip: React.ReactNode;
}) {
  const known = answers.heaviestDumbbellKg;
  const [text, setText] = useState(known !== undefined ? String(toDisplayWeight(known, unit)) : "");
  const [problem, setProblem] = useState<string | undefined>(undefined);
  function done() {
    const kg = parseDisplayedWeight(text, unit, known);
    if (kg === undefined) {
      setProblem(`Enter a weight in ${unit}, or skip.`);
      return;
    }
    onAnswer({ ...answers, heaviestDumbbellKg: kg });
  }
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700">
        Heaviest dumbbell ({unit})
        <input
          type="number"
          inputMode="decimal"
          step={displayWeightStep(unit)}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      {problem && <p className="mt-2 text-sm text-red-600">{problem}</p>}
      <Button className="mt-3 w-full" onClick={done}>
        Done
      </Button>
      {skip}
    </div>
  );
}

function TextInput({
  field,
  answers,
  onAnswer,
  skip,
}: {
  field: "limitationNote" | "likesDislikes";
  answers: NeedsAnswers;
  onAnswer: (next: NeedsAnswers) => void;
  skip: React.ReactNode;
}) {
  const [text, setText] = useState(answers[field] ?? "");
  return (
    <div>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={field === "limitationNote" ? "Note" : "Likes and dislikes"}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <Button className="mt-3 w-full" onClick={() => onAnswer({ ...answers, [field]: text.trim() || undefined })}>
        Done
      </Button>
      {skip}
    </div>
  );
}

/** "Any?" first; only then a search and a short list (progressive disclosure). */
function ExercisesInput({
  field,
  answers,
  exercises,
  onAnswer,
  skip,
}: {
  field: "avoidExerciseIds" | "favouriteExerciseIds";
  answers: NeedsAnswers;
  exercises: Exercises;
  onAnswer: (next: NeedsAnswers) => void;
  skip: React.ReactNode;
}) {
  const [picked, setPicked] = useState<string[]>(answers[field] ?? []);
  const [open, setOpen] = useState(picked.length > 0);
  const [search, setSearch] = useState("");

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <Button className="w-full" onClick={() => setOpen(true)}>
          Yes, pick some
        </Button>
        {skip}
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const matches = query === "" ? exercises.filter((e) => picked.includes(e.id)) : exercises.filter((e) => e.name.toLowerCase().includes(query)).slice(0, 8);
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700">
        Search exercises
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="For example, squat"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <div className="mt-2 flex flex-col gap-1">
        {matches.map((exercise) => (
          <Tick key={exercise.id} label={exercise.name} checked={picked.includes(exercise.id)} onChange={() => setPicked(toggle(picked, exercise.id))} />
        ))}
        {query === "" && picked.length === 0 && <p className="text-xs text-slate-500">Type to find an exercise.</p>}
        {query !== "" && matches.length === 0 && <p className="text-xs text-slate-500">No exercises match.</p>}
      </div>
      <p className="mt-2 text-xs text-slate-500">{picked.length} chosen</p>
      <Button className="mt-3 w-full" onClick={() => onAnswer({ ...answers, [field]: picked })}>
        Done
      </Button>
      {skip}
    </div>
  );
}

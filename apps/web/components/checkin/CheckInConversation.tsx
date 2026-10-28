"use client";

/**
 * "How are you today?" (S-016, §6.6): the daily check-in on Home, one tap
 * per question. Proposed, not designed: a plain working skeleton for the
 * design-first Home screen. The order and checks are the domain's
 * (check-in.ts); nothing adapts from the answers yet (S-018).
 */

import {
  answersFromCheckIn,
  checkInProgress,
  ENERGY_ANSWERS,
  JOINT_STRESS_TAGS,
  nextCheckInStep,
  previousCheckInStep,
  SLEEP_ANSWERS,
  SORENESS_ANSWERS,
  type CheckIn,
  type CheckInAnswers,
  type CheckInStep,
  type JointStressTag,
} from "@buff-not-bored/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveTodayCheckIn, skipTodayCheckIn } from "@/lib/actions/check-in";
import { CHECK_IN_QUESTIONS, ENERGY_LABELS, SLEEP_LABELS, SORENESS_LABELS } from "@/lib/check-in-copy";
import { LIMITATION_LABELS } from "@/lib/needs-labels";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type OneTapStep = "sleep" | "energy" | "soreness" | "pain";

const ONE_TAP: Record<OneTapStep, { value: string | boolean; label: string }[]> = {
  sleep: SLEEP_ANSWERS.map((v) => ({ value: v, label: SLEEP_LABELS[v] })),
  energy: ENERGY_ANSWERS.map((v) => ({ value: v, label: ENERGY_LABELS[v] })),
  soreness: SORENESS_ANSWERS.map((v) => ({ value: v, label: SORENESS_LABELS[v] })),
  pain: [
    { value: false, label: "No" },
    { value: true, label: "Yes" },
  ],
};

export function CheckInConversation({ existing, onClose }: { existing?: CheckIn; onClose?: () => void }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<CheckInAnswers>(answersFromCheckIn(existing));
  const [step, setStep] = useState<CheckInStep>("sleep");
  const [problem, setProblem] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const progress = checkInProgress(step, answers);

  async function finish(final: CheckInAnswers) {
    setBusy(true);
    const result = await saveTodayCheckIn(final);
    setBusy(false);
    if (!result.ok) {
      setProblem(result.error);
      return;
    }
    setProblem(undefined);
    setStep("done");
  }

  function answer(final: CheckInAnswers) {
    setAnswers(final);
    setProblem(undefined);
    const next = nextCheckInStep(step, final);
    if (next === "done") void finish(final);
    else setStep(next);
  }

  async function notToday() {
    setBusy(true);
    const result = await skipTodayCheckIn();
    setBusy(false);
    if (result.ok) router.refresh();
    else setProblem(result.error);
  }

  function close() {
    onClose?.();
    router.refresh();
  }

  if (step === "done") {
    return (
      <Card className="p-5">
        <p className="text-lg font-bold text-slate-900">{CHECK_IN_QUESTIONS.done}</p>
        <Button size="lg" className="mt-4 w-full" onClick={close}>
          Carry on to Home
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{progress ? `Question ${progress.number} of ${progress.of}` : ""}</span>
        {existing && !existing.skipped ? (
          <button type="button" onClick={close} disabled={busy} className="font-semibold underline underline-offset-2">
            Keep my answers
          </button>
        ) : (
          <button type="button" onClick={notToday} disabled={busy} className="font-semibold underline underline-offset-2">
            Not today
          </button>
        )}
      </div>

      <Card className="p-5">
        <p className="text-lg font-bold text-slate-900">{CHECK_IN_QUESTIONS[step]}</p>

        {step === "painWhere" ? (
          <PainWhere answers={answers} busy={busy} onChange={(painRegions) => setAnswers({ ...answers, painRegions })} onDone={answer} />
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {ONE_TAP[step as OneTapStep].map((option) => {
              const current = answers[step as OneTapStep];
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  disabled={busy}
                  aria-pressed={current === option.value}
                  onClick={() => answer({ ...answers, [step]: option.value })}
                  className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold ${
                    current === option.value ? "border-accent-600 bg-accent-50 text-accent-700" : "border-slate-200 text-slate-800"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {problem && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {problem}
          </p>
        )}
      </Card>

      {step !== "sleep" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setStep(previousCheckInStep(step, answers))}
          className="self-start text-sm font-semibold text-slate-600 underline underline-offset-2"
        >
          Back
        </button>
      )}
    </div>
  );
}

/** Where it hurts. Ticks are kept in the answers straight away, so going Back doesn't lose them. */
function PainWhere({
  answers,
  busy,
  onChange,
  onDone,
}: {
  answers: CheckInAnswers;
  busy: boolean;
  onChange: (regions: JointStressTag[]) => void;
  onDone: (final: CheckInAnswers) => void;
}) {
  const picked = answers.painRegions;
  const toggle = (tag: JointStressTag) => onChange(picked.includes(tag) ? picked.filter((x) => x !== tag) : [...picked, tag]);
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {JOINT_STRESS_TAGS.map((tag) => (
          <label key={tag} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800">
            <input type="checkbox" checked={picked.includes(tag)} onChange={() => toggle(tag)} />
            {LIMITATION_LABELS[tag]}
          </label>
        ))}
      </div>
      <Button className="mt-3 w-full" disabled={busy} onClick={() => onDone(answers)}>
        Done
      </Button>
    </div>
  );
}

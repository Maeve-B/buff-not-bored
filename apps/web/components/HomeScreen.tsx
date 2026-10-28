"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resumeConversation } from "@/lib/actions/needs-conversation";
import { getTodaysProgrammePlan } from "@/lib/programme-service";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

/**
 * `setupPrompt`: you paused the setup conversation (S-015), so Home offers
 * to carry on from where you left off. Proposed, not designed (Home is
 * design-first).
 */
export function HomeScreen({ setupPrompt }: { setupPrompt?: { number: number; of: number } | "nearly_done" } = {}) {
  const router = useRouter();
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState(false);

  async function carryOn() {
    setResuming(true);
    setResumeError(false);
    try {
      await resumeConversation();
      router.refresh();
    } catch {
      setResumeError(true);
      setResuming(false);
    }
  }
  const plan = getTodaysProgrammePlan();
  const scheduledHref =
    plan.scheduled?.workoutType === "classic_strength" ? "/strength" : plan.scheduled?.workoutType === "circuit" ? "/circuit" : undefined;
  const clampedWeek = Math.max(1, Math.min(plan.weekNumber, plan.programme.totalWeeks));

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent-600">Buff, Not Bored</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">What are you training today?</h1>
      </div>

      {setupPrompt && (
        <Card className="p-4">
          <p className="font-semibold text-slate-900">Finish setting up your training</p>
          <p className="text-sm text-slate-500">
            {setupPrompt === "nearly_done" ? "You're nearly done." : `You stopped at question ${setupPrompt.number} of ${setupPrompt.of}.`}
          </p>
          <Button className="mt-3 w-full" disabled={resuming} onClick={carryOn}>
            {resuming ? "Opening…" : "Carry on"}
          </Button>
          {resumeError && <p className="mt-2 text-xs text-red-600">Couldn&apos;t open it just now. Try again in a moment.</p>}
        </Card>
      )}

      {plan.scheduled && scheduledHref ? (
        <Card className="p-6 text-center">
          <Badge tone="accent">Your Programme</Badge>
          <p className="mt-3 text-lg font-bold text-slate-900">
            Week {plan.weekNumber} · {plan.scheduled.name}
          </p>
          <p className="text-sm text-slate-500">{plan.programme.name}</p>
          <Link href={scheduledHref}>
            <Button size="lg" className="mt-4 w-full">
              Start
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <Badge>Your Programme</Badge>
          <p className="mt-3 text-sm text-slate-500">Nothing scheduled today in {plan.programme.name} — pick a workout type below.</p>
        </Card>
      )}

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        Or choose a workout
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/circuit">
          <Card className="flex flex-col items-center gap-2 p-5 text-center transition-colors hover:border-accent-300">
            <span className="text-2xl" aria-hidden>
              ↻
            </span>
            <span className="font-bold text-slate-900">Circuit</span>
          </Card>
        </Link>
        <Link href="/strength">
          <Card className="flex flex-col items-center gap-2 p-5 text-center transition-colors hover:border-accent-300">
            <span className="text-2xl" aria-hidden>
              🏋️
            </span>
            <span className="font-bold text-slate-900">Strength</span>
          </Card>
        </Link>
      </div>
      <p className="-mt-4 text-center text-xs text-slate-400">More workout types coming soon</p>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Your Programmes</h2>
        <Link href="/programmes">
          <Card className="flex items-center justify-between p-4 transition-colors hover:border-accent-300">
            <div>
              <p className="font-bold text-slate-900">{plan.programme.name}</p>
              <p className="text-sm text-slate-500">
                Week {clampedWeek} of {plan.programme.totalWeeks}
              </p>
            </div>
            <span aria-hidden className="text-slate-400">
              ›
            </span>
          </Card>
        </Link>
      </div>
    </div>
  );
}

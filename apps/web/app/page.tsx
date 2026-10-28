import { EXERCISES, resumePoint } from "@buff-not-bored/domain";
import { HomeScreen } from "@/components/HomeScreen";
import { SetupConversation } from "@/components/setup/SetupConversation";
import { CheckInConversation } from "@/components/checkin/CheckInConversation";
import { loadTodayCheckIn, localTodayIso } from "@/lib/actions/check-in";
import { loadSetupState } from "@/lib/actions/needs-conversation";

// Whether you've set up your training needs is read on every visit.
export const dynamic = "force-dynamic";

/**
 * Home. Until your training needs are saved, it opens with the setup
 * conversation (S-015, D-018); after "Not now" it shows the usual Home with
 * a prompt to carry on. Once you're set up, the first visit each day opens
 * with the check-in (S-016); after that, Home shows how you checked in.
 */
/** An ISO timestamp's date on this computer's calendar (matches localTodayIso). */
function localDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function HomePage() {
  const [{ hasProfile, confirmedAt, draft }, checkIn, today] = await Promise.all([loadSetupState(), loadTodayCheckIn(), localTodayIso()]);
  if (!hasProfile && !draft?.paused) {
    const exercises = EXERCISES.map((exercise) => ({ id: exercise.id, name: exercise.name }));
    return <SetupConversation initialDraft={draft} exercises={exercises} />;
  }
  if (!hasProfile) {
    return <HomeScreen setupPrompt={draft ? resumePoint(draft.stepId, draft.answers) : undefined} />;
  }
  // You've only just set up today, so there's nothing to "welcome back" from: the check-in starts tomorrow.
  const setUpToday = confirmedAt !== undefined && localDate(confirmedAt) === today;
  if (!checkIn && !setUpToday) return <CheckInConversation />;
  return <HomeScreen checkIn={checkIn} />;
}

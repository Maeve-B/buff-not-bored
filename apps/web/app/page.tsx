import { EXERCISES, resumePoint } from "@buff-not-bored/domain";
import { HomeScreen } from "@/components/HomeScreen";
import { SetupConversation } from "@/components/setup/SetupConversation";
import { loadSetupState } from "@/lib/actions/needs-conversation";

// Whether you've set up your training needs is read on every visit.
export const dynamic = "force-dynamic";

/**
 * Home. Until your training needs are saved, it opens with the setup
 * conversation (S-015, D-018); after "Not now" it shows the usual Home with
 * a prompt to carry on.
 */
export default async function HomePage() {
  const { hasProfile, draft } = await loadSetupState();
  if (!hasProfile && !draft?.paused) {
    const exercises = EXERCISES.map((exercise) => ({ id: exercise.id, name: exercise.name }));
    return <SetupConversation initialDraft={draft} exercises={exercises} />;
  }
  const setupPrompt = !hasProfile && draft ? resumePoint(draft.stepId, draft.answers) : undefined;
  return <HomeScreen setupPrompt={setupPrompt} />;
}

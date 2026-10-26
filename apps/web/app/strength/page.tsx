import { StrengthScreen } from "@/components/strength/StrengthScreen";
import { loadCurrentWeights } from "@/lib/actions/exercise-capability";
import { loadLastTimeOnStrengthExercises, loadNextStrengthSessionId } from "@/lib/actions/strength-programme";

// Your weights and the session due next are read from the database on every visit, never baked in at build time.
export const dynamic = "force-dynamic";

export default async function StrengthPage() {
  const [currentWeights, nextSessionId, lastTime] = await Promise.all([
    loadCurrentWeights(),
    loadNextStrengthSessionId(),
    loadLastTimeOnStrengthExercises(),
  ]);
  return <StrengthScreen currentWeights={currentWeights} nextSessionId={nextSessionId} lastTime={lastTime} />;
}

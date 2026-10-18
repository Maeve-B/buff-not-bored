import { TodayScreen } from "@/components/TodayScreen";
import { loadCurrentWeights } from "@/lib/actions/exercise-capability";

// Your weights are read from the database on every visit, never baked in at build time.
export const dynamic = "force-dynamic";

export default async function CircuitPage() {
  return <TodayScreen currentWeights={await loadCurrentWeights()} />;
}

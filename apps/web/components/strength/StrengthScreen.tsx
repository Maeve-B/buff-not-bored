"use client";

import type { CurrentWeights } from "@buff-not-bored/domain";
import { useEffect } from "react";
import { useStrengthStore } from "@/lib/strength-store";
import { StrengthActiveWorkout } from "./StrengthActiveWorkout";
import { StrengthComplete } from "./StrengthComplete";
import { StrengthOverview } from "./StrengthOverview";

export function StrengthScreen({ currentWeights, nextSessionId }: { currentWeights: CurrentWeights; nextSessionId?: string }) {
  const status = useStrengthStore((s) => s.status);
  const applyCurrentWeights = useStrengthStore((s) => s.applyCurrentWeights);
  const applyNextSession = useStrengthStore((s) => s.applyNextSession);
  useEffect(() => applyCurrentWeights(currentWeights), [applyCurrentWeights, currentWeights]);
  useEffect(() => {
    if (nextSessionId) applyNextSession(nextSessionId);
  }, [applyNextSession, nextSessionId]);
  if (status === "in_progress") return <StrengthActiveWorkout />;
  if (status === "completed") return <StrengthComplete />;
  return <StrengthOverview />;
}

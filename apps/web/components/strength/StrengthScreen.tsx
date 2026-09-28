"use client";

import { useStrengthStore } from "@/lib/strength-store";
import { StrengthActiveWorkout } from "./StrengthActiveWorkout";
import { StrengthComplete } from "./StrengthComplete";
import { StrengthOverview } from "./StrengthOverview";

export function StrengthScreen() {
  const status = useStrengthStore((s) => s.status);
  if (status === "in_progress") return <StrengthActiveWorkout />;
  if (status === "completed") return <StrengthComplete />;
  return <StrengthOverview />;
}

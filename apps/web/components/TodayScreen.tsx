"use client";

import type { CurrentWeights } from "@buff-not-bored/domain";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { ActiveWorkout } from "./ActiveWorkout";
import { TodayOverview } from "./TodayOverview";
import { WorkoutComplete } from "./WorkoutComplete";

/** Renders the right screen for the current workout status — idle/in-progress/completed all live under one route, so logging a set never requires a page navigation. */
export function TodayScreen({ currentWeights }: { currentWeights: CurrentWeights }) {
  const status = useAppStore((s) => s.status);
  const applyCurrentWeights = useAppStore((s) => s.applyCurrentWeights);
  useEffect(() => applyCurrentWeights(currentWeights), [applyCurrentWeights, currentWeights]);
  if (status === "in_progress") return <ActiveWorkout />;
  if (status === "completed") return <WorkoutComplete />;
  return <TodayOverview />;
}

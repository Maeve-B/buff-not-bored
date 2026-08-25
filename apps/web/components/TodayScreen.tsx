"use client";

import { useAppStore } from "@/lib/store";
import { ActiveWorkout } from "./ActiveWorkout";
import { TodayOverview } from "./TodayOverview";
import { WorkoutComplete } from "./WorkoutComplete";

/** Renders the right screen for the current workout status — idle/in-progress/completed all live under one route, so logging a set never requires a page navigation. */
export function TodayScreen() {
  const status = useAppStore((s) => s.status);
  if (status === "in_progress") return <ActiveWorkout />;
  if (status === "completed") return <WorkoutComplete />;
  return <TodayOverview />;
}

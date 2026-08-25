import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ProgressPage from "@/app/progress/page";
import { getInitialState, useAppStore } from "@/lib/store";
import { getTodayWorkout } from "@/lib/workout-service";

beforeEach(() => {
  useAppStore.setState(getInitialState());
});

describe("Flow 10: View progression", () => {
  it("shows an empty state with no logged history", () => {
    render(<ProgressPage />);
    expect(screen.getByText("No progress yet")).toBeInTheDocument();
  });

  it("uses the domain progression engine's recommendation for each logged exercise", () => {
    const session = getTodayWorkout();
    useAppStore.setState({
      history: [
        {
          id: "workout-1",
          dateIso: new Date("2026-08-24T10:00:00Z").toISOString(),
          workoutName: "Full Body",
          durationMs: 47 * 60_000,
          totalExercises: 25,
          exercisesCompleted: 2,
          session,
          setLogs: [
            // Squats: prescribed 20kg/20 reps, logged easy performance -> engine recommends increase.
            { exerciseId: "squats", actualWeight: 20, actualReps: 25, completed: true, loggedAt: Date.now() },
            // Deadlifts: prescribed 35kg/20 reps, met exactly -> engine recommends maintain.
            { exerciseId: "deadlifts", actualWeight: 35, actualReps: 20, completed: true, loggedAt: Date.now() },
          ],
        },
      ],
    });

    render(<ProgressPage />);
    expect(screen.getByText("Squats")).toBeInTheDocument();
    expect(screen.getByText(/20kg → 21kg/)).toBeInTheDocument();
    expect(screen.getByText(/Recommended progression/)).toBeInTheDocument();

    expect(screen.getByText("Deadlifts")).toBeInTheDocument();
    expect(screen.getByText(/→ Maintain/)).toBeInTheDocument();
  });
});

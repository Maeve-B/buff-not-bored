import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import HistoryPage from "@/app/history/page";
import { getInitialState, useAppStore } from "@/lib/store";
import { getTodayWorkout } from "@/lib/workout-service";

beforeEach(() => {
  useAppStore.setState(getInitialState());
});

describe("Flow 9: View history", () => {
  it("shows an empty state with no completed workouts", () => {
    render(<HistoryPage />);
    expect(screen.getByText("No workouts yet")).toBeInTheDocument();
  });

  it("lists a completed workout with date, type, duration, and exercises completed", () => {
    const session = getTodayWorkout();
    useAppStore.setState({
      history: [
        {
          id: "workout-1",
          dateIso: new Date("2026-08-24T10:00:00Z").toISOString(),
          workoutName: "Full Body",
          durationMs: 47 * 60_000,
          totalExercises: 25,
          exercisesCompleted: 22,
          session,
          setLogs: [],
        },
      ],
    });

    render(<HistoryPage />);
    expect(screen.getByText("Full Body")).toBeInTheDocument();
    expect(screen.getByText("47 min")).toBeInTheDocument();
    expect(screen.getByText("22/25 exercises")).toBeInTheDocument();
  });

  it("shows the most recent workout first", () => {
    const session = getTodayWorkout();
    useAppStore.setState({
      history: [
        {
          id: "workout-2",
          dateIso: new Date("2026-08-26T10:00:00Z").toISOString(),
          workoutName: "Full Body",
          durationMs: 45 * 60_000,
          totalExercises: 25,
          exercisesCompleted: 25,
          session,
          setLogs: [],
        },
        {
          id: "workout-1",
          dateIso: new Date("2026-08-24T10:00:00Z").toISOString(),
          workoutName: "Full Body",
          durationMs: 47 * 60_000,
          totalExercises: 25,
          exercisesCompleted: 22,
          session,
          setLogs: [],
        },
      ],
    });

    render(<HistoryPage />);
    const entries = screen.getAllByText(/exercises$/);
    expect(entries[0]).toHaveTextContent("25/25 exercises");
    expect(entries[1]).toHaveTextContent("22/25 exercises");
  });
});

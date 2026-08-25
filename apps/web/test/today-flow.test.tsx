import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayScreen } from "@/components/TodayScreen";
import { getInitialState, useAppStore } from "@/lib/store";

beforeEach(() => {
  useAppStore.setState(getInitialState());
});

describe("Flow 1: Open Today", () => {
  it("shows the workout overview with name, duration, muscle groups, and primary actions", () => {
    render(<TodayScreen />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Full Body" })).toBeInTheDocument();
    expect(screen.getByText(/45–50 min/)).toBeInTheDocument();
    expect(screen.getByText("Legs")).toBeInTheDocument();
    expect(screen.getByText("Core")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start workout/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /i'm bored/i })).toBeInTheDocument();
  });
});

describe("Flow 2: Start workout", () => {
  it("moves straight into the exercise list — no extra navigation", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    expect(screen.getByRole("heading", { name: "Full Body" })).toBeInTheDocument();
    expect(screen.getByText("Squats")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /finish workout/i })).toBeInTheDocument();
    expect(screen.getByText(/0\/25 logged/)).toBeInTheDocument();
  });
});

describe("Flow 3: Log a set", () => {
  it("logs a set in place, without navigating away, and updates the progress count", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const logButtons = screen.getAllByRole("button", { name: /log set/i });
    const initialCount = logButtons.length;
    await user.click(logButtons[0]!);

    // The logged card now shows a confirmation instead of a Log Set button.
    expect(screen.getByText("✓ Logged")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /log set/i })).toHaveLength(initialCount - 1);
    expect(screen.getByText(/1\/25 logged/)).toBeInTheDocument();
  });

  it("supports adjusting weight/reps with the stepper before logging", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    // Squats starts at 20kg/20 reps.
    await user.click(screen.getAllByRole("button", { name: "Increase Weight" })[0]!);
    await user.click(screen.getAllByRole("button", { name: "Increase Reps" })[0]!);
    await user.click(screen.getAllByRole("button", { name: /log set/i })[0]!);

    expect(screen.getByText(/22\.5kg × 21 reps/)).toBeInTheDocument();
  });
});

describe("Flow 4: Swap an exercise", () => {
  it("uses the deterministic engine and shows what changed", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    expect(screen.getByText("Squats")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /^swap$/i })[0]!);

    // Squats' only eligible library alternate is Bulgarian Split Squat (confirmed by the Phase 2 domain tests).
    // The exercise-card heading is gone — Squats no longer has its own card.
    expect(screen.queryByRole("heading", { name: "Squats", level: 3 })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bulgarian Split Squat", level: 3 })).toBeInTheDocument();

    // The swap banner explains what changed (not just a silently-updated card) — "Squats" legitimately
    // still appears here, struck through, as the "before" side of the comparison.
    expect(screen.getByText(/Swapped/)).toBeInTheDocument();
    expect(screen.getByText("Squats")).toBeInTheDocument();
  });
});

describe("Flow 8: Complete a workout", () => {
  it("shows a completion summary with duration, exercises completed, and progression recommendations", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    // Log one set so there's something to show a recommendation for.
    await user.click(screen.getAllByRole("button", { name: /log set/i })[0]!);
    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    expect(screen.getByText("Workout Complete")).toBeInTheDocument();
    expect(screen.getByText("1/25")).toBeInTheDocument();
    expect(screen.getByText("Progression recommendations")).toBeInTheDocument();
    // Squats logged at exactly prescribed weight/reps with default feedback -> "maintain".
    const squatsRow = within(screen.getByText("Squats").closest("li")!);
    expect(squatsRow.getByText(/→ Maintain/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(screen.getByRole("button", { name: /start workout/i })).toBeInTheDocument();
  });
});

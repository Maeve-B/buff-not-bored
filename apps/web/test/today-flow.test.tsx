import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TodayScreen } from "@/components/TodayScreen";
import { saveStartingWeight } from "@/lib/actions/exercise-capability";
import { getInitialState, useAppStore } from "@/lib/store";

// Persistence is exercised separately (test/save-workout.integration.test.ts,
// test/store-persistence.test.tsx) — these UI flow tests shouldn't depend on
// a real database, per ARCHITECTURE.md §9 ("apps/web Server Actions: Vitest,
// domain/db mocked").
vi.mock("@/lib/actions/save-workout", () => ({
  persistWorkoutSnapshot: vi.fn(async () => ({ ok: true, id: "mock-workout-id" })),
}));
vi.mock("@/lib/actions/exercise-capability", () => ({
  saveStartingWeight: vi.fn(async () => ({ ok: true, saved: true })),
}));

beforeEach(() => {
  useAppStore.setState(getInitialState());
  vi.mocked(saveStartingWeight).mockClear();
});

/** The whole exercise card: heading → title row → title block → header row → card. */
function cardFor(name: string): HTMLElement {
  return screen.getByRole("heading", { name, level: 3 }).parentElement!.parentElement!.parentElement!.parentElement!;
}

describe("Flow 1: Open Today", () => {
  it("shows the workout overview with name, duration, muscle groups, and primary actions", () => {
    render(<TodayScreen currentWeights={{}} />);
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
    render(<TodayScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    expect(screen.getByRole("heading", { name: "Full Body" })).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /finish workout/i })).toBeInTheDocument();
    expect(screen.getByText(/0\/25 logged/)).toBeInTheDocument();
  });
});

describe("Flow 3: Log a set", () => {
  it("logs a set in place, without navigating away, and updates the progress count", async () => {
    const user = userEvent.setup();
    render(<TodayScreen currentWeights={{}} />);
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
    render(<TodayScreen currentWeights={{ squats: 20 }} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    // Squats starts at your 20kg, 20 reps.
    await user.click(screen.getAllByRole("button", { name: "Increase Weight" })[0]!);
    await user.click(screen.getAllByRole("button", { name: "Increase Reps" })[0]!);
    await user.click(screen.getAllByRole("button", { name: /log set/i })[0]!);

    expect(screen.getByText(/^21 reps × 22\.5kg$/)).toBeInTheDocument();
  });
});

describe("Your weights (S-002)", () => {
  it("prescribes your weight, asks for one where you have none, and shows bodyweight work as bodyweight", async () => {
    const user = userEvent.setup();
    render(<TodayScreen currentWeights={{ squats: 40 }} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    expect(within(cardFor("Back Squat")).getByText(/^20 reps · 40kg ·/)).toBeInTheDocument();
    expect(within(cardFor("Conventional Deadlift")).getByText(/^20 reps · Add baseline ·/)).toBeInTheDocument();
    expect(within(cardFor("Conventional Deadlift")).getByRole("spinbutton", { name: "Conventional Deadlift weight" })).toHaveValue(null);
    expect(within(cardFor("Superman Holds")).getByText(/^30 sec · Bodyweight ·/)).toBeInTheDocument();
  });

  it("saves the first weight you log as your starting weight, in 0.25 kg steps", async () => {
    const user = userEvent.setup();
    render(<TodayScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const deadlifts = within(cardFor("Conventional Deadlift"));
    await user.type(deadlifts.getByRole("spinbutton", { name: "Conventional Deadlift weight" }), "35.25");
    await user.click(deadlifts.getByRole("button", { name: /log set/i }));

    expect(deadlifts.getByText(/^20 reps × 35\.25kg$/)).toBeInTheDocument();
    expect(saveStartingWeight).toHaveBeenCalledWith("deadlifts", 35.25);
    expect(useAppStore.getState().currentWeights).toMatchObject({ deadlifts: 35.25 });
  });

  it("never records a starting weight when you already have one, or when no weight was typed", async () => {
    const user = userEvent.setup();
    render(<TodayScreen currentWeights={{ squats: 20 }} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    await user.click(screen.getAllByRole("button", { name: "Increase Weight" })[0]!); // Squats: 20 -> 22.5 for this session
    await user.click(within(cardFor("Back Squat")).getByRole("button", { name: /log set/i }));
    await user.click(within(cardFor("Conventional Deadlift")).getByRole("button", { name: /log set/i }));

    expect(saveStartingWeight).not.toHaveBeenCalled();
    expect(useAppStore.getState().currentWeights).toEqual({ squats: 20 });
  });
});

describe("Your weights — keeping your session (S-002 review)", () => {
  it("re-applies your weights to the session you have, so a swap before starting survives a revisit", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TodayScreen currentWeights={{}} />);
    useAppStore.getState().swap("squats");
    const idsAfterSwap = useAppStore.getState().session.mainExercises.map((pe) => pe.exercise.id);
    expect(idsAfterSwap).not.toContain("squats");

    rerender(<TodayScreen currentWeights={{ deadlifts: 60 }} />);

    expect(useAppStore.getState().session.mainExercises.map((pe) => pe.exercise.id)).toEqual(idsAfterSwap);
    await user.click(screen.getByRole("button", { name: /start workout/i }));
    expect(within(cardFor("Conventional Deadlift")).getByText(/^20 reps · 60kg ·/)).toBeInTheDocument();
  });

  it("shows your new weight on the exercise straight after a first-use log", async () => {
    const user = userEvent.setup();
    render(<TodayScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const deadlifts = within(cardFor("Conventional Deadlift"));
    await user.type(deadlifts.getByRole("spinbutton", { name: "Conventional Deadlift weight" }), "35");
    await user.click(deadlifts.getByRole("button", { name: /log set/i }));

    expect(deadlifts.getByText(/^20 reps · 35kg ·/)).toBeInTheDocument();
  });
});

describe("Flow 4: Swap an exercise", () => {
  it("uses the deterministic engine and shows what changed", async () => {
    const user = userEvent.setup();
    render(<TodayScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /^swap$/i })[0]!);

    // Squats' only eligible library alternate is Bulgarian Split Squat (confirmed by the Phase 2 domain tests).
    // The exercise-card heading is gone — Squats no longer has its own card.
    expect(screen.queryByRole("heading", { name: "Back Squat", level: 3 })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bulgarian Split Squat", level: 3 })).toBeInTheDocument();

    // The swap banner explains what changed (not just a silently-updated card) — "Back Squat" legitimately
    // still appears here, struck through, as the "before" side of the comparison.
    expect(screen.getByText(/Swapped/)).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });
});

describe("Flow 8: Complete a workout", () => {
  it("shows a completion summary with duration, exercises completed, and progression recommendations", async () => {
    const user = userEvent.setup();
    render(<TodayScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    // Log one set so there's something to show a recommendation for.
    await user.click(screen.getAllByRole("button", { name: /log set/i })[0]!);
    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    expect(screen.getByText("Workout Complete")).toBeInTheDocument();
    expect(screen.getByText("1/25")).toBeInTheDocument();
    expect(screen.getByText("Progression recommendations")).toBeInTheDocument();
    // Squats logged at exactly prescribed weight/reps with default feedback -> "maintain".
    const squatsRow = within(screen.getByText("Back Squat").closest("li")!);
    expect(squatsRow.getByText(/→ Maintain/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(screen.getByRole("button", { name: /start workout/i })).toBeInTheDocument();
  });
});

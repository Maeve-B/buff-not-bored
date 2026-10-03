import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StrengthScreen } from "@/components/strength/StrengthScreen";
import { getInitialStrengthState, useStrengthStore } from "@/lib/strength-store";

// Persistence is exercised separately (test/save-workout.integration.test.ts,
// test/store-persistence.test.tsx) — these UI flow tests shouldn't depend on
// a real database, per ARCHITECTURE.md §9 ("apps/web Server Actions: Vitest,
// domain/db mocked").
vi.mock("@/lib/actions/save-workout", () => ({
  persistWorkoutSnapshot: vi.fn(async () => ({ ok: true, id: "mock-workout-id" })),
}));

beforeEach(() => {
  useStrengthStore.setState(getInitialStrengthState());
});

function squatsCard(): HTMLElement {
  return screen.getByRole("heading", { name: "Squats", level: 3 }).closest("div")!.parentElement!;
}

describe("Classic Strength — has proper set-based semantics, distinct from Circuit", () => {
  it("the overview shows exercise and set counts, not a single-set circuit summary", () => {
    render(<StrengthScreen />);
    expect(screen.getByText("Full Body Strength")).toBeInTheDocument();
    expect(screen.getByText(/\d+ exercises · \d+ sets/)).toBeInTheDocument();
  });

  it("starting the workout shows multiple sets per exercise, each with its own target", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const squats = within(squatsCard());
    expect(squats.getByText("Set 1")).toBeInTheDocument();
    expect(squats.getByText("Set 2")).toBeInTheDocument();
    expect(squats.getByText("Set 3")).toBeInTheDocument();
    expect(squats.getAllByText(/Target: 20 reps @ 20kg/)).toHaveLength(3); // Squats: 3 sets, same target
  });

  it("logging one set does not affect the other sets on the same exercise — per-set completion, not per-exercise", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const squats = within(squatsCard());
    await user.click(squats.getByRole("button", { name: "Complete set 1" }));

    // Set 1 is now logged; sets 2 and 3 (same exercise) are still awaiting input.
    expect(squats.getByRole("button", { name: "Complete set 2" })).toBeInTheDocument();
    expect(squats.getByRole("button", { name: "Complete set 3" })).toBeInTheDocument();
    expect(screen.getByText(/1\/\d+ sets logged/)).toBeInTheDocument();
  });

  it("finishing the workout shows a completion summary with set counts and progression recommendations", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));
    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    expect(screen.getByText("Workout Complete")).toBeInTheDocument();
    expect(screen.getByText(/^1\/\d+$/)).toBeInTheDocument(); // sets completed stat
    expect(screen.getByText("Progression recommendations")).toBeInTheDocument();
    // Logged Squats at exactly its target (20 reps @ 20kg, no adjustment) -> engine recommends maintain.
    expect(screen.getByText(/→ Maintain/)).toBeInTheDocument();
  });

  it("'Done' returns to the overview for a fresh session", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));
    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));
    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(screen.getByRole("button", { name: /start workout/i })).toBeInTheDocument();
  });
});

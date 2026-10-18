import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StrengthScreen } from "@/components/strength/StrengthScreen";
import { saveStartingWeight } from "@/lib/actions/exercise-capability";
import { getInitialStrengthState, useStrengthStore } from "@/lib/strength-store";

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
  useStrengthStore.setState(getInitialStrengthState());
  vi.mocked(saveStartingWeight).mockClear();
});

function squatsCard(): HTMLElement {
  return screen.getByRole("heading", { name: "Squats", level: 3 }).closest("div")!.parentElement!;
}

describe("Classic Strength — has proper set-based semantics, distinct from Circuit", () => {
  it("the overview shows exercise and set counts, not a single-set circuit summary", () => {
    render(<StrengthScreen currentWeights={{}} />);
    expect(screen.getByText("Full Body Strength")).toBeInTheDocument();
    expect(screen.getByText(/\d+ exercises · \d+ sets/)).toBeInTheDocument();
  });

  it("starting the workout shows multiple sets per exercise, each with its own target", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 20 }} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const squats = within(squatsCard());
    expect(squats.getByText("Set 1")).toBeInTheDocument();
    expect(squats.getByText("Set 2")).toBeInTheDocument();
    expect(squats.getByText("Set 3")).toBeInTheDocument();
    expect(squats.getAllByText(/Target: 20 reps @ 20kg/)).toHaveLength(3); // Squats: 3 sets, same target
  });

  it("logging one set does not affect the other sets on the same exercise — per-set completion, not per-exercise", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
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
    render(<StrengthScreen currentWeights={{ squats: 20 }} />);
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
    render(<StrengthScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));
    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));
    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(screen.getByRole("button", { name: /start workout/i })).toBeInTheDocument();
  });
});

describe("Classic Strength — your weights (S-002)", () => {
  it("asks for a weight on a loaded exercise you haven't set one for", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const squats = within(squatsCard());
    expect(squats.getAllByText("Weight (kg)")).toHaveLength(3);
    expect(squats.getByRole("spinbutton", { name: "Set 1 weight" })).toHaveValue(null);
  });

  it("turns the first weight you log into the target for the remaining sets and for next time", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    await user.type(within(squatsCard()).getByRole("spinbutton", { name: "Set 1 weight" }), "20.25");
    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));

    expect(saveStartingWeight).toHaveBeenCalledWith("squats", 20.25);
    expect(within(squatsCard()).getByText(/20\.25kg × 20 reps/)).toBeInTheDocument();
    expect(within(squatsCard()).getAllByText(/Target: 20 reps @ 20\.25kg/)).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));
    await user.click(screen.getByRole("button", { name: /start workout/i }));
    expect(within(squatsCard()).getAllByText(/Target: 20 reps @ 20\.25kg/)).toHaveLength(3);
  });

  it("logs a heavier lift for that session only, never changing your weight (§3.3)", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 20 }} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const weightBox = within(squatsCard()).getByRole("spinbutton", { name: "Set 1 weight" });
    await user.clear(weightBox);
    await user.type(weightBox, "25");
    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));

    expect(saveStartingWeight).not.toHaveBeenCalled();
    expect(within(squatsCard()).getAllByText(/Target: 20 reps @ 20kg/)).toHaveLength(3);
  });
});

describe("Classic Strength — your weights, edge cases (S-002 review)", () => {
  it("keeps what you've typed into a later set when the first-use weight fills it in", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const squats = within(squatsCard());
    await user.type(squats.getByRole("spinbutton", { name: "Set 2 weight" }), "22");
    await user.type(squats.getByRole("spinbutton", { name: "Set 1 weight" }), "20");
    await user.click(squats.getByRole("button", { name: "Complete set 1" }));

    expect(squats.getByRole("spinbutton", { name: "Set 2 weight" })).toHaveValue(22);
    expect(squats.getByRole("spinbutton", { name: "Set 3 weight" })).toHaveValue(20);
  });

  it("fills in a weight saved elsewhere mid-workout, without changing any existing target", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<StrengthScreen currentWeights={{ squats: 20 }} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    rerender(<StrengthScreen currentWeights={{ squats: 30, deadlifts: 60 }} />);

    expect(within(squatsCard()).getAllByText(/Target: 20 reps @ 20kg/)).toHaveLength(3);
    const deadlifts = within(screen.getByRole("heading", { name: "Deadlifts", level: 3 }).closest("div")!.parentElement!);
    expect(deadlifts.getAllByText(/@ 60kg/)).toHaveLength(3);
  });

  it("says so if a starting weight doesn't save, and doesn't quietly save the next set instead", async () => {
    vi.mocked(saveStartingWeight).mockResolvedValueOnce({ ok: false, error: "database down" });
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const squats = within(squatsCard());
    await user.type(squats.getByRole("spinbutton", { name: "Set 1 weight" }), "20");
    await user.click(squats.getByRole("button", { name: "Complete set 1" }));
    expect(await screen.findByText(/Couldn't save 20kg as your Squats weight/)).toBeInTheDocument();

    const set2 = squats.getByRole("spinbutton", { name: "Set 2 weight" });
    await user.clear(set2);
    await user.type(set2, "25");
    await user.click(squats.getByRole("button", { name: "Complete set 2" }));
    expect(saveStartingWeight).toHaveBeenCalledTimes(1);
  });

  it("never logs a zero or negative weight", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const squats = within(squatsCard());
    await user.type(squats.getByRole("spinbutton", { name: "Set 1 weight" }), "-5");
    await user.click(squats.getByRole("button", { name: "Complete set 1" }));

    expect(squats.getByText(/^20 reps$/)).toBeInTheDocument();
    expect(saveStartingWeight).not.toHaveBeenCalled();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StrengthScreen } from "@/components/strength/StrengthScreen";
import { saveStartingWeight } from "@/lib/actions/exercise-capability";
import { persistWorkoutSnapshot } from "@/lib/actions/save-workout";
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
  vi.mocked(persistWorkoutSnapshot).mockClear();
});

/** The values in a card's weight boxes, for sets not yet logged ("" = blank). */
function weightValues(card: HTMLElement): string[] {
  return within(card)
    .queryAllByRole("spinbutton", { name: /^Set \d weight$/ })
    .map((input) => (input as HTMLInputElement).value);
}

function cardFor(name: string): HTMLElement {
  return screen.getByRole("heading", { name, level: 3 }).closest("div")!.parentElement!;
}

function squatsCard(): HTMLElement {
  return cardFor("Back Squat");
}

async function startSession(user: ReturnType<typeof userEvent.setup>, day?: "Mon" | "Wed" | "Fri") {
  if (day) await user.click(screen.getByRole("button", { name: day }));
  await user.click(screen.getByRole("button", { name: /start workout/i }));
}

describe("Strength runs Preset Programme 1 (S-004, spec §10.1)", () => {
  it("shows the session due, its exercises with sets × range, and a picker for all three", () => {
    render(<StrengthScreen currentWeights={{}} />);
    expect(screen.getByText("Full Body 3× + Pull-Up")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monday" })).toBeInTheDocument();
    expect(screen.getByText("Squat and push")).toBeInTheDocument();
    expect(screen.getByText("7 exercises · 19 sets")).toBeInTheDocument();
    expect(screen.getByText("3 × 6–10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mon" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Wed" })).toHaveAttribute("aria-pressed", "false");
  });

  it("opens on the session the rotation says is due", () => {
    render(<StrengthScreen currentWeights={{}} nextSessionId="wednesday" />);
    expect(screen.getByRole("heading", { name: "Wednesday" })).toBeInTheDocument();
    expect(screen.getByText("Deadlift and shoulders")).toBeInTheDocument();
  });

  it("lets you pick any session, and keeps your pick when the page reloads its suggestion", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<StrengthScreen currentWeights={{}} nextSessionId="monday" />);
    await user.click(screen.getByRole("button", { name: "Fri" }));
    rerender(<StrengthScreen currentWeights={{}} nextSessionId="wednesday" />);
    expect(screen.getByRole("heading", { name: "Friday" })).toBeInTheDocument();

    await startSession(user);
    expect(screen.getByRole("heading", { name: "Friday · Glutes and legs", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hip Thrust Machine", level: 3 })).toBeInTheDocument();
  });

  it("starts each set at the bottom of its range, reps first, then weight, labelled beneath", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 40 }} />);
    await startSession(user);

    const squats = within(squatsCard());
    expect(squats.getByText("3 × 6–10 · Barbell")).toBeInTheDocument();
    expect(squats.getAllByRole("spinbutton", { name: /^Set \d reps$/ }).map((input) => (input as HTMLInputElement).value)).toEqual(["6", "6", "6"]);
    expect(weightValues(squatsCard())).toEqual(["40", "40", "40"]);
    expect(squats.getAllByText("reps")).toHaveLength(3);
    expect(squats.getAllByText("weight (kg)")).toHaveLength(3);
    const [repsBox, weightBox] = squats.getAllByRole("spinbutton").slice(0, 2);
    expect(repsBox).toHaveAccessibleName("Set 1 reps");
    expect(weightBox).toHaveAccessibleName("Set 1 weight");
  });

  it("shows rest as a recommendation only, with no timer", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);
    expect(within(squatsCard()).getByText("Recommended rest 2–3 min")).toBeInTheDocument();
    expect(within(cardFor("Captain's Chair Knee Raise")).getByText("Recommended rest 60–90 s")).toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("shows a superset as one pair, sharing one rest line", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);

    const pair = within(screen.getByRole("region", { name: "Superset: Seated Cable Row and Lateral Raises" }));
    expect(pair.getByText("Superset · alternate sets")).toBeInTheDocument();
    expect(pair.getByText("Recommended rest 2–3 min, after both")).toBeInTheDocument();
    expect(pair.getByRole("heading", { name: "Seated Cable Row", level: 3 })).toBeInTheDocument();
    expect(pair.getByRole("heading", { name: "Lateral Raises", level: 3 })).toBeInTheDocument();
    expect(pair.queryByText(/^Recommended rest .* (min|s)$/)).not.toBeInTheDocument();
  });

  it("asks for assistance on the assisted exercises, in seconds for the dead hang", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);

    const pullUp = within(cardFor("Assisted Pull-Up"));
    expect(pullUp.getAllByText("assistance (kg)")).toHaveLength(3);
    const hang = within(cardFor("Assisted Dead Hang"));
    expect(hang.getByText("3 × 20–30 s · Machine")).toBeInTheDocument();
    expect(hang.getAllByText("seconds")).toHaveLength(3);
    expect(hang.getAllByText("assistance (kg)")).toHaveLength(3);
  });

  it("logs a timed carry with its weight, seconds first, and saves that as your starting weight", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user, "Fri");

    const carry = within(cardFor("Farmer Carry"));
    expect(carry.getAllByText("weight each (kg)")).toHaveLength(3);
    await user.type(carry.getByRole("spinbutton", { name: "Set 1 weight" }), "16");
    await user.click(carry.getByRole("button", { name: "Complete set 1" }));

    expect(carry.getByText("30s × 16kg")).toBeInTheDocument();
    expect(saveStartingWeight).toHaveBeenCalledWith("farmer-carry", 16);
  });

  it("counts the woodchop per side", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user, "Wed");
    const woodchop = within(cardFor("Cable Woodchop"));
    expect(woodchop.getByText("2 × 10 per side · Cable")).toBeInTheDocument();
    expect(woodchop.getAllByText("reps / side")).toHaveLength(2);
  });

  it("saves which session this is, so the rotation can read it back", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} nextSessionId="wednesday" />);
    await startSession(user);
    expect(persistWorkoutSnapshot).toHaveBeenLastCalledWith(
      expect.objectContaining({
        workoutName: "Wednesday · Deadlift and shoulders",
        programmeId: "preset-programme-1",
        scheduledWorkoutId: "wednesday",
      }),
    );
  });
});

describe("The rotation (D-011)", () => {
  it("moves on to the next session once you've logged a set", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);
    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));
    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(screen.getByRole("heading", { name: "Wednesday" })).toBeInTheDocument();
  });

  it("isn't moved back by a page still holding the older suggestion", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<StrengthScreen currentWeights={{}} nextSessionId="monday" />);
    await startSession(user);
    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));
    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));

    rerender(<StrengthScreen currentWeights={{}} nextSessionId="tuesday-stale" />);
    rerender(<StrengthScreen currentWeights={{}} nextSessionId="monday" />);
    expect(screen.getByRole("heading", { name: "Wednesday" })).toBeInTheDocument();
  });

  it("offers the same session again if nothing was logged", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);
    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(screen.getByRole("heading", { name: "Monday" })).toBeInTheDocument();
  });
});

describe("Strength — per-set logging and the summary", () => {
  it("logging one set does not affect the other sets on the same exercise", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);

    const squats = within(squatsCard());
    await user.click(squats.getByRole("button", { name: "Complete set 1" }));

    expect(squats.getByRole("button", { name: "Complete set 2" })).toBeInTheDocument();
    expect(squats.getByRole("button", { name: "Complete set 3" })).toBeInTheDocument();
    expect(screen.getByText(/1\/\d+ sets logged/)).toBeInTheDocument();
  });

  it("finishing the workout shows a completion summary with set counts and the progress notification", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 20 }} />);
    await startSession(user);

    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));
    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    expect(screen.getByText("Workout Complete")).toBeInTheDocument();
    expect(screen.getByText(/^1\/\d+$/)).toBeInTheDocument();
    expect(screen.getByText("Progress this session")).toBeInTheDocument();
  });
});

describe("The progress notification (S-005, §7.4 — information only)", () => {
  /** Logs every set of an exercise at the given reps (or seconds), optionally retyping the weight. */
  async function logAll(user: ReturnType<typeof userEvent.setup>, name: string, amount: number, weight?: string) {
    const card = within(cardFor(name));
    const sets = card.getAllByRole("button", { name: /^Complete set \d$/ }).length;
    for (let n = 1; n <= sets; n++) {
      const box = card.getByRole("spinbutton", { name: new RegExp(`^Set ${n} (reps|duration)$`) });
      await user.clear(box);
      await user.type(box, String(amount));
      if (weight !== undefined) {
        const weightBox = card.getByRole("spinbutton", { name: `Set ${n} weight` });
        await user.clear(weightBox);
        await user.type(weightBox, weight);
      }
      await user.click(card.getByRole("button", { name: `Complete set ${n}` }));
    }
  }

  function notification(name: string): HTMLElement {
    return screen.getByRole("link", { name }).closest("li")!;
  }

  it("says you're ready to go up when every set reached the top, with the real jumps as options", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 40 }} />);
    await startSession(user);
    await logAll(user, "Back Squat", 10);
    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    const row = within(notification("Back Squat"));
    expect(row.getByText("Ready to go up")).toBeInTheDocument();
    expect(row.getByText("10 reps on every set. Options: +0.25 / +0.5 / +1 / +2.5 / +5 kg.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back Squat" })).toHaveAttribute("href", "/exercises/squats");
  });

  it("suggests more reps when not every set reached the top", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ "flat-db-press": 10 }} />);
    await startSession(user);
    await logAll(user, "DB Bench Press", 9);
    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    const row = within(notification("DB Bench Press"));
    expect(row.getByText("Not yet")).toBeInTheDocument();
    expect(row.getByText("0 of 3 sets reached 12 reps. Aim for more reps next time at 10kg.")).toBeInTheDocument();
  });

  it("offers less assistance on the assisted pull-up", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ "assisted-pull-up": 25 }} />);
    await startSession(user);
    await logAll(user, "Assisted Pull-Up", 8);
    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    const row = within(notification("Assisted Pull-Up"));
    expect(row.getByText("Ready to drop assistance")).toBeInTheDocument();
    expect(row.getByText(/^8 reps on every set\. Options: −0\.25 \/ −0\.5/)).toBeInTheDocument();
  });

  it("says reps per side, and assistance rather than load, where that's how the exercise counts", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ "cable-woodchop": 10, "assisted-pull-up": 25 }} nextSessionId="wednesday" />);
    await startSession(user);
    await logAll(user, "Cable Woodchop", 10);
    await logAll(user, "Assisted Pull-Up", 5);
    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    expect(within(notification("Cable Woodchop")).getByText(/^10 reps per side on every set\./)).toBeInTheDocument();
    expect(within(notification("Assisted Pull-Up")).getByText("0 of 3 sets reached 8 reps. Aim for more reps next time at 25kg assistance.")).toBeInTheDocument();
  });

  it("doesn't count a lighter day", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 40 }} />);
    await startSession(user);
    await logAll(user, "Back Squat", 10, "35");
    await user.click(screen.getByRole("button", { name: /finish workout/i }));

    expect(within(notification("Back Squat")).getByText("A set was lighter than your 40kg, so this one doesn't count.")).toBeInTheDocument();
  });

  it("never changes your weight: the next session prescribes the same (§3.3)", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 40 }} />);
    await startSession(user);
    await logAll(user, "Back Squat", 10);
    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    expect(screen.getByText("Ready to go up")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /done/i }));
    await startSession(user, "Mon");
    expect(weightValues(squatsCard())).toEqual(["40", "40", "40"]);
    expect(useStrengthStore.getState().currentWeights).toEqual({ squats: 40 });
    expect(saveStartingWeight).not.toHaveBeenCalled();
  });

  it("no longer shows the old percentage suggestions", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 40 }} />);
    await startSession(user);
    await logAll(user, "Back Squat", 10);
    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    expect(screen.queryByText("Progression recommendations")).not.toBeInTheDocument();
    expect(screen.queryByText(/kg → /)).not.toBeInTheDocument();
  });
});

describe("Ready to go up, next time you do the exercise (D-014)", () => {
  const atTop = { actualReps: 10, actualWeight: 40 };
  const lastTime = { squats: { workoutId: "earlier", dateIso: "2026-10-19", weight: 40, sets: [atTop, atTop, atTop] } };

  it("shows on the overview, linking to the exercise page, and on the card without a link", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 40 }} lastTime={lastTime} />);
    expect(screen.getByRole("link", { name: "Ready to go up: change weight" })).toHaveAttribute("href", "/exercises/squats");

    await startSession(user);
    const card = within(squatsCard());
    expect(card.getByText(/Last time: 10 reps on every set\. Options: \+0\.25/)).toBeInTheDocument();
    expect(card.queryByRole("link")).not.toBeInTheDocument();
  });

  it("prefers the newer record when this tab and the page disagree", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<StrengthScreen currentWeights={{ squats: 40 }} lastTime={{}} />);
    await startSession(user);
    const card = within(squatsCard());
    for (const n of [1, 2, 3]) {
      const reps = card.getByRole("spinbutton", { name: `Set ${n} reps` });
      await user.clear(reps);
      await user.type(reps, "10");
      await user.click(card.getByRole("button", { name: `Complete set ${n}` }));
    }
    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));

    // A later session elsewhere (say, your phone) that didn't reach the top.
    const short = { actualReps: 7, actualWeight: 40 };
    rerender(
      <StrengthScreen currentWeights={{ squats: 40 }} lastTime={{ squats: { workoutId: "phone", dateIso: "2999-01-01", weight: 40, sets: [short, short, short] } }} />,
    );
    await user.click(screen.getByRole("button", { name: "Mon" }));
    expect(screen.queryByRole("link", { name: "Ready to go up: change weight" })).not.toBeInTheDocument();
  });

  it("doesn't offer to change the weight on a bodyweight exercise", () => {
    const twelve = { actualReps: 12 };
    render(
      <StrengthScreen
        currentWeights={{}}
        lastTime={{ "captains-chair-knee-raise": { workoutId: "earlier", dateIso: "2026-10-19", sets: [twelve, twelve] } }}
      />,
    );
    expect(screen.getByText("Captain's Chair Knee Raise").closest("li")!).toHaveTextContent("Top of the range");
    expect(screen.queryByRole("link", { name: /Top of the range/ })).not.toBeInTheDocument();
  });

  it("goes away once you've changed the weight", () => {
    render(<StrengthScreen currentWeights={{ squats: 42.5 }} lastTime={lastTime} />);
    expect(screen.queryByText("Ready to go up")).not.toBeInTheDocument();
  });

  it("shows next time after a session in this tab, but not during the session itself", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 40 }} lastTime={{}} />);
    await startSession(user);
    const card = within(squatsCard());
    for (const n of [1, 2, 3]) {
      const reps = card.getByRole("spinbutton", { name: `Set ${n} reps` });
      await user.clear(reps);
      await user.type(reps, "10");
      await user.click(card.getByRole("button", { name: `Complete set ${n}` }));
    }
    expect(card.queryByText(/^Last time:/)).not.toBeInTheDocument();
    expect(card.queryByText("Ready to go up.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));
    await user.click(screen.getByRole("button", { name: "Mon" }));
    expect(screen.getByRole("link", { name: "Ready to go up: change weight" })).toBeInTheDocument();
  });
});

describe("Strength — your weights (S-002)", () => {
  it("asks for a weight on a loaded exercise you haven't set one for", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);

    expect(weightValues(squatsCard())).toEqual(["", "", ""]);
    expect(within(squatsCard()).getByRole("spinbutton", { name: "Set 1 weight" })).toHaveValue(null);
  });

  it("turns the first weight you log into the target for the remaining sets and for next time", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);

    await user.type(within(squatsCard()).getByRole("spinbutton", { name: "Set 1 weight" }), "20.25");
    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));

    expect(saveStartingWeight).toHaveBeenCalledWith("squats", 20.25);
    expect(within(squatsCard()).getByText("6 reps × 20.25kg")).toBeInTheDocument();
    expect(weightValues(squatsCard())).toEqual(["20.25", "20.25"]);

    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));
    await startSession(user, "Mon");
    expect(weightValues(squatsCard())).toEqual(["20.25", "20.25", "20.25"]);
  });

  it("logs a heavier lift for that session only, never changing your weight (§3.3)", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{ squats: 20 }} />);
    await startSession(user);

    const weightBox = within(squatsCard()).getByRole("spinbutton", { name: "Set 1 weight" });
    await user.clear(weightBox);
    await user.type(weightBox, "25");
    await user.click(within(squatsCard()).getByRole("button", { name: "Complete set 1" }));

    expect(saveStartingWeight).not.toHaveBeenCalled();
    expect(weightValues(squatsCard())).toEqual(["20", "20"]);
  });
});

describe("Strength — your weights, edge cases (S-002 review)", () => {
  it("keeps what you've typed into a later set when the first-use weight fills it in", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);

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
    await startSession(user);

    rerender(<StrengthScreen currentWeights={{ squats: 30, "flat-db-press": 10 }} />);

    expect(weightValues(squatsCard())).toEqual(["20", "20", "20"]);
    expect(weightValues(cardFor("DB Bench Press"))).toEqual(["10", "10", "10"]);
  });

  it("says so if a starting weight doesn't save, and doesn't quietly save the next set instead", async () => {
    vi.mocked(saveStartingWeight).mockResolvedValueOnce({ ok: false, error: "database down" });
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);

    const squats = within(squatsCard());
    await user.type(squats.getByRole("spinbutton", { name: "Set 1 weight" }), "20");
    await user.click(squats.getByRole("button", { name: "Complete set 1" }));
    expect(await screen.findByText(/Couldn't save 20kg as your Back Squat weight/)).toBeInTheDocument();

    const set2 = squats.getByRole("spinbutton", { name: "Set 2 weight" });
    await user.clear(set2);
    await user.type(set2, "25");
    await user.click(squats.getByRole("button", { name: "Complete set 2" }));
    expect(saveStartingWeight).toHaveBeenCalledTimes(1);
  });

  it("never logs a zero or negative weight", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);

    const squats = within(squatsCard());
    await user.type(squats.getByRole("spinbutton", { name: "Set 1 weight" }), "-5");
    await user.click(squats.getByRole("button", { name: "Complete set 1" }));

    expect(squats.getByText(/^6 reps$/)).toBeInTheDocument();
    expect(saveStartingWeight).not.toHaveBeenCalled();
  });

  it("asks for no weight on a bodyweight exercise", async () => {
    const user = userEvent.setup();
    render(<StrengthScreen currentWeights={{}} />);
    await startSession(user);
    const chair = within(cardFor("Captain's Chair Knee Raise"));
    expect(chair.getAllByText("reps")).toHaveLength(2);
    expect(chair.queryByText(/\(kg\)/)).not.toBeInTheDocument();
    expect(chair.queryByRole("spinbutton", { name: /weight/ })).not.toBeInTheDocument();
  });
});

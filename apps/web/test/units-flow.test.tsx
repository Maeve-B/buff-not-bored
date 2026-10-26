import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsForm } from "@/components/SettingsForm";
import { TodayScreen } from "@/components/TodayScreen";
import { StrengthScreen } from "@/components/strength/StrengthScreen";
import { saveStartingWeight } from "@/lib/actions/exercise-capability";
import { saveWeightUnit } from "@/lib/actions/settings";
import { getInitialState, useAppStore } from "@/lib/store";
import { getInitialStrengthState, useStrengthStore } from "@/lib/strength-store";
import { WeightUnitProvider } from "@/lib/weight-unit";

vi.mock("@/lib/actions/save-workout", () => ({
  persistWorkoutSnapshot: vi.fn(async () => ({ ok: true, id: "mock-workout-id" })),
}));
vi.mock("@/lib/actions/exercise-capability", () => ({
  saveStartingWeight: vi.fn(async () => ({ ok: true, saved: true })),
}));
vi.mock("@/lib/actions/settings", () => ({
  saveWeightUnit: vi.fn(async () => ({ ok: true })),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  useStrengthStore.setState(getInitialStrengthState());
  useAppStore.setState(getInitialState());
  vi.mocked(saveStartingWeight).mockClear();
  refresh.mockClear();
});

function inLb(children: ReactNode) {
  return <WeightUnitProvider unit="lb">{children}</WeightUnitProvider>;
}

function cardFor(name: string): HTMLElement {
  return screen.getByRole("heading", { name, level: 3 }).closest("div")!.parentElement!;
}

describe("Settings: kg or lb (S-006)", () => {
  it("saves the unit you pick and refreshes the page so every weight follows", async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);
    expect(screen.getByRole("radio", { name: "Kilograms (kg)" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Pounds (lb)" }));
    expect(saveWeightUnit).toHaveBeenCalledWith("lb");
    expect(refresh).toHaveBeenCalled();
  });
});

describe("Strength in lb (S-006)", () => {
  it("shows your kg weight in lb, and logs it back without changing it", async () => {
    const user = userEvent.setup();
    render(inLb(<StrengthScreen currentWeights={{ squats: 40 }} />));
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const squat = within(cardFor("Back Squat"));
    expect(squat.getAllByText("weight (lb)")).toHaveLength(3);
    expect(squat.getByRole("spinbutton", { name: "Set 1 weight" })).toHaveValue(88);
    await user.click(squat.getByRole("button", { name: "Complete set 1" }));

    expect(squat.getByText("6 reps × 88lb")).toBeInTheDocument();
    const logged = useStrengthStore.getState().session.exercises.find((se) => se.exercise.id === "squats")!.sets[0]!;
    expect(logged.actualWeight).toBe(40);
  });

  it("saves a first-use weight typed in lb as kg, and keeps it at 0.5 lb precision", async () => {
    const user = userEvent.setup();
    render(inLb(<StrengthScreen currentWeights={{}} />));
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const bench = within(cardFor("DB Bench Press"));
    expect(bench.getAllByText("weight each (lb)")).toHaveLength(3);
    await user.type(bench.getByRole("spinbutton", { name: "Set 1 weight" }), "22.5");
    await user.click(bench.getByRole("button", { name: "Complete set 1" }));

    expect(vi.mocked(saveStartingWeight).mock.lastCall![1]).toBeCloseTo(10.206, 3);
    expect(bench.getByRole("spinbutton", { name: "Set 2 weight" })).toHaveValue(22.5);
  });

  it("labels assistance in lb", async () => {
    const user = userEvent.setup();
    render(inLb(<StrengthScreen currentWeights={{}} />));
    await user.click(screen.getByRole("button", { name: /start workout/i }));
    expect(within(cardFor("Assisted Pull-Up")).getAllByText("assistance (lb)")).toHaveLength(3);
  });

  it("offers the lb jumps when you're ready to go up", async () => {
    const user = userEvent.setup();
    render(inLb(<StrengthScreen currentWeights={{ squats: 40 }} />));
    await user.click(screen.getByRole("button", { name: /start workout/i }));
    const squat = within(cardFor("Back Squat"));
    for (const n of [1, 2, 3]) {
      const reps = squat.getByRole("spinbutton", { name: `Set ${n} reps` });
      await user.clear(reps);
      await user.type(reps, "10");
      await user.click(squat.getByRole("button", { name: `Complete set ${n}` }));
    }
    await user.click(screen.getByRole("button", { name: /finish workout/i }));
    expect(screen.getByText("10 reps on every set. Options: +0.5 / +1 / +2.5 / +5 lb.")).toBeInTheDocument();
  });
});

describe("Circuit in lb (S-006)", () => {
  it("steps a barbell by 5 lb and logs kg", async () => {
    const user = userEvent.setup();
    render(inLb(<TodayScreen currentWeights={{ squats: 20 }} />));
    await user.click(screen.getByRole("button", { name: /start workout/i }));

    const squat = within(screen.getByRole("heading", { name: "Back Squat", level: 3 }).parentElement!.parentElement!.parentElement!.parentElement!);
    expect(squat.getByText(/^20 reps · 44lb ·/)).toBeInTheDocument();
    await user.click(squat.getByRole("button", { name: "Increase Weight" }));
    expect(squat.getByText("49lb")).toBeInTheDocument();
    await user.click(squat.getByRole("button", { name: /log set/i }));

    expect(squat.getByText("20 reps × 49lb")).toBeInTheDocument();
    expect(useAppStore.getState().setLogs.squats!.actualWeight).toBeCloseTo(22.226, 3);
  });
});

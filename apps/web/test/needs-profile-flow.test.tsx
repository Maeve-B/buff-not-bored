import { EXERCISES, type SavedNeedsProfile } from "@buff-not-bored/domain";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NeedsProfileForm } from "@/components/NeedsProfileForm";
import { saveNeedsProfile } from "@/lib/actions/needs-profile";
import { WeightUnitProvider } from "@/lib/weight-unit";

vi.mock("@/lib/actions/needs-profile", () => ({
  saveNeedsProfile: vi.fn(async (profile) => ({ ok: true, profile: { ...profile, confirmedAt: "2026-10-28T10:00:00.000Z" } })),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const exercises = EXERCISES.map((e) => ({ id: e.id, name: e.name }));

beforeEach(() => {
  vi.mocked(saveNeedsProfile).mockClear();
  refresh.mockClear();
});

function section(name: string) {
  return within(screen.getByRole("group", { name }));
}

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await user.click(section("Goal").getByRole("radio", { name: "Get stronger" }));
  await user.click(section("Goal").getByRole("radio", { name: "Pull-up" }));
  await user.click(section("Experience").getByRole("radio", { name: "A year or more" }));
  await user.click(section("Experience").getByRole("radio", { name: /^Free weights/ }));
  await user.click(section("Experience").getByRole("radio", { name: "Confident" }));
  for (const day of ["Mon", "Wed", "Fri"]) await user.click(section("Schedule").getByRole("checkbox", { name: day }));
  for (const item of ["Barbell", "Squat rack", "Dumbbells", "Bench"]) await user.click(section("Equipment").getByRole("checkbox", { name: item }));
}

describe("Your training needs (S-008)", () => {
  it("starts empty, works out your experience level as you answer, and saves", async () => {
    const user = userEvent.setup();
    render(<NeedsProfileForm initial={undefined} exercises={exercises} />);
    expect(screen.getByText("answer the three questions")).toBeInTheDocument();

    await fillIn(user);
    expect(screen.getByText("Advanced")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save my training needs" }));

    expect(saveNeedsProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        goal: "strength",
        emphasis: "pull_up",
        daysPerWeek: 3,
        preferredDays: [1, 3, 5],
        equipment: ["barbell", "rack", "dumbbells", "bench"],
        source: "form",
      }),
    );
    expect(await screen.findByText(/Saved\. Your programme will be built around these answers\./)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("shows each problem next to its answer and doesn't save", async () => {
    const user = userEvent.setup();
    render(<NeedsProfileForm initial={undefined} exercises={exercises} />);
    await user.click(section("Schedule").getByRole("checkbox", { name: "Mon" }));
    await user.click(screen.getByRole("button", { name: "Save my training needs" }));

    expect(section("Goal").getByText("Choose a goal.")).toBeInTheDocument();
    expect(section("Experience").getByText("Say how long you've trained regularly.")).toBeInTheDocument();
    expect(saveNeedsProfile).not.toHaveBeenCalled();

    await fillIn(user); // also ticks Mon again (off), then Wed, Fri: only 2 days for 3 a week
    await user.click(screen.getByRole("button", { name: "Save my training needs" }));
    expect(section("Schedule").getByText("Pick 3 preferred days to match your days a week, or none.")).toBeInTheDocument();
    expect(saveNeedsProfile).not.toHaveBeenCalled();
  });

  it("picks several exercises to avoid and favour, and shows every problem at once", async () => {
    const user = userEvent.setup();
    render(<NeedsProfileForm initial={undefined} exercises={exercises} />);
    await fillIn(user);

    await user.click(screen.getByText(/^Avoid \(optional\)/));
    const avoid = within(screen.getByRole("group", { name: "Avoid" }));
    await user.click(avoid.getByRole("checkbox", { name: "Bulgarian Split Squat" }));
    await user.click(avoid.getByRole("checkbox", { name: "Lunges (Alternating)" }));
    expect(screen.getByText("Avoid (optional) · 2 chosen")).toBeInTheDocument();

    const minutes = screen.getByLabelText("Session length (minutes)");
    await user.clear(minutes);
    await user.click(section("Schedule").getByRole("checkbox", { name: "Fri" })); // now 2 days for 3 a week
    await user.click(screen.getByRole("button", { name: "Save my training needs" }));
    expect(section("Schedule").getByText("Session length should be 20–180 minutes.")).toBeInTheDocument();
    expect(section("Schedule").getByText("Pick 3 preferred days to match your days a week, or none.")).toBeInTheDocument();
    expect(saveNeedsProfile).not.toHaveBeenCalled();

    await user.type(minutes, "45");
    await user.click(section("Schedule").getByRole("checkbox", { name: "Fri" }));
    await user.click(screen.getByRole("button", { name: "Save my training needs" }));
    expect(saveNeedsProfile).toHaveBeenCalledWith(
      expect.objectContaining({ sessionMinutes: 45, avoidExerciseIds: ["bulgarian-split-squat", "lunges"] }),
    );
  });

  it("comes back with your saved answers to edit, and takes your heaviest dumbbell in your unit", async () => {
    const saved: SavedNeedsProfile = {
      goal: "hypertrophy",
      trainingDuration: "2_to_12_months",
      trainingKind: "free_weights",
      techniqueConfidence: "low",
      daysPerWeek: 2,
      preferredDays: [],
      sessionMinutes: 45,
      equipment: ["dumbbells", "bench"],
      heaviestDumbbellKg: 20,
      limitations: ["knee"],
      avoidExerciseIds: [],
      favouriteExerciseIds: [],
      source: "form",
      confirmedAt: "2026-10-20T10:00:00.000Z",
    };
    const user = userEvent.setup();
    render(
      <WeightUnitProvider unit="lb">
        <NeedsProfileForm initial={saved} exercises={exercises} />
      </WeightUnitProvider>,
    );
    expect(section("Goal").getByRole("radio", { name: "Build muscle" })).toBeChecked();
    expect(section("Limitations").getByRole("checkbox", { name: "Knee" })).toBeChecked();
    expect(screen.getByText("Beginner")).toBeInTheDocument(); // 2–12 months, stepped down for low technique confidence
    expect(screen.getByLabelText("Heaviest dumbbell (lb, optional)")).toHaveValue(44);

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(vi.mocked(saveNeedsProfile).mock.lastCall![0].heaviestDumbbellKg).toBe(20); // unchanged, so kept exactly

    const box = screen.getByLabelText("Heaviest dumbbell (lb, optional)");
    await user.clear(box);
    await user.type(box, "50");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(vi.mocked(saveNeedsProfile).mock.lastCall![0].heaviestDumbbellKg).toBeCloseTo(22.68, 2);
  });
});

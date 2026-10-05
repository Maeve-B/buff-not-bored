import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Exercise, ExerciseCapability } from "@buff-not-bored/domain";
import { ExerciseCapabilityForm } from "@/components/ExerciseCapabilityForm";
import { saveExerciseCapability } from "@/lib/actions/exercise-capability";

// Persistence is exercised separately (test/exercise-capability-action.integration.test.ts) —
// this UI flow test shouldn't depend on a real database, same convention as
// test/today-flow.test.tsx for save-workout.
vi.mock("@/lib/actions/exercise-capability", () => ({
  loadExerciseCapability: vi.fn(async () => undefined),
  saveExerciseCapability: vi.fn(),
}));

const backSquat: Exercise = {
  id: "back-squat",
  name: "Back Squat",
  programmeGroup: "legs",
  primaryMuscles: ["quads"],
  secondaryMuscles: [],
  movementPatterns: ["squat"],
  exerciseType: "compound",
  equipment: "barbell",
  location: "rack",
  startingWeight: 20,
  weightUnit: "kg",
  prescribedReps: 8,
  repsUnit: "reps",
  progressionPercentage: 5,
  active: true,
};

const existingCapability: ExerciseCapability = {
  exerciseId: "back-squat",
  weight: 60,
  weightUnit: "kg",
  reps: 5,
  repsUnit: "reps",
  source: "manual",
  note: "felt strong",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

describe("ExerciseCapabilityForm", () => {
  it("renders with empty fields when no capability has ever been set", () => {
    render(<ExerciseCapabilityForm exercise={backSquat} initialCapability={undefined} />);
    expect(screen.getByLabelText("Weight")).toHaveValue(null);
    expect(screen.getByLabelText("Reps")).toHaveValue(null);
  });

  it("pre-fills fields from an existing capability", () => {
    render(<ExerciseCapabilityForm exercise={backSquat} initialCapability={existingCapability} />);
    expect(screen.getByLabelText("Weight")).toHaveValue(60);
    expect(screen.getByLabelText("Reps")).toHaveValue(5);
    expect(screen.getByLabelText("Note (optional)")).toHaveValue("felt strong");
  });

  it("saves an edit with source 'manual' and shows the saved state", async () => {
    vi.mocked(saveExerciseCapability).mockResolvedValue({
      ok: true,
      capability: { ...existingCapability, weight: 65 },
    });
    const user = userEvent.setup();
    render(<ExerciseCapabilityForm exercise={backSquat} initialCapability={existingCapability} />);

    await user.clear(screen.getByLabelText("Weight"));
    await user.type(screen.getByLabelText("Weight"), "65");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(saveExerciseCapability).toHaveBeenCalledWith(
      expect.objectContaining({ exerciseId: "back-squat", weight: 65, source: "manual" }),
    );
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("omits weight/weightUnit entirely when the weight field is left blank", async () => {
    vi.mocked(saveExerciseCapability).mockResolvedValue({
      ok: true,
      capability: { exerciseId: "back-squat", reps: 5, repsUnit: "reps", source: "manual", updatedAt: "now" },
    });
    const user = userEvent.setup();
    render(<ExerciseCapabilityForm exercise={backSquat} initialCapability={existingCapability} />);

    await user.clear(screen.getByLabelText("Weight"));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(saveExerciseCapability).toHaveBeenCalledWith(
      expect.objectContaining({ weight: undefined, weightUnit: undefined }),
    );
  });

  it("shows an error state, with message, when the save fails", async () => {
    vi.mocked(saveExerciseCapability).mockResolvedValue({ ok: false, error: "a capability must specify at least one of weight, reps, or duration" });
    const user = userEvent.setup();
    render(<ExerciseCapabilityForm exercise={backSquat} initialCapability={existingCapability} />);

    await user.clear(screen.getByLabelText("Weight"));
    await user.clear(screen.getByLabelText("Reps"));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/couldn't save this capability/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one of weight, reps, or duration/)).toBeInTheDocument();
  });
});

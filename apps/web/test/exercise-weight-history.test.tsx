import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ExerciseWeightHistoryEntry } from "@buff-not-bored/db";
import { ExerciseWeightHistory } from "@/components/ExerciseWeightHistory";

describe("ExerciseWeightHistory", () => {
  it("shows an empty state when nothing has been recorded yet", () => {
    render(<ExerciseWeightHistory history={[]} />);
    expect(screen.getByText("No weight history yet")).toBeInTheDocument();
  });

  it("lists every entry in the order given, each with its date and weight", () => {
    const history: ExerciseWeightHistoryEntry[] = [
      { dateIso: "2026-09-07", weight: 40 },
      { dateIso: "2026-09-14", weight: 42.5 },
      { dateIso: "2026-09-21", weight: 42.5 },
      { dateIso: "2026-09-28", weight: 35 },
    ];
    render(<ExerciseWeightHistory history={history} />);

    expect(screen.getByText("40kg")).toBeInTheDocument();
    expect(screen.getAllByText("42.5kg")).toHaveLength(2);
    expect(screen.getByText("35kg")).toBeInTheDocument();
  });

  it("marks an increase, a decrease, and an unchanged repeat with the right indicator", () => {
    const history: ExerciseWeightHistoryEntry[] = [
      { dateIso: "2026-09-07", weight: 40 }, // first entry — no indicator
      { dateIso: "2026-09-14", weight: 42.5 }, // increase
      { dateIso: "2026-09-21", weight: 42.5 }, // unchanged
      { dateIso: "2026-09-28", weight: 35 }, // decrease
    ];
    render(<ExerciseWeightHistory history={history} />);

    const icons = screen.getAllByText(/[↑↓→]/);
    expect(icons.map((el) => el.textContent)).toEqual(["↑", "→", "↓"]);
  });
});

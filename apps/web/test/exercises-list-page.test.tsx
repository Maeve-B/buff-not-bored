import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EXERCISES } from "@buff-not-bored/domain";
import ExercisesPage from "@/app/exercises/page";

describe("ExercisesPage", () => {
  it("lists every catalog exercise, grouped under its programme group, linking into its capability editor", () => {
    render(<ExercisesPage />);

    expect(screen.getByRole("heading", { name: "Exercises" })).toBeInTheDocument();

    const sample = EXERCISES[0]!;
    const link = screen.getByRole("link", { name: sample.name });
    expect(link).toHaveAttribute("href", `/exercises/${sample.id}`);

    // Groups are rendered as section headings (e.g. "legs", "core") for any group with exercises.
    const groupsPresent = new Set(EXERCISES.map((e) => e.programmeGroup));
    for (const group of groupsPresent) {
      expect(screen.getByText(group, { selector: "h2" })).toBeInTheDocument();
    }
  });
});

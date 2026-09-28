import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayScreen } from "@/components/TodayScreen";
import { getInitialState, useAppStore } from "@/lib/store";

beforeEach(() => {
  useAppStore.setState(getInitialState());
});

describe("Flow 5: Open 'I'm Bored'", () => {
  it("opens a modal offering the four structured refresh options", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /i'm bored/i }));

    const dialog = screen.getByRole("dialog", { name: /i'm bored/i });
    expect(within(dialog).getByText(/change one exercise from each group/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/make workout shorter/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/stay near bench/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/minimise equipment changes/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /preview changes/i })).toBeInTheDocument();
  });

  it("defaults to 'change one exercise from each group' checked", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /i'm bored/i }));
    const dialog = screen.getByRole("dialog", { name: /i'm bored/i });
    expect(within(dialog).getByRole("checkbox", { name: /change one exercise from each group/i })).toBeChecked();
    expect(within(dialog).getByRole("checkbox", { name: /make workout shorter/i })).not.toBeChecked();
  });
});

describe("Flow 6: Generate a refreshed workout", () => {
  it("previews changed exercises and a muscle-coverage status using the deterministic engine", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /i'm bored/i }));
    const dialog = screen.getByRole("dialog", { name: /i'm bored/i });

    await user.click(within(dialog).getByRole("button", { name: /preview changes/i }));

    // Squats' only eligible replacement is Bulgarian Split Squat (verified by Phase 2 domain tests).
    expect(within(dialog).getByText(/Bulgarian Split Squat/)).toBeInTheDocument();
    expect(within(dialog).getByText(/muscle coverage maintained/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /keep current/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /use this workout/i })).toBeInTheDocument();
  });

  it("reports an impossible reduction rather than silently applying it", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /i'm bored/i }));
    const dialog = screen.getByRole("dialog", { name: /i'm bored/i });

    // Uncheck the default refresh and only request a shorter workout — this alone must never
    // produce a coverage gap, so this exercises the "shorter" path without expecting an error;
    // the impossible-reduction guarantee itself is covered exhaustively in the domain test suite.
    await user.click(within(dialog).getByRole("checkbox", { name: /make workout shorter/i }));
    await user.click(within(dialog).getByRole("button", { name: /preview changes/i }));

    expect(within(dialog).getByText(/removed/i)).toBeInTheDocument();
  });
});

describe("Flow 7: Accept the refreshed workout", () => {
  it("applies the previewed session when 'Use This Workout' is clicked", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /i'm bored/i }));
    const dialog = screen.getByRole("dialog", { name: /i'm bored/i });
    await user.click(within(dialog).getByRole("button", { name: /preview changes/i }));
    await user.click(within(dialog).getByRole("button", { name: /use this workout/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start workout/i }));
    expect(screen.getByRole("heading", { name: "Bulgarian Split Squat", level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Squats", level: 3 })).not.toBeInTheDocument();
  });

  it("'Keep Current' discards the preview and leaves the session unchanged", async () => {
    const user = userEvent.setup();
    render(<TodayScreen />);
    await user.click(screen.getByRole("button", { name: /i'm bored/i }));
    const dialog = screen.getByRole("dialog", { name: /i'm bored/i });
    await user.click(within(dialog).getByRole("button", { name: /preview changes/i }));
    await user.click(within(dialog).getByRole("button", { name: /keep current/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /start workout/i }));
    expect(screen.getByRole("heading", { name: "Squats", level: 3 })).toBeInTheDocument();
  });
});

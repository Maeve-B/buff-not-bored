import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckInConversation } from "@/components/checkin/CheckInConversation";
import { HomeScreen } from "@/components/HomeScreen";
import { saveTodayCheckIn, skipTodayCheckIn } from "@/lib/actions/check-in";

vi.mock("@/lib/actions/check-in", () => ({
  saveTodayCheckIn: vi.fn(async () => ({ ok: true, checkIn: {} })),
  skipTodayCheckIn: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/lib/actions/needs-conversation", () => ({ resumeConversation: vi.fn() }));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  vi.mocked(saveTodayCheckIn).mockClear();
  vi.mocked(skipTodayCheckIn).mockClear();
  refresh.mockClear();
});

type User = ReturnType<typeof userEvent.setup>;
const tap = (user: User, name: string) => user.click(screen.getByRole("button", { name }));

describe("How are you today? (S-016)", () => {
  it("asks one tap at a time, and saves when nothing hurts", async () => {
    const user = userEvent.setup();
    render(<CheckInConversation />);
    expect(screen.getByText("Welcome back! How did you sleep?")).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument();
    await tap(user, "OK");
    await tap(user, "High");
    await tap(user, "A bit");
    await tap(user, "No");

    expect(saveTodayCheckIn).toHaveBeenCalledWith({ sleep: "ok", energy: "high", soreness: "some", pain: false, painRegions: [] });
    expect(await screen.findByText("Thanks, that's noted.")).toBeInTheDocument();
    await tap(user, "Carry on to Home");
    expect(refresh).toHaveBeenCalled();
  });

  it("asks where it hurts, and needs an area", async () => {
    const user = userEvent.setup();
    render(<CheckInConversation />);
    await tap(user, "Badly");
    await tap(user, "Low");
    await tap(user, "Very");
    await tap(user, "Yes");
    expect(screen.getByText("Where?")).toBeInTheDocument();
    expect(screen.getByText("Question 5 of 5")).toBeInTheDocument();

    vi.mocked(saveTodayCheckIn).mockResolvedValueOnce({ ok: false, error: "Tick where it hurts." });
    await tap(user, "Done");
    expect(await screen.findByRole("alert")).toHaveTextContent("Tick where it hurts.");

    await user.click(screen.getByRole("checkbox", { name: "Knee" }));
    await tap(user, "Done");
    expect(saveTodayCheckIn).toHaveBeenLastCalledWith({ sleep: "poor", energy: "low", soreness: "very", pain: true, painRegions: ["knee"] });
  });

  it("'Not today' skips the check-in for the day", async () => {
    const user = userEvent.setup();
    render(<CheckInConversation />);
    await tap(user, "Not today");
    expect(skipTodayCheckIn).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps the areas you ticked if you go back and forward", async () => {
    const user = userEvent.setup();
    render(<CheckInConversation />);
    await tap(user, "OK");
    await tap(user, "OK");
    await tap(user, "A bit");
    await tap(user, "Yes");
    await user.click(screen.getByRole("checkbox", { name: "Knee" }));
    await tap(user, "Back");
    await tap(user, "Yes");
    expect(screen.getByRole("checkbox", { name: "Knee" })).toBeChecked();
  });

  it("after 'Not today', checking in still offers 'Not today', not 'Keep my answers'", () => {
    render(<CheckInConversation existing={{ dateIso: "2026-10-29", skipped: true, painRegions: [] }} />);
    expect(screen.getByRole("button", { name: "Not today" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Keep my answers" })).not.toBeInTheDocument();
  });

  it("goes back a question", async () => {
    const user = userEvent.setup();
    render(<CheckInConversation />);
    await tap(user, "Well");
    await tap(user, "Back");
    expect(screen.getByRole("button", { name: "Well" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Home after checking in (S-016)", () => {
  it("shows how you checked in, and lets you change it", async () => {
    const user = userEvent.setup();
    render(
      <HomeScreen checkIn={{ dateIso: "2026-10-29", skipped: false, sleep: "ok", energy: "high", soreness: "some", painRegions: ["lower_back"] }} />,
    );
    expect(screen.getByText(/Checked in today · slept OK, energy high, a bit sore, pain: lower back/)).toBeInTheDocument();
    await tap(user, "Change");
    expect(screen.getByText("Welcome back! How did you sleep?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toHaveAttribute("aria-pressed", "true");
  });

  it("offers a check-in if you skipped today", () => {
    render(<HomeScreen checkIn={{ dateIso: "2026-10-29", skipped: true, painRegions: [] }} />);
    expect(screen.getByText(/No check-in today/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check in" })).toBeInTheDocument();
  });
});

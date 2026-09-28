import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeScreen } from "@/components/HomeScreen";

// The seeded "8 Week Strength" programme starts 2026-09-28 (a Monday) with
// Monday/Wednesday Classic Strength sessions — pin the clock there so this
// test is deterministic regardless of the sandbox's real wall-clock date.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-28T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Home screen — the primary entry point", () => {
  it("greets the user and asks what they're training today", () => {
    render(<HomeScreen />);
    expect(screen.getByText("What are you training today?")).toBeInTheDocument();
  });

  it("shows today's scheduled programme workout with a Start action", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Your Programme")).toBeInTheDocument();
    expect(screen.getByText("Week 1 · Full Body Strength")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start/i })).toHaveAttribute("href", "/strength");
  });

  it("offers a manual Circuit vs Strength choice regardless of the programme", () => {
    render(<HomeScreen />);
    expect(screen.getByRole("link", { name: /circuit/i })).toHaveAttribute("href", "/circuit");
    expect(screen.getByRole("link", { name: "Strength" })).toHaveAttribute("href", "/strength");
  });

  it("hints that more workout types are coming, without a dead link", () => {
    render(<HomeScreen />);
    expect(screen.getByText(/more workout types/i)).toBeInTheDocument();
  });

  it("lists the user's programmes with current week progress", () => {
    render(<HomeScreen />);
    const programmesLink = screen.getByRole("link", { name: /8 Week Strength/ });
    expect(within(programmesLink).getByText("8 Week Strength")).toBeInTheDocument();
    expect(within(programmesLink).getByText("Week 1 of 8")).toBeInTheDocument();
  });

  it("shows a rest-day message on a day with nothing scheduled", () => {
    vi.setSystemTime(new Date("2026-09-29T12:00:00Z")); // Tuesday — nothing scheduled
    render(<HomeScreen />);
    expect(screen.getByText(/nothing scheduled today/i)).toBeInTheDocument();
  });
});

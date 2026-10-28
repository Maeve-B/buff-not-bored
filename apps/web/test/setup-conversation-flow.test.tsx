import { EXERCISES, type NeedsConversationDraft } from "@buff-not-bored/domain";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SetupConversation } from "@/components/setup/SetupConversation";
import { finishConversation, saveConversationDraft } from "@/lib/actions/needs-conversation";

vi.mock("@/lib/actions/needs-conversation", () => ({
  saveConversationDraft: vi.fn(async () => ({ ok: true })),
  finishConversation: vi.fn(async () => ({ ok: true })),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const exercises = EXERCISES.map((e) => ({ id: e.id, name: e.name }));

beforeEach(() => {
  vi.mocked(saveConversationDraft).mockClear();
  vi.mocked(finishConversation).mockClear();
  refresh.mockClear();
});

type User = ReturnType<typeof userEvent.setup>;
const tap = (user: User, name: string | RegExp) => user.click(screen.getByRole("button", { name }));
const tick = (user: User, name: string) => user.click(screen.getByRole("checkbox", { name }));

/** Answers every question up to the summary, skipping the optional ones except avoids. */
async function answerAll(user: User) {
  await tap(user, "Get stronger");
  await tap(user, "Skip"); // emphasis
  await tap(user, "A year or more");
  await tap(user, /^Free weights/);
  await tap(user, "Confident");
  expect(screen.getByText("Thanks! Sounds like you're advanced.")).toBeInTheDocument();
  await tap(user, "Carry on");
  await tap(user, "3 days");
  for (const day of ["Mon", "Wed", "Fri"]) await tick(user, day);
  await tap(user, "Done");
  await tap(user, "60 minutes");
  for (const item of ["Barbell", "Dumbbells"]) await tick(user, item);
  await tap(user, "Done");
  await tap(user, "Skip"); // heaviest dumbbell
  await tap(user, "Skip"); // limitations
  await tap(user, "Yes, pick some"); // avoid
  await user.type(screen.getByRole("searchbox", { name: "Search exercises" }), "lunge");
  await tick(user, "Lunges (Alternating)");
  await tap(user, "Done");
  await tap(user, "Skip"); // favourites
  await tap(user, "Skip"); // likes and dislikes
}

describe("The setup conversation on Home (S-015)", () => {
  it("asks one question at a time, with progress, and saves your place after each", async () => {
    const user = userEvent.setup();
    render(<SetupConversation initialDraft={undefined} exercises={exercises} />);
    expect(screen.getByText("Question 1 of 13")).toBeInTheDocument();
    expect(screen.getByText(/What's your main goal right now\?/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeInTheDocument(); // the goal isn't optional

    await tap(user, "Get stronger");
    expect(screen.getByText("Question 2 of 13")).toBeInTheDocument();
    expect(saveConversationDraft).toHaveBeenLastCalledWith({ answers: { goal: "strength" }, stepId: "emphasis", answered: ["goal"], paused: false });
  });

  it("only asks about a heaviest dumbbell if you have dumbbells", async () => {
    const user = userEvent.setup();
    const draft: NeedsConversationDraft = { answers: { daysPerWeek: 3 }, stepId: "equipment", answered: [], paused: false };
    render(<SetupConversation initialDraft={draft} exercises={exercises} />);
    await tick(user, "Barbell");
    await tap(user, "Done");
    expect(screen.getByText(/Anything that hurts or needs care/)).toBeInTheDocument();
  });

  it("explains a problem and stays on the question", async () => {
    const user = userEvent.setup();
    const draft: NeedsConversationDraft = { answers: { daysPerWeek: 3 }, stepId: "preferredDays", answered: [], paused: false };
    render(<SetupConversation initialDraft={draft} exercises={exercises} />);
    await tick(user, "Mon");
    await tap(user, "Done");
    expect(screen.getByRole("alert")).toHaveTextContent("Pick 3 preferred days to match your days a week, or none.");
    expect(screen.getByText(/Which days suit you best\?/)).toBeInTheDocument();
  });

  it("ends on a summary you can change, then saves your training needs", async () => {
    const user = userEvent.setup();
    render(<SetupConversation initialDraft={undefined} exercises={exercises} />);
    await answerAll(user);

    expect(screen.getByText(/Here's what I've got/)).toBeInTheDocument();
    expect(screen.getByText("Lunges (Alternating)")).toBeInTheDocument();
    expect(screen.getByText("Mon, Wed, Fri")).toBeInTheDocument();

    // Change one answer and come straight back to the summary.
    await user.click(screen.getAllByRole("button", { name: "Change" })[0]!);
    await tap(user, "Build muscle");
    expect(screen.getByText(/Here's what I've got/)).toBeInTheDocument();

    await tap(user, "Save");
    expect(finishConversation).toHaveBeenCalledWith(
      expect.objectContaining({ goal: "hypertrophy", daysPerWeek: 3, preferredDays: [1, 3, 5], avoidExerciseIds: ["lunges"], equipment: ["barbell", "dumbbells"] }),
    );
    expect(await screen.findByText("Saved. Your programme comes next.")).toBeInTheDocument();
  });

  it("'Not now' keeps your place and hands back to Home", async () => {
    const user = userEvent.setup();
    render(<SetupConversation initialDraft={undefined} exercises={exercises} />);
    await tap(user, "Get stronger");
    await tap(user, "Not now");
    expect(saveConversationDraft).toHaveBeenLastCalledWith({ answers: { goal: "strength" }, stepId: "emphasis", answered: ["goal"], paused: true });
    expect(refresh).toHaveBeenCalled();
  });

  it("picks up where you left off", () => {
    const draft: NeedsConversationDraft = { answers: { goal: "strength", daysPerWeek: 2 }, stepId: "sessionMinutes", answered: ["goal"], paused: false };
    render(<SetupConversation initialDraft={draft} exercises={exercises} />);
    expect(screen.getByText(/How long do you have for each session\?/)).toBeInTheDocument();
    expect(screen.getByText("Question 8 of 13")).toBeInTheDocument();
  });

  it("goes back one question", async () => {
    const user = userEvent.setup();
    render(<SetupConversation initialDraft={undefined} exercises={exercises} />);
    await tap(user, "Get stronger");
    await tap(user, "Back");
    expect(screen.getByText(/What's your main goal right now\?/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get stronger" })).toHaveAttribute("aria-pressed", "true");
  });

  it("asks a question that now applies after a change from the summary, then returns there", async () => {
    const user = userEvent.setup();
    render(<SetupConversation initialDraft={undefined} exercises={exercises} />);
    await answerAll(user);
    const changes = screen.getAllByRole("button", { name: "Change" });
    await user.click(changes[8]!); // Equipment
    await tick(user, "Bench");
    await tap(user, "Done");
    expect(screen.getByText(/Here's what I've got/)).toBeInTheDocument(); // no new question: straight back

    await user.click(screen.getAllByRole("button", { name: "Change" })[10]!); // Needs care
    await tick(user, "Knee");
    await tap(user, "Done");
    expect(screen.getByText(/Anything else I should know about that\?/)).toBeInTheDocument();
    await tap(user, "Skip");
    expect(screen.getByText(/Here's what I've got/)).toBeInTheDocument();
  });
});

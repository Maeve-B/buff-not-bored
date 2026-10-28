/**
 * The setup conversation's wording (S-015). Proposed, not designed: plain
 * first-person questions for Maeve to rewrite. Presentation only; the order
 * and rules live in packages/domain (needs-conversation.ts).
 */

import type { StepId } from "@buff-not-bored/domain";

export const STEP_QUESTIONS: Record<StepId, string> = {
  goal: "Hi! Let's set up your training. What's your main goal right now?",
  emphasis: "Anything you'd like extra focus on?",
  trainingDuration: "How long have you been training regularly?",
  trainingKind: "What kind of training has it mostly been?",
  techniqueConfidence: "How confident is your technique on the main lifts, like squats and deadlifts?",
  experience: "Thanks!",
  daysPerWeek: "How many days a week can you train?",
  preferredDays: "Which days suit you best?",
  sessionMinutes: "How long do you have for each session?",
  equipment: "What equipment do you have?",
  heaviestDumbbell: "What's your heaviest dumbbell?",
  limitations: "Anything that hurts or needs care? I'll steer around it.",
  limitationNote: "Anything else I should know about that?",
  avoid: "Any exercises you'd rather avoid?",
  favourites: "Any favourites you'd like to keep?",
  likesDislikes: "Anything else you love or hate doing?",
  summary: "Here's what I've got. Tap anything to change it.",
};

/** Short names for the summary. */
export const STEP_NAMES: Record<StepId, string> = {
  goal: "Goal",
  emphasis: "Extra focus",
  trainingDuration: "Training for",
  trainingKind: "Kind of training",
  techniqueConfidence: "Technique",
  experience: "Experience",
  daysPerWeek: "Days a week",
  preferredDays: "Preferred days",
  sessionMinutes: "Session length",
  equipment: "Equipment",
  heaviestDumbbell: "Heaviest dumbbell",
  limitations: "Needs care",
  limitationNote: "Note",
  avoid: "Avoid",
  favourites: "Favourites",
  likesDislikes: "Likes and dislikes",
  summary: "",
};

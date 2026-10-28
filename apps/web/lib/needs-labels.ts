/** Plain-language labels for the needs form (S-008). Presentation only. */

import type {
  Emphasis,
  GymEquipment,
  JointStressTag,
  NeedsGoal,
  TechniqueConfidence,
  TrainingDuration,
  TrainingKind,
  TrainingStatus,
} from "@buff-not-bored/domain";

export const GOAL_LABELS: Record<NeedsGoal, string> = {
  strength: "Get stronger",
  hypertrophy: "Build muscle",
  general_fitness: "General fitness",
};

export const EMPHASIS_LABELS: Record<Emphasis, string> = { glutes: "Glutes", core: "Core", pull_up: "Pull-up" };

export const DURATION_LABELS: Record<TrainingDuration, string> = {
  under_2_months: "Less than 2 months",
  "2_to_12_months": "2 to 12 months",
  over_a_year: "A year or more",
};

export const KIND_LABELS: Record<TrainingKind, string> = {
  free_weights: "Free weights (barbells, dumbbells)",
  machines_or_classes: "Mostly machines or classes",
  other_sport: "Another sport or activity",
};

export const TECHNIQUE_LABELS: Record<TechniqueConfidence, string> = {
  low: "Not confident yet",
  some: "Fairly confident",
  confident: "Confident",
};

export const STATUS_LABELS: Record<TrainingStatus, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export const EQUIPMENT_LABELS: Record<GymEquipment, string> = {
  barbell: "Barbell",
  rack: "Squat rack",
  dumbbells: "Dumbbells",
  kettlebell: "Kettlebell",
  bench: "Bench",
  cable: "Cable machine",
  machine: "Weight machines",
  pull_up_bar: "Pull-up bar",
  band: "Resistance bands",
  bodyweight: "Bodyweight",
};

export const LIMITATION_LABELS: Record<JointStressTag, string> = {
  knee: "Knee",
  lower_back: "Lower back",
  shoulder: "Shoulder",
  wrist: "Wrist",
  elbow: "Elbow",
  hip: "Hip",
};

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

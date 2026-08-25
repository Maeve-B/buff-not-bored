/**
 * Pure display-formatting helpers. Deliberately NOT business logic — no
 * muscle-coverage, replacement, reduction, equipment, or progression
 * decisions live here, only presentation of values the domain package
 * already computed. See lib/workout-service.ts for the boundary that talks
 * to @buff-not-bored/domain.
 */

import type { Equipment, Exercise, Location, PlannedExercise } from "@buff-not-bored/domain";

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  bodyweight: "Bodyweight",
};

const LOCATION_LABELS: Record<Location, string> = {
  rack: "Rack",
  bench: "Bench",
  standing: "Standing",
  floor: "Floor",
  bench_or_floor: "Bench or floor",
};

export function formatEquipment(equipment: Equipment): string {
  return EQUIPMENT_LABELS[equipment] ?? equipment;
}

export function formatLocation(location: Location): string {
  return LOCATION_LABELS[location] ?? location;
}

export function formatProgrammeGroup(group: string): string {
  return group.charAt(0).toUpperCase() + group.slice(1);
}

/** "20 kg" / "8 kg each" (dumbbell exercises are seeded as per-implement weight) / "Bodyweight". */
export function formatTargetWeight(exercise: Exercise, weight?: number): string {
  if (weight === undefined) return "Bodyweight";
  const unit = exercise.weightUnit ?? "kg";
  const suffix = exercise.equipment === "dumbbell" ? " each" : "";
  return `${weight}${unit}${suffix}`;
}

/** "20 reps" / "12 reps/side" / "45 sec". */
export function formatTargetVolume(planned: Pick<PlannedExercise, "prescribedReps" | "repsUnit" | "prescribedDuration">): string {
  if (planned.prescribedDuration !== undefined) {
    return `${planned.prescribedDuration} sec`;
  }
  if (planned.prescribedReps !== undefined) {
    return planned.repsUnit === "per_side" ? `${planned.prescribedReps} reps/side` : `${planned.prescribedReps} reps`;
  }
  return "—";
}

/**
 * A short form cue for the exercise card. Exercises don't have a dedicated
 * "cue" field in the domain model — this falls back from any authored
 * `notes` to a generic line built from the exercise's own movement
 * patterns. Purely presentational: it never invents muscle/equipment facts
 * that aren't already on the Exercise record.
 */
export function getFormCue(exercise: Exercise): string {
  if (exercise.notes) return exercise.notes;
  if (exercise.movementPatterns.length > 0) {
    return `Movement: ${exercise.movementPatterns.join(", ")}`;
  }
  return "";
}

export function formatDurationRange(range: { minMinutes: number; maxMinutes: number }): string {
  return `${range.minMinutes}–${range.maxMinutes} min`;
}

export function formatDurationMinutes(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000));
  return `${minutes} min`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatWeightDelta(before: number, after: number): string {
  return `${before}kg → ${after}kg`;
}

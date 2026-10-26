/**
 * Pure display-formatting helpers. Deliberately NOT business logic — no
 * muscle-coverage, replacement, reduction, equipment, or progression
 * decisions live here, only presentation of values the domain package
 * already computed. See lib/workout-service.ts for the boundary that talks
 * to @buff-not-bored/domain.
 */

import {
  isLoaded,
  lowerIsProgress,
  type Equipment,
  type Exercise,
  type Location,
  type PlannedExercise,
  type Readiness,
  type StrengthExercise,
  type TargetRange,
} from "@buff-not-bored/domain";

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  bodyweight: "Bodyweight",
  cable: "Cable",
  machine: "Machine",
};

const LOCATION_LABELS: Record<Location, string> = {
  rack: "Rack",
  bench: "Bench",
  standing: "Standing",
  floor: "Floor",
  bench_or_floor: "Bench or floor",
  cable: "Cable stack",
  machine: "Machine",
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

/** "20kg" / "8kg each" (a dumbbell pair's weight is per dumbbell) / "Add baseline" (loaded, no weight yet) / "Bodyweight". */
export function formatTargetWeight(exercise: Exercise, weight?: number): string {
  if (weight === undefined) return isLoaded(exercise) ? "Add baseline" : "Bodyweight";
  const suffix = exercise.loadType === "dumbbell_pair" ? " each" : "";
  return `${weight}kg${suffix}`;
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

function formatRange(range: TargetRange): string {
  return range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`;
}

/** A preset prescription: "3 × 8–12" / "3 × 20–30 s" / "2 × 10 per side". */
export function formatSetsAndRange(strengthExercise: Pick<StrengthExercise, "exercise" | "sets" | "targetRange">): string {
  const { exercise, sets, targetRange } = strengthExercise;
  if (!targetRange) return `${sets.length} sets`;
  const timed = sets[0]?.targetDuration !== undefined;
  const unit = timed ? " s" : sets[0]?.repsUnit === "per_side" ? " per side" : "";
  return `${sets.length} × ${formatRange(targetRange)}${unit}`;
}

/** "Recommended rest 2–3 min" / "Recommended rest 60–90 s" — information only, never timed (D-010). */
export function formatRecommendedRest(rest: TargetRange): string {
  const amount = rest.min >= 60 && rest.min % 60 === 0 && rest.max % 60 === 0 ? `${rest.min / 60}–${rest.max / 60} min` : `${rest.min}–${rest.max} s`;
  return `Recommended rest ${amount}`;
}

/** The small label under a set's weight box: "weight (kg)", "weight each (kg)" for a dumbbell pair, or "assistance (kg)". */
export function formatWeightInputLabel(exercise: Pick<Exercise, "loadType" | "loadDirection">): string {
  if (lowerIsProgress(exercise)) return "assistance (kg)";
  return exercise.loadType === "dumbbell_pair" ? "weight each (kg)" : "weight (kg)";
}

/** A logged set, reps (or seconds) before weight (D-009): "8 reps × 20kg", "30s × 16kg", "10 reps/side". */
export function formatLoggedSet(logged: { actualReps?: number; actualDuration?: number; actualWeight?: number; repsUnit?: string }): string {
  const volume =
    logged.actualDuration !== undefined
      ? `${logged.actualDuration}s`
      : `${logged.actualReps} ${logged.repsUnit === "per_side" ? "reps/side" : "reps"}`;
  return logged.actualWeight !== undefined ? `${volume} × ${logged.actualWeight}kg` : volume;
}

/**
 * The plain-text progression notification for one exercise (§7.4, D-014):
 * a headline and a detail line. Information only: you change your weight
 * yourself on the exercise page.
 */
export function formatReadiness(
  strengthExercise: Pick<StrengthExercise, "exercise" | "sets">,
  readiness: Readiness,
): { headline: string; detail: string } {
  const { exercise, sets } = strengthExercise;
  const timed = sets[0]?.targetDuration !== undefined;
  const unit = timed ? "s" : sets[0]?.repsUnit === "per_side" ? " reps per side" : " reps";
  const assisted = lowerIsProgress(exercise);
  if (readiness.kind === "ready") {
    const reached = `${readiness.top}${unit} on every set.`;
    if (readiness.incrementOptions.length === 0) return { headline: "Top of the range", detail: reached };
    const sign = readiness.direction === "reduce_assistance" ? "−" : "+";
    const options = readiness.incrementOptions.map((jump) => `${sign}${jump}`).join(" / ");
    return {
      headline: readiness.direction === "reduce_assistance" ? "Ready to drop assistance" : "Ready to go up",
      detail: `${reached} Options: ${options} kg.`,
    };
  }
  const at = readiness.currentWeight !== undefined ? ` at ${readiness.currentWeight}kg${assisted ? " assistance" : ""}` : "";
  switch (readiness.reason) {
    case "below_top":
      return {
        headline: "Not yet",
        detail: `${readiness.setsAtTop} of ${readiness.totalSets} sets reached ${readiness.top}${unit}. Aim for ${timed ? "longer holds" : "more reps"} next time${at}.`,
      };
    case "below_current_weight":
      return {
        headline: "Not yet",
        detail: assisted
          ? `A set had more assistance than your ${readiness.currentWeight}kg, so this one doesn't count.`
          : `A set was lighter than your ${readiness.currentWeight}kg, so this one doesn't count.`,
      };
    case "missing_weight":
      return { headline: "Not yet", detail: `A set was logged without ${assisted ? "its assistance" : "a weight"}, so this one doesn't count.` };
    case "no_weight":
      return { headline: "Not yet", detail: "Add your weight to track progress." };
  }
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

/** "90 sec" / "2 min" — rest periods are usually spoken in minutes once they exceed a minute. */
export function formatRestPeriod(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = seconds / 60;
  return `${minutes % 1 === 0 ? minutes : minutes.toFixed(1)} min`;
}

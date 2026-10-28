/**
 * Your training needs (spec §6.1): one row (id "me") until multi-user
 * accounts exist. Validated with the domain's own checks before any write;
 * rows are mapped back to the domain's vocabularies on read.
 */

import {
  EXERCISES,
  validateNeedsProfile,
  type Emphasis,
  type GymEquipment,
  type JointStressTag,
  type NeedsGoal,
  type NeedsProfile,
  type NeedsSource,
  type SavedNeedsProfile,
  type TechniqueConfidence,
  type TrainingDuration,
  type TrainingKind,
  type Weekday,
} from "@buff-not-bored/domain";
import type { NeedsProfile as NeedsProfileRow } from "@prisma/client";
import { prisma } from "../client.js";
import { NEEDS_DRAFT_ID } from "./needs-conversation-repository.js";

const PROFILE_ID = "me";
const LIBRARY_IDS: ReadonlySet<string> = new Set(EXERCISES.map((exercise) => exercise.id));

function toDomain(row: NeedsProfileRow): SavedNeedsProfile {
  return {
    goal: row.goal as NeedsGoal,
    emphasis: (row.emphasis ?? undefined) as Emphasis | undefined,
    trainingDuration: row.trainingDuration as TrainingDuration,
    trainingKind: row.trainingKind as TrainingKind,
    techniqueConfidence: row.techniqueConfidence as TechniqueConfidence,
    daysPerWeek: row.daysPerWeek,
    preferredDays: row.preferredDays as Weekday[],
    sessionMinutes: row.sessionMinutes,
    equipment: row.equipment as GymEquipment[],
    heaviestDumbbellKg: row.heaviestDumbbellKg ?? undefined,
    limitations: row.limitations as JointStressTag[],
    limitationNote: row.limitationNote ?? undefined,
    avoidExerciseIds: row.avoidExerciseIds,
    favouriteExerciseIds: row.favouriteExerciseIds,
    likesDislikes: row.likesDislikes ?? undefined,
    source: row.source as NeedsSource,
    confirmedAt: row.confirmedAt.toISOString(),
  };
}

/** Your saved needs profile, or undefined if you haven't filled it in yet. */
export async function getNeedsProfile(): Promise<SavedNeedsProfile | undefined> {
  const row = await prisma.needsProfile.findUnique({ where: { id: PROFILE_ID } });
  return row ? toDomain(row) : undefined;
}

/**
 * Saves (confirms) your needs profile, replacing any earlier one, and ends
 * any setup conversation in progress (it's done). Throws
 * NeedsProfileValidationError if it isn't valid.
 */
export async function saveNeedsProfile(profile: NeedsProfile): Promise<SavedNeedsProfile> {
  validateNeedsProfile(profile, LIBRARY_IDS);
  const data = {
    goal: profile.goal,
    emphasis: profile.emphasis ?? null,
    trainingDuration: profile.trainingDuration,
    trainingKind: profile.trainingKind,
    techniqueConfidence: profile.techniqueConfidence,
    daysPerWeek: profile.daysPerWeek,
    preferredDays: [...profile.preferredDays],
    sessionMinutes: profile.sessionMinutes,
    equipment: [...profile.equipment],
    heaviestDumbbellKg: profile.heaviestDumbbellKg ?? null,
    limitations: [...profile.limitations],
    limitationNote: profile.limitationNote ?? null,
    avoidExerciseIds: [...profile.avoidExerciseIds],
    favouriteExerciseIds: [...profile.favouriteExerciseIds],
    likesDislikes: profile.likesDislikes ?? null,
    source: profile.source,
    confirmedAt: new Date(),
  };
  const [row] = await prisma.$transaction([
    prisma.needsProfile.upsert({ where: { id: PROFILE_ID }, create: { id: PROFILE_ID, ...data }, update: data }),
    prisma.needsConversationDraft.deleteMany({ where: { id: NEEDS_DRAFT_ID } }),
  ]);
  return toDomain(row);
}

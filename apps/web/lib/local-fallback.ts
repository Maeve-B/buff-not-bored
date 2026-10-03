/**
 * A synchronous, network-independent safety net: writes the current
 * workout snapshot to localStorage at the same moments a network save is
 * triggered, so a tab closed before that save completes doesn't lose the
 * user's latest action from the device too. Deliberately NOT read back
 * anywhere yet — no resume UI exists in this slice; this is write-only
 * groundwork a future resume/retry feature could read from.
 *
 * Each write is tagged with a locally-assigned, monotonically increasing
 * `revision` (see lib/store.ts / lib/strength-store.ts). This exists for
 * exactly one reason: an older save's success must never delete a newer,
 * not-yet-confirmed write. `clearFallbackSnapshotIfRevision` only removes
 * the stored entry when its revision still matches the one being cleared —
 * if a newer write has since overwritten it, this is a no-op; that newer
 * write gets cleared later by *its own* save succeeding instead.
 *
 * Starting a new workout never clears a previous one's fallback at all —
 * an unsynced entry has to remain available for a future recovery feature
 * even after the user has moved on. The ONLY way an entry is removed is a
 * save for its exact revision being confirmed to have succeeded. It is
 * acceptable (and safer than the alternative) for a failed or never-
 * confirmed workout's fallback to simply stay in localStorage indefinitely.
 *
 * Best-effort by design: localStorage can be unavailable (SSR, private
 * browsing, quota exceeded) and must never throw into the caller — this is
 * a fallback, not a dependency the app relies on to function.
 */

import type { WorkoutSnapshot } from "./types";

const PREFIX = "buff-not-bored:workout-fallback:";

interface FallbackEnvelope {
  revision: number;
  snapshot: WorkoutSnapshot;
}

function readEnvelope(workoutId: string): FallbackEnvelope | null {
  try {
    const raw = localStorage.getItem(PREFIX + workoutId);
    return raw ? (JSON.parse(raw) as FallbackEnvelope) : null;
  } catch {
    return null;
  }
}

export function writeFallbackSnapshot(snapshot: WorkoutSnapshot, revision: number): void {
  try {
    const envelope: FallbackEnvelope = { revision, snapshot };
    localStorage.setItem(PREFIX + snapshot.id, JSON.stringify(envelope));
  } catch {
    // Best-effort — never block or throw for the caller.
  }
}

/** The snapshot currently held in the fallback for a workout, if any. Not read by any app code yet — available for a future recovery feature. */
export function readFallbackSnapshot(workoutId: string): WorkoutSnapshot | null {
  return readEnvelope(workoutId)?.snapshot ?? null;
}

/**
 * Removes the stored fallback only if nothing newer has been written since
 * `revision` — i.e. only once the save confirming exactly this content has
 * succeeded. If a newer write already superseded it, this is a no-op.
 */
export function clearFallbackSnapshotIfRevision(workoutId: string, revision: number): void {
  try {
    const envelope = readEnvelope(workoutId);
    if (envelope?.revision === revision) {
      localStorage.removeItem(PREFIX + workoutId);
    }
  } catch {
    // Best-effort — never block or throw for the caller.
  }
}

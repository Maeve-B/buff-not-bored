import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFallbackSnapshot } from "@/lib/local-fallback";
import type { SaveWorkoutResult, WorkoutSnapshot } from "@/lib/types";

const persistWorkoutSnapshot = vi.fn<(snapshot: WorkoutSnapshot) => Promise<SaveWorkoutResult>>();
vi.mock("@/lib/actions/save-workout", () => ({ persistWorkoutSnapshot }));

// Imported after the mock so both stores pick up the mocked action.
const { getInitialState, useAppStore } = await import("@/lib/store");
const { getInitialStrengthState, useStrengthStore } = await import("@/lib/strength-store");

/** A controllable, manually-resolved promise — used to force a specific settle order across concurrent saves. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => {
  localStorage.clear();
  persistWorkoutSnapshot.mockReset();
  persistWorkoutSnapshot.mockResolvedValue({ ok: true, id: "db-id" });
  useAppStore.setState(getInitialState());
  useStrengthStore.setState(getInitialStrengthState());
});

describe("Circuit store — persistence lifecycle", () => {
  it("starting a workout persists an in_progress snapshot (deferred by the queue, not the Finish Workout button)", async () => {
    useAppStore.getState().startWorkout();
    expect(useAppStore.getState().saveStatus).toBe("saving"); // immediate, synchronous feedback

    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));
    const [snapshot] = persistWorkoutSnapshot.mock.calls[0]!;
    expect(snapshot.status).toBe("in_progress");
    expect(snapshot.workoutType).toBe("circuit");

    await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("saved"));
  });

  it("every logged set persists incrementally, using the same session id as the start save", async () => {
    useAppStore.getState().startWorkout();
    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));
    const sessionId = persistWorkoutSnapshot.mock.calls[0]![0].id;

    const exerciseId = useAppStore.getState().session.mainExercises[0]!.exercise.id;
    useAppStore.getState().logSet(exerciseId, { actualReps: 20, actualWeight: 20 });

    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(2));
    const logSnapshot = persistWorkoutSnapshot.mock.calls[1]![0];
    expect(logSnapshot.id).toBe(sessionId); // same session id, not a new one
    expect(logSnapshot.status).toBe("in_progress");
    if (logSnapshot.workoutType === "circuit") {
      expect(logSnapshot.setLogs).toHaveLength(1);
    }

    await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("saved"));
  });

  it("Finish Workout marks the existing session completed — same id, status flips to completed", async () => {
    useAppStore.getState().startWorkout();
    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));
    const sessionId = persistWorkoutSnapshot.mock.calls[0]![0].id;

    useAppStore.getState().completeWorkout();

    expect(useAppStore.getState().status).toBe("completed");
    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(2));
    const completeSnapshot = persistWorkoutSnapshot.mock.calls[1]![0];
    expect(completeSnapshot.id).toBe(sessionId);
    expect(completeSnapshot.status).toBe("completed");
    expect(useAppStore.getState().history[0]!.id).toBe(sessionId);

    await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("saved"));
  });

  it("surfaces a failed save as an error status, not a silent success — logging/finishing still works locally", async () => {
    persistWorkoutSnapshot.mockResolvedValue({ ok: false, error: "exercise foreign key violation" });

    useAppStore.getState().startWorkout();
    useAppStore.getState().completeWorkout();

    expect(useAppStore.getState().status).toBe("completed"); // not blocked by the save failing
    await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("error"));
    expect(useAppStore.getState().saveError).toBe("exercise foreign key violation");
  });

  it("surfaces a rejected promise (e.g. the action itself throwing) as an error status too", async () => {
    persistWorkoutSnapshot.mockRejectedValue(new Error("network unreachable"));

    useAppStore.getState().startWorkout();

    await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("error"));
    expect(useAppStore.getState().saveError).toBe("network unreachable");
  });

  it("starting a new workout generates a fresh session id and resets save status to idle", async () => {
    useAppStore.getState().startWorkout();
    const firstId = useAppStore.getState().workoutId;
    await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("saved"));

    useAppStore.getState().startNewWorkout();
    expect(useAppStore.getState().saveStatus).toBe("idle");
    expect(useAppStore.getState().workoutId).not.toBe(firstId);
  });

  describe("out-of-order network resolution (Risk 1)", () => {
    it("never issues the second save until the first one has fully settled, even if the first is slow", async () => {
      const first = deferred<SaveWorkoutResult>();
      persistWorkoutSnapshot.mockReturnValueOnce(first.promise);

      useAppStore.getState().startWorkout(); // enqueues job 1 (slow, not yet resolved)
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));

      const exerciseId = useAppStore.getState().session.mainExercises[0]!.exercise.id;
      useAppStore.getState().logSet(exerciseId, { actualReps: 20, actualWeight: 20 }); // enqueues job 2

      // Job 2 must NOT have been issued yet — job 1 hasn't settled.
      await new Promise((r) => setTimeout(r, 20));
      expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1);

      first.resolve({ ok: true, id: "db-id" }); // now let job 1 settle
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(2));
    });

    it("a stale (older) save resolving after a newer one never overwrites saveStatus with its own result", async () => {
      const first = deferred<SaveWorkoutResult>();
      persistWorkoutSnapshot.mockReturnValueOnce(first.promise); // job 1: will resolve to an error, but only once job 2 is already queued
      persistWorkoutSnapshot.mockResolvedValueOnce({ ok: true, id: "db-id-2" }); // job 2: succeeds

      useAppStore.getState().startWorkout(); // job 1 queued
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));

      const exerciseId = useAppStore.getState().session.mainExercises[0]!.exercise.id;
      useAppStore.getState().logSet(exerciseId, { actualReps: 20, actualWeight: 20 }); // job 2 queued behind job 1

      first.resolve({ ok: false, error: "stale failure" }); // job 1 settles with a failure...
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(2)); // ...which only then lets job 2 start

      // Final status reflects job 2 (the logically newer action), never job 1's stale failure.
      await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("saved"));
      expect(useAppStore.getState().saveError).toBeUndefined();
    });
  });

  describe("local fallback (Risk 2)", () => {
    it("writes the latest snapshot to localStorage synchronously, before the network save even resolves", async () => {
      const first = deferred<SaveWorkoutResult>();
      persistWorkoutSnapshot.mockReturnValueOnce(first.promise); // never resolves during this test

      useAppStore.getState().startWorkout();
      const id = useAppStore.getState().workoutId;

      // No `await` at all — this must already be in localStorage synchronously.
      const fallback = readFallbackSnapshot(id);
      expect(fallback).not.toBeNull();
      expect(fallback!.status).toBe("in_progress");

      // Drain the queue before the test ends — `saveQueue` lives in the
      // store's closure, not its Zustand state, so it persists across
      // tests in this file; leaving a promise unresolved here would stall
      // every later test's saves behind it.
      first.resolve({ ok: true, id: "db-id" });
      await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("saved"));
    });

    it("updates the fallback on every logged set, reflecting the latest action even if the save never settles", async () => {
      const stuck = deferred<SaveWorkoutResult>();
      persistWorkoutSnapshot.mockReturnValue(stuck.promise); // every call hangs — simulates a tab closed before any response

      useAppStore.getState().startWorkout();
      const id = useAppStore.getState().workoutId;
      const exerciseId = useAppStore.getState().session.mainExercises[0]!.exercise.id;
      useAppStore.getState().logSet(exerciseId, { actualReps: 20, actualWeight: 20 });

      const fallback = readFallbackSnapshot(id);
      expect(fallback).not.toBeNull();
      if (fallback!.workoutType === "circuit") {
        expect(fallback!.setLogs).toHaveLength(1);
      }

      // Drain the queue (see note above) — both queued jobs share the same `stuck` promise.
      stuck.resolve({ ok: true, id: "db-id" });
      await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("saved"));
    });

    it("is cleared once its own save succeeds", async () => {
      useAppStore.getState().startWorkout();
      const id = useAppStore.getState().workoutId;
      expect(readFallbackSnapshot(id)).not.toBeNull();

      await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("saved"));
      expect(readFallbackSnapshot(id)).toBeNull();
    });

    it("a fresh session's low revision counter can never interfere with an older, unrelated workout's higher persisted revision (reload safety)", async () => {
      // Simulates a fallback left over in localStorage from before a reload —
      // under a DIFFERENT workoutId, at a revision far higher than this
      // fresh session's own (freshly-reset-to-0) counter will produce for a
      // while. `workoutId` is a fresh crypto.randomUUID() every time the
      // store module is created (i.e. every real page load, since nothing
      // persists it) — it can never collide with a prior session's id.
      const leftoverWorkoutId = "leftover-workout-from-before-reload";
      localStorage.setItem(
        `buff-not-bored:workout-fallback:${leftoverWorkoutId}`,
        JSON.stringify({
          revision: 99,
          snapshot: {
            id: leftoverWorkoutId,
            dateIso: "2026-10-01",
            workoutName: "Full Body",
            workoutType: "circuit",
            status: "in_progress",
            session: useAppStore.getState().session,
            setLogs: [],
          },
        }),
      );

      useAppStore.getState().startWorkout(); // this session's own first save — revision 1, a DIFFERENT workoutId
      const freshWorkoutId = useAppStore.getState().workoutId;
      expect(freshWorkoutId).not.toBe(leftoverWorkoutId);

      await vi.waitFor(() => expect(useAppStore.getState().saveStatus).toBe("saved"));

      // This session's own revision-1 fallback is correctly cleared by its own success.
      expect(readFallbackSnapshot(freshWorkoutId)).toBeNull();

      // The unrelated leftover entry (revision 99, a different key) is completely
      // untouched — revisions are only ever compared within one workout's own
      // key, never across keys, so a low counter can never be mistaken for,
      // or clear, a different workout's higher one.
      const leftoverRaw = localStorage.getItem(`buff-not-bored:workout-fallback:${leftoverWorkoutId}`);
      expect(leftoverRaw).not.toBeNull();
      expect((JSON.parse(leftoverRaw!) as { revision: number }).revision).toBe(99);
    });

    it("startNewWorkout does NOT delete a fallback that was never confirmed saved (gap C, requirement 1)", async () => {
      const stuck = deferred<SaveWorkoutResult>();
      persistWorkoutSnapshot.mockReturnValue(stuck.promise); // every save hangs — nothing is ever confirmed

      useAppStore.getState().startWorkout();
      const oldId = useAppStore.getState().workoutId;
      expect(readFallbackSnapshot(oldId)).not.toBeNull();

      useAppStore.getState().startNewWorkout();

      // Moving on must never be, by itself, a reason to delete an unsynced fallback.
      expect(readFallbackSnapshot(oldId)).not.toBeNull();

      // Drain the queue (see note above) so this test doesn't stall later ones.
      stuck.resolve({ ok: true, id: "db-id" });
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));
    });

    it("a newer fallback cannot be deleted by an older save's success (gap C, requirement 3)", async () => {
      // Exactly the race from the brief: set A logged (fallback A written, save A
      // starts and hangs); set B logged before save A resolves (fallback B
      // overwrites A in storage, save B queued behind A); save A then succeeds.
      const saveA = deferred<SaveWorkoutResult>();
      const saveB = deferred<SaveWorkoutResult>();
      persistWorkoutSnapshot.mockReturnValueOnce(saveA.promise);

      useAppStore.getState().startWorkout(); // "set A" — job A, revision 1
      const id = useAppStore.getState().workoutId;
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));

      persistWorkoutSnapshot.mockReturnValueOnce(saveB.promise);
      const exerciseId = useAppStore.getState().session.mainExercises[0]!.exercise.id;
      useAppStore.getState().logSet(exerciseId, { actualReps: 20, actualWeight: 20 }); // "set B" — overwrites fallback to revision 2, queues job B behind job A

      expect(readFallbackSnapshot(id)).not.toBeNull(); // revision 2 currently stored

      saveA.resolve({ ok: true, id: "db-id" }); // save A (the OLDER save) succeeds
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(2)); // job B has now started

      // Save A's success must NOT have deleted fallback B — B hasn't been confirmed yet.
      expect(readFallbackSnapshot(id)).not.toBeNull();

      saveB.resolve({ ok: true, id: "db-id" }); // save B succeeds
      await vi.waitFor(() => expect(readFallbackSnapshot(id)).toBeNull()); // now it's safe to clear
    });
  });
});

describe("Classic Strength store — persistence lifecycle", () => {
  it("starting a workout persists an in_progress snapshot", async () => {
    useStrengthStore.getState().startWorkout();
    expect(useStrengthStore.getState().saveStatus).toBe("saving");

    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));
    const [snapshot] = persistWorkoutSnapshot.mock.calls[0]!;
    expect(snapshot.status).toBe("in_progress");
    expect(snapshot.workoutType).toBe("classic_strength");

    await vi.waitFor(() => expect(useStrengthStore.getState().saveStatus).toBe("saved"));
  });

  it("every logged set persists incrementally under the same session id", async () => {
    useStrengthStore.getState().startWorkout();
    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));
    const sessionId = persistWorkoutSnapshot.mock.calls[0]![0].id;

    const se = useStrengthStore.getState().session.exercises[0]!;
    useStrengthStore.getState().logSet(se.exercise.id, se.sets[0]!.setNumber, { actualReps: 20, actualWeight: 20 });

    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(2));
    expect(persistWorkoutSnapshot.mock.calls[1]![0].id).toBe(sessionId);

    await vi.waitFor(() => expect(useStrengthStore.getState().saveStatus).toBe("saved"));
  });

  it("Finish Workout marks the existing session completed under the same id", async () => {
    useStrengthStore.getState().startWorkout();
    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));
    const sessionId = persistWorkoutSnapshot.mock.calls[0]![0].id;

    useStrengthStore.getState().completeWorkout();

    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(2));
    const completeSnapshot = persistWorkoutSnapshot.mock.calls[1]![0];
    expect(completeSnapshot.id).toBe(sessionId);
    expect(completeSnapshot.status).toBe("completed");
    expect(useStrengthStore.getState().history[0]!.id).toBe(sessionId);

    await vi.waitFor(() => expect(useStrengthStore.getState().saveStatus).toBe("saved"));
  });

  it("surfaces a failed save as an error status", async () => {
    persistWorkoutSnapshot.mockResolvedValue({ ok: false, error: "validation failed" });

    useStrengthStore.getState().startWorkout();

    await vi.waitFor(() => expect(useStrengthStore.getState().saveStatus).toBe("error"));
    expect(useStrengthStore.getState().saveError).toBe("validation failed");
  });

  it("never issues a second save before the first settles, and never lets a stale result override a newer one", async () => {
    const first = deferred<SaveWorkoutResult>();
    persistWorkoutSnapshot.mockReturnValueOnce(first.promise);
    persistWorkoutSnapshot.mockResolvedValueOnce({ ok: true, id: "db-id-2" });

    useStrengthStore.getState().startWorkout();
    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));

    const se = useStrengthStore.getState().session.exercises[0]!;
    useStrengthStore.getState().logSet(se.exercise.id, se.sets[0]!.setNumber, { actualReps: 20, actualWeight: 20 });

    await new Promise((r) => setTimeout(r, 20));
    expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1); // second save still hasn't been issued

    first.resolve({ ok: false, error: "stale failure" });
    await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(useStrengthStore.getState().saveStatus).toBe("saved"));
    expect(useStrengthStore.getState().saveError).toBeUndefined();
  });

  describe("local fallback (Risk 2 / gap C)", () => {
    it("startNewWorkout does NOT delete a fallback that was never confirmed saved", async () => {
      const stuck = deferred<SaveWorkoutResult>();
      persistWorkoutSnapshot.mockReturnValue(stuck.promise);

      useStrengthStore.getState().startWorkout();
      const oldId = useStrengthStore.getState().workoutId;
      expect(readFallbackSnapshot(oldId)).not.toBeNull();

      useStrengthStore.getState().startNewWorkout();
      expect(readFallbackSnapshot(oldId)).not.toBeNull();

      // Drain the queue (see note above) so this test doesn't stall later ones.
      stuck.resolve({ ok: true, id: "db-id" });
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));
    });

    it("a newer fallback cannot be deleted by an older save's success", async () => {
      const saveA = deferred<SaveWorkoutResult>();
      const saveB = deferred<SaveWorkoutResult>();
      persistWorkoutSnapshot.mockReturnValueOnce(saveA.promise);

      useStrengthStore.getState().startWorkout();
      const id = useStrengthStore.getState().workoutId;
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(1));

      persistWorkoutSnapshot.mockReturnValueOnce(saveB.promise);
      const se = useStrengthStore.getState().session.exercises[0]!;
      useStrengthStore.getState().logSet(se.exercise.id, se.sets[0]!.setNumber, { actualReps: 20, actualWeight: 20 });

      expect(readFallbackSnapshot(id)).not.toBeNull();

      saveA.resolve({ ok: true, id: "db-id" });
      await vi.waitFor(() => expect(persistWorkoutSnapshot).toHaveBeenCalledTimes(2));
      expect(readFallbackSnapshot(id)).not.toBeNull(); // not deleted by A's success

      saveB.resolve({ ok: true, id: "db-id" });
      await vi.waitFor(() => expect(readFallbackSnapshot(id)).toBeNull());
    });
  });
});

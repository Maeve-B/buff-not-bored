# Phase 3 Notes — Known Limitations Carried Forward From Phase 2

This document records known limitations in the Phase 2 deterministic engine that are acceptable for now but should be addressed as part of Phase 3 (or a later phase) rather than forgotten. Nothing here changes Phase 2 behaviour — it's a record of what to revisit and why.

---

## 1. Default refresh target selection is slot-position-based, not optimisation-based

**Where:** `engine/refresh-engine.ts`, `refreshWorkout`'s default ("I'm bored") mode.

**Current behaviour:** When no `targetExerciseIds` are supplied, the engine picks exactly one exercise per programme group to attempt replacing — specifically, **the first main-role exercise in that group, in session order**. This was a documented assumption from Phase 2 (the spec never specified which exercise within a multi-exercise group should be the boredom target), chosen because it's simple and fully deterministic.

**Limitation:** Slot position has no relationship to which exercise is actually the best candidate for replacement. A more useful default would ask "which exercise in this group is *most worth* refreshing?" — for example, preferring to replace an exercise that:
- has the most redundant coverage in the group (similar to `reduceExerciseCount`'s scoring),
- has been used most consecutively/recently (variety),
- has the least favourable equipment/location alignment with the rest of the session, or
- is flagged as a lower learned preference, once preference tracking exists.

**Future direction:** Replace the "first main slot" rule with a scoring pass — reuse the redundancy-scoring approach already built for `reduceExerciseCount`, combined with the equipment/variety scoring already built for candidate ranking, to choose the target exercise the same way candidates are chosen for replacing it. This likely means factoring "which exercise to replace" and "what to replace it with" into a single joint decision rather than two separate steps.

---

## 2. Reduction's coverage protection treats only primary stimulus as required

**Where:** `engine/reduction-engine.ts`, `reduceExerciseCount`'s VALIDATE step.

**Current behaviour:** A muscle counts as "required" (must not drop to zero total exposure after reduction) only if it was a **primary** muscle of at least one exercise in the original session. Secondary-only coverage is not protected — an exercise that was the session's sole *secondary* source of a muscle can be removed freely, with no gap reported, even if that was meaningful stimulus.

**Limitation:** This is a binary primary/required vs. secondary/irrelevant model. It doesn't reflect that secondary stimulus is real, just weaker — nor does it protect against a session accidentally losing *all* secondary exposure to a muscle, or losing enough combined primary+secondary volume to meaningfully change training stimulus even without technically hitting zero.

**Future direction:** Move from a binary primary/secondary distinction to a weighted one — e.g. primary exposure counts fully toward a muscle's "coverage score" and secondary exposure counts partially, with a minimum *score* threshold (not just a minimum *count* of any exposure) required to avoid a reported gap. This would also make the VALIDATE step meaningfully different from a simple "still nonzero?" check, and would let the engine reason about *degraded* coverage (still present, but weaker than before) rather than only binary present/absent.

---

## 3. The exercise library has limited alternatives in some programme groups

**Where:** `data/exercises.ts` (33 exercises total), most visible via `EXERCISE_AUDIT.md`'s alternate counts.

**Current behaviour:** Several programme groups have exactly one library-only alternate beyond what's in the current template, and **Core has none** — every Core library exercise (Plank, Russian Twists, Bicycle Crunches) is already in the template, so `refreshWorkout` has nothing to offer Core and always retains the current exercise there (confirmed by Phase 2's own tests).

**Limitation:** The refresh engine's candidate filtering and scoring logic is real and tested, but with only 0–1 eligible candidates per group in practice, almost every replacement decision is fully determined by FILTER alone — there's rarely more than one valid candidate for SCORE/SELECT to actually choose between. The scoring logic (variety, equipment/location alignment, preference weights) has been unit-tested against synthetic fixtures with multiple candidates, but hasn't yet been exercised meaningfully against the real data, because the real data mostly doesn't offer that choice.

**Future direction:** Expand the library — particularly Core, and add a second alternate to the other groups — with exercises that are genuinely different enough to matter (different equipment, different movement pattern, or a meaningfully different secondary-muscle profile), not just near-duplicates. Every new entry should follow the same pattern established in Phase 1's correction: `needsReview: true` plus a clear `notes` string until weight/reps/equipment are confirmed against real data, per `EXERCISE_AUDIT.md`'s existing convention.

---

*No Phase 2 code was changed to produce this document. Phase 3 implementation has not started.*

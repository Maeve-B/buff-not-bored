# Decisions

> Append-only record of non-obvious trade-offs. Add an entry when a slice makes a call that a future reader would otherwise have to rediscover. Never rewrite old entries; supersede them with a new one.
>
> Earlier history: `PHASE_3_NOTES.md` (known engine limitations) and `EXERCISE_AUDIT.md` (library audit). Product decisions live in `PRODUCT_SPEC.md` §14.

## Entry format
```
### D-NNN · <short title> (YYYY-MM-DD, PR #n)
- Context: what forced the choice
- Decision: what we chose
- Alternatives: what we didn't, and why
- Revisit if: the condition that would change it
```

### D-001 · BACKLOG.md is the only tracker (2026-10-18)
- Context: `ARCHITECTURE.md` §10 and the checklist in `BUILD_WORKFLOW.md` both tracked progress and went stale.
- Decision: `ROADMAP.md` (owned by Maeve) holds direction; `BACKLOG.md` (maintained by the agent, reconciled against git each run) holds status. The other trackers are removed or frozen.
- Alternatives: GitHub Issues or Todoist, which would split the source of truth away from the repo.
- Revisit if: more than one agent or person works on the repo at once.

### D-002 · Keep the v1 seven groups for now (2026-10-18)
- Context: today's "I'm bored" and shorter-workout features run on the v1 seven body-part groups.
- Decision: keep them alongside the §9.1 movement patterns until slot-based refresh (Phase 3).
- Revisit if: slot-based refresh lands.

### D-003 · All personal weights start blank (2026-10-18)
- Context: moving `starting_weight` out of the library (S-002).
- Decision: v1 seed weights are not carried over. Maeve enters each weight at first use, to test that flow.
- Alternatives: carrying over the old seed weights as current weights.

### D-004 · Strength mode uses the strength goal defaults (2026-10-18)
- Decision: Strength mode prescribes compound 3 × 5 and isolation 3 × 8–12 (§6.3, spec decision 1).

### D-005 · Re-tagged library values get a review table (2026-10-18)
- Decision: S-001 values (increments, joint-stress tags and so on) are flagged for review and shown in a one-page table in the review pack.

### D-006 · The nudge works from reps until set feedback exists (2026-10-18)
- Context: Strength logging doesn't capture Easy/Good/… yet; that arrives with set logging in Phase 1.
- Decision: the S-004 trigger uses the reps rule only for now. The feedback rule is built and tested, but has no input until then.

### D-007 · Weight moves in 0.25 kg steps (2026-10-18, S-001)
- Context: Maeve wants weight jumps as small as 0.25 kg, and flexible.
- Decision: every loaded exercise offers jumps starting at 0.25 kg (barbell 0.25/0.5/1/2.5/5, dumbbells 0.25/0.5/1/2/2.5), and every increment is a multiple of 0.25 kg. Typed weight fields (Strength sets, exercise weight form) accept any 0.25 kg step. The circuit's tap-only stepper keeps its larger tap size to protect one-or-two-tap logging (§3.9).
- Revisit if: the Phase 1 set-logging design sets a different tap size, or the nudge (S-004) needs fewer chips than the options list.

### D-008 · How a first-use weight becomes your weight (2026-10-18, S-002)
- Context: weights start blank (D-003), and the app must never change a prescribed load by itself (§3.3).
- Decision: your weight lives in the exercise's capability (the exercise page). The first weight you log for a loaded exercise with no weight is saved there as a manual entry; the server re-checks and never overwrites an existing weight. After that, logged weights are session facts only. A workout in progress is never re-prescribed.
- Alternatives: a separate "user exercise state" table (unnecessary while the capability already holds the current weight); updating your weight from every logged session (breaks §3.3).
- Revisit if: multi-user arrives (capability gains a user id), or the progression nudge needs its own record of accepted increases.


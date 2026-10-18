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

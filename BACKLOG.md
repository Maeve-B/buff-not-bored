# Backlog

> The **only** progress tracker. Maintained by the agent and reconciled against git and PR state at the start of every `/next-slice` run. Direction and priority come from `ROADMAP.md`.
>
> One slice = one vertical capability = one PR.
> Statuses: `todo` · `in-progress` · `in-review (PR #n)` · `done (PR #n)` · `blocked` · `needs-decision`

## Item format
```
### S-NNN · <capability, in product language> — status: <status>
- Epic: R-xx · Spec: §x.y
- Screens: <screens and states touched, or "none">
- Design-first: yes/no
- Depends on: <S-NNN ✅/⏳, or "nothing">
- Done when: <one or two observable outcomes>
```

## Needs your decision
_Nothing yet._

## Now (epic R-00 · Phase 0 — Clean-up)
_Breakdown approved 2026-10-18. Decisions D-002–D-006._

### S-001 · Exercise library in the new shape — status: in-review (PR #8)
- Epic: R-00 · Spec: §9.1, §10.2 (re-tag existing only)
- Screens: none
- Design-first: no
- Depends on: nothing
- Notes: schema change (escalate at plan). Keep the v1 seven groups alongside the new fields (D-002). New values flagged for review, with a one-page table in the review pack (D-005).
- Done when: all 33 existing exercises carry the §9.1 fields and pass validation; the existing app behaves as before.

### S-002 · Your weights move out of the library — status: todo
- Epic: R-00 · Spec: §9.1 (`starting_weight` → user exercise state), §2, §10.1 (blank weights)
- Screens: Strength workout and exercise detail, in three states: weight set, no weight yet, assisted exercise
- Design-first: partly. Entering a blank weight is part of set logging, so it's a working skeleton only.
- Depends on: S-001
- Notes: schema change (escalate at plan). All weights start blank; nothing carries over from the old seed (D-003).
- Done when: sessions take your own weight, with a blank weight entered at first use; the library holds no weights.

### S-003 · Correct rep, set and rest defaults — status: todo
- Epic: R-00 · Spec: §6.3
- Screens: Strength workout overview and set list
- Design-first: no
- Depends on: S-001
- Notes: Strength mode uses the strength goal (D-004). Circuit keeps its own numbers.
- Done when: a fresh Strength session shows compound 3 × 5 and isolation 3 × 8–12, with rest per exercise.

### S-004 · Progression becomes a nudge — status: todo
- Epic: R-00 · Spec: §7.4, §6.5, §3.3
- Screens: Strength summary and Progress, in two states: ready to go up, not yet ready (placeholder text)
- Design-first: yes. The real nudge screen comes in Phase 1, so this slice uses plain text only.
- Depends on: S-003
- Notes: the trigger uses reps only until set feedback is logged in Phase 1 (D-006). Circuit keeps percentage progression. The old engines round weights to 0.5 kg; anything that stays must use the 0.25 kg step (D-007). Choosing which of the increment options become the nudge chips is a design question.
- Done when: no strength screen suggests a weight automatically; the engine reports readiness and increment options.

## Discovered (untriaged)
- Weight history has no pagination yet (from PR #6).
- Same-day ordering between a workout entry and a manual weight entry is a simple sort (from PR #6).
- CI uses GitHub actions (checkout, setup-node, pnpm) that run on retiring Node 20; bump to their next major versions.
- Playwright is not yet installed, but the visual review pack needs it. Adding it is a new dependency, so it needs approval.

## Done
- PR #1 · Architecture proposal and Phase 1–2 domain engine (v1 rules)
- PR #2 · Database foundation (`feature/database-foundation`)
- PR #3 · Incremental workout persistence (`feature/workout-persistence`)
- PR #4 · Exercise capability foundation (`feature/exercise-capability`)
- PR #5 · Exercise capability UI (`feature/exercise-capability-ui`)
- PR #6 · Exercise weight history and independent weight tracking (`feature/weight-progression`)
- PR #7 · Agent workflow scaffolding, roadmap and CI (`chore/agent-workflow-scaffolding`)

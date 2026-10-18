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
_Awaiting `/plan-epic` breakdown and approval._

## Discovered (untriaged)
- Weight history has no pagination yet (from PR #6).
- Same-day ordering between a workout entry and a manual weight entry is a simple sort (from PR #6).
- Playwright is not yet installed, but the visual review pack needs it. Adding it is a new dependency, so it needs approval.

## Done
- PR #1 · Architecture proposal and Phase 1–2 domain engine (v1 rules)
- PR #2 · Database foundation (`feature/database-foundation`)
- PR #3 · Incremental workout persistence (`feature/workout-persistence`)
- PR #4 · Exercise capability foundation (`feature/exercise-capability`)
- PR #5 · Exercise capability UI (`feature/exercise-capability-ui`)
- PR #6 · Exercise weight history and independent weight tracking (`feature/weight-progression`)

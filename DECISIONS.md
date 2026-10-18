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

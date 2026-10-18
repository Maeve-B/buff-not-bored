---
name: plan-epic
description: Break one ROADMAP.md epic into backlog slices and propose them to Maeve for approval.
disable-model-invocation: true
---

# /plan-epic <epic id or name>

Propose a slice breakdown for one epic. Write nothing to `main`; change only `BACKLOG.md`, and only after Maeve approves.

1. **Sync.** `git fetch --prune`. Read `ROADMAP.md` for the epic, then the spec sections it cites in `PRODUCT_SPEC.md`, plus §3 (principles), §4 (architecture rules) and §13 (non-goals). Read `BACKLOG.md` so you don't duplicate existing or done items.
2. **Look at the code** the epic touches: the relevant parts of `packages/domain`, `packages/db/prisma/schema.prisma` and `apps/web`. Note what already exists and what must change.
3. **Slice.** One slice = one vertical capability = one PR, about the size of past PRs (#2–#6: 9–28 files). For each slice give:
   - a title in product language, with the epic and spec sections;
   - screens and states touched (or "none"), and whether it's a **design-first** screen (set logging, progression nudge, onboarding/MVA, home → skeleton only);
   - data or schema changes (each one is an escalation; call it out);
   - dependencies on other slices;
   - "done when", as one or two observable outcomes.
   Order the slices so each one leaves `main` working.
4. **Questions.** List spec ambiguities, conflicts and choices that are Maeve's to make, in plain language, each with a recommended answer.
5. **Stop.** Present the breakdown in plain product language and wait for approval. Don't start building.
6. **On approval,** write the slices into `BACKLOG.md` under "Now (epic …)" using the item format there, numbered after the highest existing `S-NNN`, all `todo`. Put unresolved questions under "Needs your decision".

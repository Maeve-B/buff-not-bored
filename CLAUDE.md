# Buff, Not Bored — agent guide

The product owner (Maeve) is a designer. Write reviews, plans and questions in plain product language, not implementation detail. Maeve reviews every feature **visually** and always does the final merge.

## Read before acting
- **What to build:** `PRODUCT_SPEC.md` (v2) is the source of truth. The v1 spec in `docs/archive/PRODUCT_SPEC_v1.md` is reference only.
  - Principles §3 · Architecture rules §4 · Programming rules §6 · Logging and progression nudge §7 · Motivation §8 · Data model §9 · Phased plan §12 · Non-goals §13
- **How to build and review:** `BUILD_WORKFLOW.md` (plan gate, Placeholder UI rules, visual review pack).
- **What to work on:** `ROADMAP.md` (direction, owned by Maeve) → `BACKLOG.md` (slice status, maintained by the agent; the **only** tracker).
- **Layering detail:** `ARCHITECTURE.md` §2 and §6. Its data model (§4), engine description (§7) and phase plan (§10) predate spec v2; where they disagree, the spec wins.
- **Past decisions:** `DECISIONS.md`, plus the earlier `PHASE_3_NOTES.md` and `EXERCISE_AUDIT.md`.

Don't @-import these docs here; read the section you need when you need it.

## Source of truth
GitHub is the source of truth: `origin/main` and its PRs. Always branch off a freshly fetched `origin/main`. This local session is the only agent working on the repo.

## Repo map and commands
- `packages/domain` — pure TypeScript engine (programming, progression, swap, refresh, faff, motivation selection). No I/O. Vitest.
- `packages/db` — Prisma schema, migrations, repositories. Depends on domain.
- `apps/web` — Next.js App Router UI and Server Actions. Depends on db and domain.
- `pnpm test` (all packages) · `pnpm typecheck` (all packages) · `pnpm --filter @buff-not-bored/web dev` (run the app)
- DB work runs against the local throwaway Postgres in `packages/db/.env` (see `.env.example`).

## Hard rules (engineering)
1. **Layering:** web → db → domain, never the other way. `packages/domain` has no I/O and no dependency on Next, React or Prisma.
2. **The AI interprets intent; the deterministic engine decides** (spec §4.1). The AI never writes programmes, logs, the library or progression state directly.
3. **Server Actions translate, components present.** Actions validate → load → call domain → persist → return. No training logic in `apps/web`.
4. **Revalidation:** calling a Server Action as a plain async function (not via `<form action>`) does not refresh the calling Server Component. Call `router.refresh()` explicitly.
5. **DB test isolation:** Vitest runs test files in parallel. A test file may only delete rows it created itself, or it must share a file with the other tests that touch those tables. Never unfiltered `deleteMany()` across files.
6. **Migrations:** only `prisma migrate dev` against local Postgres. Never hand-edit generated migration SQL. Any schema change is an escalation (below).
7. **After pulling a schema change** (or switching to a branch that has one), run `pnpm --filter @buff-not-bored/db prisma:generate` and `prisma migrate deploy` before trusting test or typecheck failures.
8. **Done means** full `pnpm test` and `pnpm typecheck` pass across the whole workspace, not just the touched packages.
9. **Product guardrails:** never change a prescribed load automatically (§3.3); never add body-weight or body-composition tracking (§13); no streaks, shaming or social comparison (§8.2).
10. Do not edit `PRODUCT_SPEC.md`. Propose spec changes in the review note instead.

## Workflow
One feature (slice) at a time, one branch, one PR. The loop lives in `/next-slice`; breaking an epic into slices lives in `/plan-epic`.
1. Reconcile `BACKLOG.md` against git and PR state.
2. **Plan gate:** post a plain-language plan (spec sections, screens and states, data changes, questions). Stop for approval.
3. Build on `feature/<short-name>` (or `chore/…`) off `origin/main`. Commit and push to that branch freely.
4. Verify (full tests and typecheck), run `/code-review` on the diff, update `BACKLOG.md` (and `DECISIONS.md` for non-obvious calls).
5. **Review gate:** if the slice changes any screen, produce the visual review pack (`reviews/<slice>/`: 390×844 screenshots of every screen and state, plus `REVIEW.md`). Stop for review.
6. **Ask before opening the PR.** Maeve merges.

## Autonomy
**Decide freely:** implementation details inside an approved slice; reusing existing utilities; test design; creating branches; `prisma migrate dev` against local Postgres; committing and pushing to the slice's own branch.

**Escalate (stop and ask):**
- opening a PR;
- any schema or migration change;
- adding a dependency;
- anything that contradicts or extends the architecture rules (spec §4, `ARCHITECTURE.md` §2/§6);
- product behaviour not already settled in `PRODUCT_SPEC.md` or `ROADMAP.md`;
- which backlog item to do next when priority is unclear;
- **design-first screens — set logging, the progression nudge, onboarding/MVA, and home.** Build a working skeleton only (see Placeholder UI in `BUILD_WORKFLOW.md`) and stop for Maeve's design.

**Never:** push to `main`; force-push or rewrite pushed history; merge a PR; `prisma migrate reset` against anything but scratch; hand-edit migration SQL; use `bypassPermissions`. The dangerous ones are also denied in `.claude/settings.json`.

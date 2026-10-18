---
name: next-slice
description: Run the build loop for the next unblocked BACKLOG.md slice, from plan to PR, stopping at each of Maeve's gates.
disable-model-invocation: true
---

# /next-slice [S-NNN]

Follow `CLAUDE.md` and `BUILD_WORKFLOW.md`. Stop at every gate marked **STOP**.

1. **Reconcile.** `git fetch --prune`, then check open and merged PRs (`gh pr list --state all`). Make `BACKLOG.md` match reality: merged → `done (PR #n)`, open → `in-review (PR #n)`, branch with commits but no PR → `in-progress`. Report anything that doesn't add up.
2. **Pick.** Use the slice named in the argument, or the first `todo` slice in "Now" whose dependencies are done. If priority is unclear, ask. Don't start a new slice while one of yours is `in-review`, unless Maeve says so.
3. **Plan. STOP.** Post the plan in plain product language: spec sections, every screen and state, data or schema changes, design-first status, and open questions. Wait for approval.
4. **Branch.** `git switch -c feature/<short-name> origin/main --no-track`. If the branch includes a schema change, run prisma generate and migrate deploy locally first.
5. **Build.** Logic in `packages/domain` with unit tests, thin UI. Escalate anything on the CLAUDE.md escalate list as soon as it comes up. For design-first screens, build the working skeleton only.
6. **Verify.** `pnpm typecheck` and the full `pnpm test`. Smoke-test in the running app if the slice touches the DB or a screen. Run `/code-review` on the diff and fix what it finds.
7. **Record.** Mark the slice `in-progress` in `BACKLOG.md`, add follow-ups under "Discovered", and add a `DECISIONS.md` entry for any non-obvious call. Commit (`feat:`/`fix:`/`chore:`) and push to the slice branch.
8. **Review pack. STOP.** If any screen changed, capture 390×844 screenshots of every screen and state into `reviews/<slice>/NN-description.png` and write `reviews/<slice>/REVIEW.md` (see `BUILD_WORKFLOW.md` §3). Wait for Maeve's review, iterate on the same branch, and refresh only the changed shots.
9. **PR. STOP.** Ask before opening it. Fill in `.github/pull_request_template.md`, including the Screenshots section, then set the slice to `in-review (PR #n)`. Never merge.

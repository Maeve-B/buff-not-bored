Running Claude Code with substantial independence on Buff, Not Bored
Context
You want to spend more time on product direction and reviewing consequential decisions, and less time breaking features into coding tasks, re-explaining context, and manually directing implementation. This plan sets up a repeatable workflow — built almost entirely from Claude Code's existing features (CLAUDE.md, skills, permission settings, plan mode, GitHub PR tooling, scheduled sessions) plus a handful of new markdown files — rather than custom infrastructure.

What's already true here, found by inspecting the repo before designing anything:

The de facto working style across PRs #1–#5 is already good: one branch per vertical slice off origin/main, one squashed feat:/fix: commit, 9–28 files, +500 to +1,600 LOC, tests + typecheck run before calling it done. This plan formalizes that pattern, not replaces it.
ARCHITECTURE.md and PRODUCT_SPEC.md already hold real product/engineering content (principles in §4, layering rules in §2/§6, a testing strategy in §9) — this plan does not duplicate or replace them.
ARCHITECTURE.md §10's phase tracker is stale (still shows Phase 3 "Persistence" as not done, though persistence, Exercise Capability, and weight-history are all built), and its §4 data model no longer matches schema.prisma. This is the concrete evidence for why a new, self-correcting tracking mechanism is needed rather than "just be more disciplined about updating a doc."
No CLAUDE.md, no .claude/ directory, no CI, and no backlog mechanism exist in the repo today. The stop hook that nags about uncommitted changes (~/.claude/stop-hook-git-check.sh) is session/container infrastructure, not a repo convention — but it is a real operating fact to design around.
Two real lessons learned this session, now written down as hard rules rather than left to be re-discovered: (1) Vitest runs test files in parallel by default, so two integration-test files that both run unfiltered deleteMany() on the same Postgres tables will race — the actual rule is narrower than "one file per package": a test file must only delete rows it created itself, or it must share a file with the other tests touching those tables. (2) Calling a Server Action as a plain async function (not <form action>) does not auto-revalidate the calling Server Component — needs an explicit client-side router.refresh().
Decisions you've already made (binding for this plan):

Approval gate moves to PR merge. The agent commits and pushes freely to its own feature branch (cheap to undo, never touches main), asks before opening a PR, and you always do the final merge. This replaces "ask before every commit."
Backlog lives in-repo as markdown: ROADMAP.md (you own — direction, priority, rarely changes) + BACKLOG.md (agent-maintained — slice status, re-synced against git/PRs at the start of every run).
Start at Tier 1 (supervised) only. No scheduled/background execution yet — revisit once a handful of slices have gone smoothly.
Recommended approach, by area
1. Product context
Vision/principles stay in PRODUCT_SPEC.md §4 — not duplicated anywhere. New CLAUDE.md (auto-loaded every session) holds: pointers to which doc to read before which kind of change (not @-imports — those would paste 15–28KB into every session), the hard engineering rules, the workflow, and the autonomy/escalation list. Kept under ~150 lines so it's cheap every session.

2. Planning
New ROADMAP.md: epics in Now/Next/Later, owned and reordered only by you. A new /plan-epic skill reads one epic plus the spec/architecture docs and proposes a slice breakdown into BACKLOG.md format — you approve the breakdown once per epic, which is the mechanism that actually removes "breaking every feature into coding tasks" from your plate. Slice size is calibrated to the historical PR grain (one vertical capability, not smaller or bigger). Dependencies are plain prose notes on each backlog item ("depends on: exercise capability ✅") — no DAG tooling; matches this project's low-ceremony history.

3. Execution
A new /next-slice skill encodes the whole loop: reconcile BACKLOG.md against actual git/PR state first (this is what makes the backlog self-correcting instead of going stale like ARCHITECTURE.md §10 did) → pick the first unblocked todo item → branch off origin/main → implement → test+typecheck touched packages → full pnpm test → smoke test if DB-touching → run /code-review on the diff → update BACKLOG.md (and DECISIONS.md if a non-obvious call was made) → commit + push → open the PR (asking first, per the approval-gate decision) with a filled-out PR template. You start this yourself each time (e.g. typing /next-slice) — that's the whole Tier 1 mechanism, no new infrastructure beyond the skill files.

4. Decision-making
Decides freely: implementation details within an approved slice, which existing utility to reuse, test design, branch creation, running prisma migrate dev against the local throwaway Postgres, committing and pushing to its own feature branch. Escalates (stops and asks): opening a PR, any schema/migration change, adding a new dependency, anything that would contradict or extend ARCHITECTURE.md's stated boundaries, product behavior not already settled in PRODUCT_SPEC.md/ROADMAP.md, or which backlog item to work on next if priority is genuinely unclear. Never: force-push, push to main, merge a PR, prisma migrate reset against anything but scratch, hand-edit generated migration SQL. Enforce the "never" list structurally in .claude/settings.json (deny rules), not just as CLAUDE.md prose — a mistake there is expensive. Use permission mode acceptEdits plus a project allowlist (built via the /fewer-permission-prompts skill) for the routine stuff (pnpm test/typecheck, git status/diff/log, git checkout -b, git commit, pushes to feature/*); explicitly deny git push --force*, git push origin main, git reset --hard*, prisma migrate reset*, and the mcp__github__merge_pull_request tool. Avoid bypassPermissions mode entirely.

5. Quality and safety
Written down as hard rules in CLAUDE.md, all drawn from this project's actual history (not invented): layering (web → db → domain, domain has no I/O), Server Actions only translate, components only present; the router.refresh() rule; the DB-test-isolation rule stated precisely above; only prisma migrate dev against local Postgres, never hand-edited SQL; full workspace pnpm test (not just touched packages) before a slice is "done"; no force-push or history rewriting. Add one GitHub Actions workflow (typecheck + test with a Postgres service container) in Stage 1 — this is the one piece of new tooling infra recommended, because more agent autonomy needs a check that doesn't depend on the agent's own self-report.

6. Progress tracking
Three layers: git/PR history (already working); BACKLOG.md, self-reconciled every run (fixes the exact failure mode that made ARCHITECTURE.md §10 go stale); a new append-only DECISIONS.md for non-obvious tradeoffs, extending the existing PHASE_3_NOTES.md/EXERCISE_AUDIT.md precedent rather than inventing a new format. ARCHITECTURE.md §10 gets a one-line freeze note pointing to ROADMAP.md/BACKLOG.md as its replacement, rather than being maintained in two places.

7. Automation
Tier 1 (this plan builds this): a normal interactive session, you start it when ready (typing /next-slice), it stops for PR-open approval and always leaves the merge to you. Tier 2 (not built now, documented for later): a scheduled task (create_trigger/ScheduleWakeup with create_new_session_on_fire) firing /next-slice --unattended on a cadence, paired with subscribe_pr_activity so your PR review comments wake the agent to fix them. The real limit isn't "can't ask questions" (a background session can end its turn with a question and wait) — it's that unattended runs need a WIP limit (don't start a new slice while one agent PR is still open) and a "skip and flag" rule (mark anything escalation-worthy needs-decision in BACKLOG.md and move on, rather than stalling). Revisit once Tier 1 has run cleanly a few times and CI is green.

Staged implementation plan
Stage −1 (prerequisite): land feature/weight-progression first. Get that PR committed, pushed, reviewed, and merged through today's normal (manual) process before any scaffolding — so BACKLOG.md's "Done" section can start from a truthful, fully-merged state, and the new workflow isn't bootstrapped on top of unrelated in-flight work.

Stage 0 — scaffold (one PR, chore: add agent workflow scaffolding). Structure only, no fabricated product content:

CLAUDE.md — rules/pointers/workflow/escalation list (content above), product sections left as pointers only.
ROADMAP.md — headings only (Direction / Now / Next / Later / Not doing), marked for you to fill in.
BACKLOG.md — format spec, plus a Done section filled only with verifiable facts (PRs #2–#5, weight-progression), empty Now/Next otherwise.
DECISIONS.md — format spec, linking PHASE_3_NOTES.md/EXERCISE_AUDIT.md as prior history.
One-line freeze note at the top of ARCHITECTURE.md §10 pointing to ROADMAP.md/BACKLOG.md.
.claude/skills/next-slice/SKILL.md and .claude/skills/plan-epic/SKILL.md (both disable-model-invocation: true, so they only run when explicitly invoked).
.claude/settings.json — the allow/ask/deny rules from area 4 above, plus a SessionStart hook that prints git status -sb and BACKLOG.md's Now section so every session opens already oriented.
.github/pull_request_template.md (Backlog item / Summary / Decisions & trade-offs / Verification / Escalations / Follow-ups discovered).
Stage 1 — fill in content, add CI (separate conversation, this is where you give me the vision/roadmap):

You walk me through product direction and epic priority; I write it into ROADMAP.md and reconcile ARCHITECTURE.md's old Phase 4–7 descriptions into it.
Run /plan-epic on the top epic; you approve the resulting slice breakdown into BACKLOG.md.
Add .github/workflows/ci.yml (typecheck + test, Postgres 16 service container) and a root "typecheck": "pnpm -r typecheck" script.
Stage 2 — supervised dry run. Run /next-slice on one small, low-risk backlog item; check the reconcile step, whether escalation triggers fire correctly, PR description quality, and that verification evidence is real (not just claimed). Adjust the skill/CLAUDE.md wording, then run 2–3 more. Run /fewer-permission-prompts afterward to tighten the allowlist from real usage.

Stage 3 — optional Tier 2, later. Only once CI is green and 3+ supervised slices have gone cleanly: scheduled task + subscribe_pr_activity, as described in area 7 above.

File skeletons
CLAUDE.md (outline — full rule text drawn from area 4/5 above):

# Buff, Not Bored — agent guide
## Read before acting
- Product intent & principles: PRODUCT_SPEC.md §4
- Architecture & layer rules: ARCHITECTURE.md §2, §6-7
- What to work on: ROADMAP.md (direction, user-owned) → BACKLOG.md (slice status, agent-maintained)
- Past decisions: DECISIONS.md
## Repo map & commands
## Hard rules (engineering)
## Workflow
## Autonomy — decide freely / escalate / never
## Definition of done
ROADMAP.md:

# Roadmap
> Owned by you. The agent reads it; proposes changes only via question or PR.
## Direction        <!-- TODO: filled in together, Stage 1 -->
## Now / Next / Later / Not doing
BACKLOG.md:

# Backlog
> One slice = one vertical capability = one PR. Statuses: todo · in-progress · in-review (PR #n) · done (PR #n) · blocked · needs-decision
## Needs your decision
## Now (epic R-xx)
### S-001 · <capability> — status: todo
## Discovered (untriaged)
## Done   <!-- PR #2 db foundation, #3 workout persistence, #4/#5 exercise capability, weight-progression -->
Verification
Stage 0's PR is itself tooling/docs only — verify by running pnpm -r test and pnpm -r typecheck to confirm nothing in the app was touched, and by re-reading CLAUDE.md fresh (as a new session would) to confirm it's self-contained and under ~150 lines.
Stage 2's dry run is the real verification: does /next-slice actually reconcile the backlog correctly, pick a sensible item, produce a PR matching the template, and leave main untouched until you merge?
Appendix: alternatives considered (condensed)
Area	Recommended	Main alternative(s)	Why not (for now)
Product context	CLAUDE.md pointers, vision stays in spec	@-import the full docs into CLAUDE.md	15–28KB loaded every session, worse after context compaction
Planning	ROADMAP.md + BACKLOG.md, /plan-epic	GitHub Issues (auto-closes on merge); Todoist (already connected, mobile-friendly)	Both split the source of truth from the repo and need API calls just to see the backlog; markdown is zero new tooling
Execution	/next-slice skill, you invoke it	Procedure only in CLAUDE.md (loads every session, less reliable trigger); hooks drive the loop (expensive, can loop forever)	Skill is explicit, versioned, only loads when used
Decision-making	acceptEdits + allowlist + deny-list in settings.json	bypassPermissions	Removes the one mechanical safety net for the "never" list
Quality/safety	CLAUDE.md rules + one CI workflow	Rely on self-reported verification only	Doesn't scale to any future unattended run; cheap to add now
Progress tracking	Self-reconciling BACKLOG + DECISIONS.md	Keep updating ARCHITECTURE.md §10	That's the exact mechanism that already went stale
Automation	Tier 1 now, Tier 2 documented for later	Tier 2 now via /loop in one long session	Context/isolation gets worse the longer one session runs; no CI yet to trust a green check

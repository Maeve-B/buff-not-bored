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
### S-007 · History screen — status: needs-decision
- Epic: R-01 (item 8, History half) · Spec: §5.8
- Screens: History (none to be built for now)
- Design-first: yes
- Depends on: Maeve's UX decision
- Notes: UX under review by Maeve — possible overlap with Progress. Data capture unaffected. Logging still records sessions, programmes, and exercises done, skipped and swapped. The Progress half of R-01 item 8 is unchanged.
- Done when: Maeve decides the History UX (or folds it into Progress).

## Now (epic R-00 · Phase 0 — Clean-up)
_Breakdown approved 2026-10-18. Decisions D-002–D-006._

### S-001 · Exercise library in the new shape — status: done (PR #8)
- Epic: R-00 · Spec: §9.1, §10.2 (re-tag existing only)
- Screens: none
- Design-first: no
- Depends on: nothing
- Notes: schema change (escalate at plan). Keep the v1 seven groups alongside the new fields (D-002). New values flagged for review, with a one-page table in the review pack (D-005).
- Done when: all 33 existing exercises carry the §9.1 fields and pass validation; the existing app behaves as before.

### S-002 · Your weights move out of the library — status: done (PR #9)
- Epic: R-00 · Spec: §9.1 (`starting_weight` → user exercise state), §2, §10.1 (blank weights)
- Screens: Strength and Circuit workouts and the exercise page, in three states: weight set, no weight yet, bodyweight.
- Design-first: partly. Entering a blank weight is part of set logging, so it's a working skeleton only.
- Depends on: S-001
- Done when: sessions take your own weight, with a blank weight entered at first use; the library holds no weights.

_Re-planned 2026-10-21 (Maeve): Preset Programme 1 comes forward from Phase 1 and replaces the old 26-exercise Strength session (D-010). The old S-003 "Correct rep, set and rest defaults" is dropped: presets carry their own numbers, and the §6.3 goal defaults move to Phase 2's programme generator. Rest is shown as information only._

### S-003 · New exercises for Preset Programme 1 — status: done (PR #10)
- Epic: R-00 (brought forward from R-01 item 1) · Spec: §10.1, §9.1, §10.2 (subset)
- Screens: Exercises list; exercise page in three new states: assisted (no assistance yet / saved), weighted and timed (Farmer Carry), per side (Cable Woodchop)
- Design-first: no
- Depends on: S-001 ✅
- Notes: 11 new exercises; Squats, Deadlifts and Flat DB Press renamed to Preset 1's names. Circuit and the classic Strength session keep the original 33 exercises. No schema change.
- Done when: every Preset 1 exercise is in the library with a swap group, and the assisted ones record assistance.

### S-004 · Preset Programme 1 replaces today's Strength session — status: done (PR #12)
- Epic: R-00 (brought forward from R-01 item 2) · Spec: §10.1, §9.3
- Screens: Strength overview and set list for Monday, Wednesday and Friday; supersets; assisted and timed sets
- Design-first: partly (set logging stays a working skeleton)
- Depends on: S-003 ✅
- Notes: rep ranges and supersets as in §10.1. Every weight starts blank (D-003 kept for Preset 1). Today shows the next session due in the Mon → Wed → Fri rotation, with no rest-day note (D-011); you can pick any of the three. Rest is shown as information only. Reps before weight everywhere, Circuit included (D-009). Set rows must take a weight (or assistance) on timed loaded exercises: Farmer Carry and Assisted Dead Hang; today a timed exercise never shows a weight box.
- Done when: Strength shows Preset 1's session for the day, exactly as §10.1, and nothing else.

### S-005 · Progression becomes a nudge — status: done (PR #13)
- Epic: R-00 · Spec: §7.4, §6.5, §3.3
- Screens: Strength summary and Progress, in two states: ready to go up, not yet ready (placeholder text)
- Design-first: yes. The real nudge screen comes in Phase 1, so this slice uses plain text only.
- Depends on: S-004
- Notes: Preset 1 uses double progression: top of the range on every set, then you're offered a weight increase (or less assistance). The trigger uses reps only until set feedback is logged (D-006). Circuit keeps percentage progression. The old engines round weights to 0.5 kg; anything that stays must use the 0.25 kg step (D-007). Choosing which increment options become the nudge chips is a design question. Assisted exercises progress downwards: the engine must read the load direction, so a nudge offers less assistance, never more.
- Done when: no strength screen suggests a weight automatically; the engine reports readiness and increment options.

### S-006 · kg or lb, chosen in Settings — status: done (PR #14)
- Epic: R-00 (requested by Maeve, 2026-10-18; not in the spec)
- Spec: none yet; extends D-007
- Screens: Settings (unit choice); every weight label and box shows the chosen unit
- Design-first: no
- Depends on: S-002 ✅
- Notes: one unit everywhere, not per exercise. Store kg; convert for display and entry, so nothing saved changes. lb moves in 0.5 lb steps, with jumps such as +0.5 / +1 / +2.5 / +5 lb (confirmed by Maeve).
- Done when: switching to lb shows and accepts every weight in lb, and switching back shows the same kg values as before.

## Now (epic R-01 · Phase 1 — Scoped programme generator)
_Spec §12 Phase 1 item 12, §14 decision 8. Breakdown approved 2026-10-26; answers in D-016. Engine-only slices (S-008 to S-011) can start now; the review screens (S-013, S-014) wait until logging (R-01 item 3) is in._

### S-008 · Your training needs (profile) — status: todo
- Epic: R-01 (items 11–12) · Spec: §6.1, §5.14, §5.1
- Screens: a needs form: goal, emphasis, experience, days per week and preferred days, session length, equipment, limitations, avoids. Saved and editable.
- Design-first: yes (onboarding). Working skeleton only.
- Depends on: nothing
- Notes: **schema change** (a needs-profile table). The AI chat (item 11) fills in the same profile later. The AI only collects and structures; it never generates (§4.1).
- Done when: you can enter, save, reload and edit your needs profile.

### S-009 · Library additions for the generator — status: todo
- Epic: R-01 (item 1, part) · Spec: §10.2, §9.1, §6.6
- Screens: Exercises list
- Design-first: no
- Depends on: nothing
- Notes: dumbbell, bodyweight and bar-friendly exercises so every pattern has options: goblet squat, DB Romanian deadlift, glute bridge (+ single-leg), reverse lunge, step-up, dead bug, side plank, push-up progression, pull-up, chin-up, negative and band-assisted pull-up, and so on. Light alternatives wherever one exists. Classic Circuit and Strength stay on their own lists (D-012). Data only, no schema change.
- Done when: a dumbbells-only or knee-limited profile has an option for every pattern the library can reasonably cover.

### S-010 · Programme model and the rule checker — status: todo
- Epic: R-01 (item 12) · Spec: §9.3, §6.4
- Screens: none
- Design-first: no
- Depends on: nothing
- Notes: one shape for preset and generated programmes (sessions → slots, source, goal, explanations). An automatic checker for every §6.4 hard rule; a weekly pattern that's impossible for your equipment or limitations counts as an explained gap (D-016).
- Done when: Preset Programme 1 is expressed in the shared shape and passes the checker.

### S-011 · The generator — status: todo
- Epic: R-01 (item 12) · Spec: §6.1–§6.6, §4.1, §9.3
- Screens: none
- Design-first: no
- Depends on: S-008, S-009, S-010
- Notes: profile → programme. Full body, 2–4 days; strength, hypertrophy or general fitness plus emphasis; existing library only; limitations, avoids and equipment respected; plain-language explanations for every choice; choices per D-016. Required tests: the same profile gives the same programme; the rule checker passes across a spread of profiles (2 or 4 days, dumbbells only, knee limitation, beginner, advanced); Maeve's profile is compared side by side with Preset 1.
- Done when: the required tests pass, and Maeve's generated programme reads as sensible next to Preset 1.

### S-012 · Saved programmes and your active programme — status: todo
- Epic: R-01 (item 12) · Spec: §9.3, §5.4
- Screens: Strength overview (shows the active programme's name)
- Design-first: no
- Depends on: S-010
- Notes: **schema change** (programmes table, plus the active programme). Strength runs whichever programme is active, Preset 1 by default, with the same next-due rotation (D-011).
- Done when: switching the active programme changes what Strength offers, and Preset 1 still works exactly as before.

### S-013 · Review your generated programme — status: todo
- Epic: R-01 (item 12) · Spec: §12 Phase 1 item 12 (review step), §9.3
- Screens: review screen: sessions, slots, explanations; accept / regenerate
- Design-first: yes. Working skeleton only, then stop for Maeve's design.
- Depends on: S-011, S-012, and logging (R-01 item 3)
- Done when: you can generate from your profile, read every explanation, regenerate, and accept it as your active programme.

### S-014 · Swap a slot before accepting — status: todo
- Epic: R-01 (item 12) · Spec: §12 Phase 1 item 12, §9.2, §6.4
- Screens: the review screen (skeleton)
- Design-first: yes
- Depends on: S-013
- Notes: candidates from the same swap group and pattern, filtered by equipment, limitations and avoids, then re-checked against the hard rules, with the explanation updated.
- Done when: any slot can be swapped for a valid alternative, and the programme still passes the checker.

## Discovered (untriaged)
- Weight history has no pagination yet (from PR #6).
- Same-day ordering between a workout entry and a manual weight entry is a simple sort (from PR #6).
- CI uses GitHub actions (checkout, setup-node, pnpm) that run on retiring Node 20; bump to their next major versions.
- The screenshot script for review packs lives in the session scratchpad; consider adding a reusable one to the repo.
- §9.1 has no knee-flexion movement pattern, so Leg Curl is filed under hinge (S-003). Propose adding one to the spec.
- Assisted Pull-Up and Assisted Dead Hang are alone in their swap groups until the library expansion adds band-assisted and negative pull-ups (§10.2). Swap has nothing to offer them yet.
- The exercise page offers a weight box even for unloaded exercises (Plank, Captain's Chair Knee Raise).
- Home and Programmes still show the old seeded "8 Week Strength" (Mon/Wed) while Strength runs Preset 1. Left as is until Maeve designs Home (2026-10-21).
- `pnpm test` empties the local database: packages/db's integration tests clear every table before each test (pre-existing). Point tests at their own database so your local data survives.
- Saved Strength sets record only the bottom of the rep range as their target; the full range lives in the programme. History and Progress may want the range later.
- The Strength summary's "progression recommendations" still come from the old engine; S-005 replaces them with the nudge.
- Phase 1's nudge at session start (chips to tap, "Not yet" snoozing, logged decisions) needs somewhere to store decisions (a schema change). Reading the last finished session back already exists (S-005).
- Circuit's percentage suggestions now land on 0.25 kg steps, which its tap stepper (2.5 / 0.5 kg taps) can't always reach. Revisit with the set-logging design.
- `server-only` (a tiny Next.js package) would guard server-side modules such as lib/settings.ts from ever being imported in the browser. Not added: it's a new dependency, so it needs your OK.
- Saving on the exercise page used to fail for an exercise never done in a workout (no database row yet). Fixed in S-003; first-use weight saves get the same fix.

## Done
- PR #1 · Architecture proposal and Phase 1–2 domain engine (v1 rules)
- PR #2 · Database foundation (`feature/database-foundation`)
- PR #3 · Incremental workout persistence (`feature/workout-persistence`)
- PR #4 · Exercise capability foundation (`feature/exercise-capability`)
- PR #5 · Exercise capability UI (`feature/exercise-capability-ui`)
- PR #6 · Exercise weight history and independent weight tracking (`feature/weight-progression`)
- PR #7 · Agent workflow scaffolding, roadmap and CI (`chore/agent-workflow-scaffolding`)
- PR #8 · S-001 Exercise library in the new shape (`feature/library-v2`)
- PR #9 · S-002 Your weights move out of the library (`feature/user-weights`)

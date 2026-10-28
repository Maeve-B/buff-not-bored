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

### D-004 · Strength mode uses the strength goal defaults (2026-10-18) — superseded by D-010
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

### D-009 · Reps always come before weight (2026-10-18, Maeve)
- Decision: everywhere a set is entered or shown, reps come first and weight second ("20 reps × 20 kg"). Strength sets already do; Circuit and the logged-set text follow in S-004.

### D-010 · Preset Programme 1 comes forward and replaces the old Strength session (2026-10-21, Maeve)
- Context: the old 26-exercise Strength session isn't a real programme; Maeve's Mon/Wed/Fri programme is Preset Programme 1 (§10.1), planned for Phase 1.
- Decision: build Preset 1's exercises (S-003) and the programme (S-004) now, ahead of the progression nudge. Drop the "correct rep, set and rest defaults" slice: presets carry their own numbers, and the §6.3 goal defaults belong to Phase 2's generator. Rest is shown as information only: no timer, nothing enforced.
- Alternatives: tuning the old session's defaults first (effort spent on a session about to be replaced).

### D-011 · Preset 1 starts blank and follows the rotation (2026-10-21, Maeve)
- Decision: every Preset 1 weight starts blank, including those listed in §10.1 (D-003 kept). Today shows the next session due in the Mon → Wed → Fri rotation, whatever the calendar day, with no rest-day note; you can pick any of the three.
- Detail (S-004, Maeve): the reps box starts at the bottom of the range. The rotation moves on once a session has at least one logged set, whether or not you tapped Finish. Rest is worded as a recommendation ("Recommended rest 2–3 min").

### D-012 · Preset 1's exercises join the library; Circuit and classic Strength keep the original 33 (2026-10-21, S-003)
- Context: the "I'm bored" refresh and swaps draw on the whole library, so new gym exercises would leak into Circuit.
- Decision: the library holds every exercise; Circuit and the classic Strength session draw only on the original 33. Squats, Deadlifts and Flat DB Press are renamed Back Squat, Conventional Deadlift and DB Bench Press (Maeve). Assisted exercises have no separate light alternative: their lighter version is more assistance. Leg Curl is filed under the hinge pattern until the spec has a knee-flexion pattern. Cable and machine stacks offer the barbell jumps, from 0.25 kg (D-007).
- Revisit if: Phase 1's "quick workout: full body with swap" wants the gym exercises.

### D-013 · Home and Programmes wait for the Home design (2026-10-21, Maeve, S-004) — partly superseded by D-018
- Context: Home's "Your Programme" card and the Programmes screen run on the old seeded "8 Week Strength" (Mon/Wed) schedule.
- Decision: leave both untouched until Maeve designs Home. Strength runs Preset 1 on its own rotation, read from saved workouts; Home's Start button still opens Strength.
- Revisit when: the Home design lands.

### D-014 · The progression nudge is a notification, judged on one session (2026-10-26, Maeve, S-005)
- Decision: for a rep (or seconds) range, you're ready to progress when every set of one session reached the top of the range at no less than your current weight (no more than your current assistance). Otherwise the app suggests more reps or a longer hold. It's information only: options come from the exercise's real jumps, and you change your weight yourself on the exercise page. Nothing changes a weight automatically (§3.3).
- Also: assistance cuts larger than your current assistance aren't offered. A set logged with no weight doesn't count.
- Next time (Maeve, 2026-10-26): the "ready" message also shows when you next do the exercise, from your last finished workout with it, until you change that weight. On the overview it links to the exercise page; on the exercise card mid-workout it has no link, because a change made then applies from the next session (§3.3).
- Circuit keeps percentage progression (§3.3), now rounded to 0.25 kg steps like everything else (D-007).
- Alternatives: §7.4's general "two sessions in a row" rule (kept for any future fixed-rep load nudge); buttons that change the weight (Phase 1's design-first nudge screen).

### D-015 · kg or lb: one unit everywhere, weights stored in kg (2026-10-26, Maeve, S-006)
- Decision: a single weight unit, chosen in Settings and saved in the database (one settings row until multi-user accounts), so every device agrees. Weights stay stored in kg; lb is only how they're shown and entered. kg moves in 0.25 kg steps; lb in 0.5 lb steps, with jumps of +0.5 / +1 / +2.5 / +5 lb and Circuit taps of 5 lb (barbell) / 1 lb.
- Because 0.5 lb is finer than 0.25 kg, a weight entered in lb is stored to the gram, not rounded to 0.25 kg, so 45.5 lb stays 45.5 lb. Your own weight is never rounded when it's prescribed (only session adjustments land on the 0.25 kg step). A weight shown in lb and logged back unchanged keeps its exact kg.
- Consequence: a weight entered in lb, viewed in kg, is shown to the nearest 0.25 kg (88 lb reads as 40 kg; stored as 39.916 kg).
- The ⚙️ button opens Settings (Maeve), which links to Exercises. If the database can't be reached, the app shows kg rather than failing.
- Alternatives: a per-device setting (no schema change, but phone and laptop could disagree); rounding lb entries to 0.25 kg (45.5 lb would drift).

### D-016 · Scoped generator: the open choices (2026-10-26, Maeve, R-01 item 12)
- **Impossible patterns:** when equipment or a limitation makes a weekly pattern impossible (for example dumbbells only → no vertical pull), the programme records an explained gap rather than refusing; the rule checker accepts "covered or explained".
- **Light alternative:** where an exercise has none, the light day uses §6.6's other option, the same exercise with one fewer set, and says so.
- **Timing:** the engine-only slices start now; the review screens wait until logging is in.
- **General fitness (§6.3 has no row):** compound 3 × 8–10, isolation 2–3 × 10–15, rest 60–120 s.
- **Sets by experience:** beginner 2, intermediate 3, advanced 3–4.
- **Emphasis:** one extra slot per session in the emphasised pattern (glutes → hip extension, core → an extra core slot, pull-up → pull-up work first).
- **Session length:** caps each session's exercises so the estimated time fits (sets × work + recommended rest); any cut is explained.
- **Days:** preferred days, spaced per §6.2, become a suggested schedule; the app keeps the next-due rotation (D-011).

### D-018 · A conversation on the home screen, and adapting from check-ins in Phase 1 (2026-10-28, Maeve)
- Context: after trying the needs form, Maeve wants a conversational style on the home screen, one question at a time, and the app using the book to adapt the programme.
- Decision:
  - New users get a setup conversation on Home that asks the needs questions one at a time and fills in the same profile as the form (S-008).
  - Returning users get a check-in conversation (sleep, energy, soreness, pain).
  - It's scripted first; the AI chat comes later for free-text answers. The engine applies the book's rules (§6.6); the conversation only asks and explains (§4.1).
  - The check-in, light-day offer, pain handling and repeated-failure handling move into Phase 1. Deloads and the overreaching watch stay in Phase 2.
  - A working skeleton of the home conversation is built now, ahead of the Home design (relaxing D-013 for this part of Home only).
  - The needs form stays in Settings for editing your answers.
- Spec: §5.1, §5.2, §6.6, §12 Phase 1 items 9, 10 and 13, §14 decision 9.

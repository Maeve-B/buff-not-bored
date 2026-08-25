# Exercise Audit

Snapshot of every exercise currently in `packages/domain/src/data/exercises.ts` (33 total), for review before the optimisation engine is built. No exercise data was changed outside of the explicit taxonomy decisions in this revision — see the changelog at the bottom.

**Weight notation:** "each DB" = a dumbbell held in each hand simultaneously; "single DB" = one dumbbell only (unilateral, or held with both hands); "bar" = total barbell load. This basis isn't a stored field — it's inferred here from each exercise's movement pattern for readability.

**Status column meanings:**
- **In Template** — Yes / Yes (finisher) / No
- **Alternate** — Yes if it's library-only (not in the current template), No if it's in the template
- **Review** — Yes if flagged `needsReview: true` (some part of the record — usually weight/reps/equipment, occasionally muscle classification — is a placeholder pending your confirmation; see the exercise's `notes` for which part)

---

## Muscle taxonomy (current)

Per your taxonomy decision: `ProgrammeGroup` (Legs / Back / Chest / Triceps / Shoulders / Biceps / Core) is body/programme-area only. `Muscle` is physiological coverage only, and no longer contains anything that competes with a more specific value:

```
quads, glutes, adductors, hamstrings, calves, spinal_erectors,
lats, upper_back, trapezius,
lateral_deltoids, anterior_deltoids,
chest, upper_chest,
triceps, biceps, brachialis, forearms,
abdominals, obliques
```

Generic `back` and `shoulders` have been removed entirely from `Muscle` (they collided with `lats`/`upper_back`/`trapezius` and `lateral_deltoids`/`anterior_deltoids`). `quadriceps` was renamed to `quads` to match your naming. No anatomical subdivision was added beyond `trapezius` (e.g. no upper/middle/lower traps).

One thing worth flagging back to you, not a change I made: your conceptual hierarchy listed **Arms** as a single body/programme-area category, but the actual `ProgrammeGroup` enum still splits **Triceps** and **Biceps** as separate categories (matching the original programme, which trains them as distinct blocks). I left `ProgrammeGroup` untouched since you didn't ask for that merge and it wasn't part of the Muscle-taxonomy instruction — flagging in case "Arms" was meant literally rather than illustratively.

---

## Legs (5 template + 1 finisher, 6 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Squats | legs | quads | glutes, adductors | barbell | rack | 20 kg (bar) | 20 reps | 5% | Yes | No | No |
| Squat Pulse | legs | quads | glutes | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | No |
| Lunges (Alternating) | legs | quads, glutes | hamstrings, adductors | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | Yes *(weight only — muscles confirmed)* |
| Sumo Squats | legs | glutes, adductors | quads | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | No |
| Squat + Calf Raise | legs | quads | glutes, calves | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | No |
| Bodyweight Squat Pulses | legs | quads | glutes | bodyweight | standing | — | 30 sec | — | Yes (finisher) | No | No |

Library-only leg alternate:

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Bulgarian Split Squat | legs | glutes, quads | hamstrings, adductors | dumbbell | bench | 8 kg (each DB) | 12 reps/side | 2.5% | No | Yes | No |

---

## Back (5 template, 6 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Deadlifts | back | hamstrings, glutes | spinal_erectors, **lats** | barbell | rack | 35 kg (bar) | 20 reps | 5% | Yes | No | No |
| Bent-Over Row | back | lats | upper_back, biceps | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | Yes *(weight only)* |
| Single-Arm Dumbbell Row | back | lats | upper_back, biceps | dumbbell | bench | 8 kg (single DB) | 12 reps/side | 5% | Yes | No | Yes *(weight only — muscles confirmed)* |
| Good Mornings | back | hamstrings, glutes | spinal_erectors | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | Yes *(weight only — muscles confirmed)* |
| Superman Holds | back | spinal_erectors | glutes | bodyweight | floor | — | 30 sec | — | Yes | No | No |
| RDL to Upright Row | back | hamstrings, glutes | upper_back, **lateral_deltoids, trapezius** | barbell | rack | 20 kg (bar) | 16 reps | 5% | No | Yes | No |

**Deadlifts** (`back`→`lats`) and **RDL to Upright Row** (`shoulders`→`lateral_deltoids, trapezius`) are the two secondary-muscle values I had to reassign myself when the generic values were retired — see "Flagged" below.

---

## Chest (3 template, 5 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Flat Bench Press | chest | chest | triceps, anterior_deltoids | barbell | bench | 20 kg (bar) | 16 reps | 2.5% | Yes | No | Yes *(weight only — muscles confirmed)* |
| Bench Flyes | chest | chest | anterior_deltoids | dumbbell | bench | 6 kg (each DB) | 16 reps | 2.5% | Yes | No | Yes *(weight only — muscles confirmed)* |
| Push-Ups | chest | chest | triceps, anterior_deltoids | bodyweight | bench_or_floor | — | 15 reps | — | Yes | No | No |
| Flat DB Press | chest | chest | triceps, anterior_deltoids | dumbbell | bench | 8 kg (each DB) | 20 reps | 2.5% | No | Yes | No |
| Incline DB Press | chest | upper_chest | anterior_deltoids, triceps | dumbbell | bench | 8 kg (each DB) | 16 reps | 2.5% | No | Yes | No |

---

## Triceps (3 template, 4 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lying Tricep Extensions | triceps | triceps | — | dumbbell | bench | 4 kg (each DB) | 16 reps | 2.5% | Yes | No | No |
| Close-Grip Bench Press | triceps | **triceps, chest** | anterior_deltoids | barbell | bench | 20 kg (bar) | 16 reps | 2.5% | Yes | No | Yes *(weight only — muscles confirmed)* |
| Tricep Kickbacks | triceps | triceps | — | dumbbell | bench | 4 kg (each DB) | 16 reps | 2.5% | Yes | No | No |
| Close-Grip Push-Ups | triceps | triceps | chest | bodyweight | bench_or_floor | — | 12 reps | — | No | Yes | No |

Close-Grip Bench Press's primary muscles changed this revision (was `triceps` only with `chest` secondary; now `triceps, chest` both primary, `anterior_deltoids` secondary) per your explicit classification. **Close-Grip Push-Ups keeps the old single-primary scheme** — same close-grip pressing pattern, different classification shape. Flagged below as a small consistency question, not urgent.

---

## Shoulders (3 template, 5 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Overhead Press | shoulders | **anterior_deltoids** | **lateral_deltoids, triceps** | dumbbell | standing | 12.5 kg (each DB) | 16 reps | 2.5% | Yes | No | **Yes** *(muscles only — weight/reps are your original confirmed values)* |
| Lateral Raises | shoulders | lateral_deltoids | — | dumbbell | standing | 4 kg (each DB) | 16 reps | 2.5% | Yes | No | No |
| Upright Row | shoulders | lateral_deltoids, trapezius | biceps, upper_back | dumbbell | standing | 6 kg (each DB) | 16 reps | 2.5% | Yes | No | Yes *(weight only — muscles confirmed)* |
| Front Raises | shoulders | anterior_deltoids | — | dumbbell | standing | 4 kg (each DB) | 16 reps | 2.5% | No | Yes | No |
| RDL to Upright Row | *(listed under Back — same exercise, not duplicated)* | | | | | | | | | | |

**Overhead Press was reclassified as a direct consequence of retiring `shoulders`** — this is the one reclassification in this revision that you didn't explicitly specify. See "Flagged" below.

---

## Biceps (3 template, 4 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Barbell Curl | biceps | biceps | — | barbell | rack | 15 kg (bar) | 16 reps | 2.5% | Yes | No | Yes *(weight only)* |
| Alternating Dumbbell Curl | biceps | biceps | — | dumbbell | standing | 6 kg (each DB) | 20 reps | 2.5% | Yes | No | No |
| Hammer Curl | biceps | biceps, brachialis | forearms | dumbbell | standing | 6 kg (each DB) | 16 reps | 2.5% | Yes | No | No |
| Concentration Curl | biceps | biceps | — | dumbbell | bench | 6 kg (single DB) | 12 reps/side | 2.5% | No | Yes | No |

---

## Core (3 template, 3 library total — no alternates yet)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Plank | core | abdominals | glutes | bodyweight | bench_or_floor | — | 45 sec | — | Yes | No | No |
| Russian Twists | core | obliques | abdominals | dumbbell | bench_or_floor | 4 kg (single DB) | 20 reps | 2.5% | Yes | No | No |
| Bicycle Crunches | core | abdominals | obliques | bodyweight | floor | — | 20 reps | — | Yes | No | No |

---

## Summary counts

- **Library total:** 33 exercises
- **In current template:** 26 slots (25 main + 1 finisher: Bodyweight Squat Pulses)
- **Library-only alternates:** 7 (Bulgarian Split Squat, RDL to Upright Row, Flat DB Press, Incline DB Press, Close-Grip Push-Ups, Front Raises, Concentration Curl)
- **Flagged `needsReview: true`:** 10 — the 9 newly-added exercises from the programme correction, plus Overhead Press (newly flagged this revision, muscle classification only)

---

## Flagged: assumptions and ambiguity in muscle / programme-group classification

### Needs your call

**Overhead Press** — reclassified `primary: anterior_deltoids`, `secondary: lateral_deltoids, triceps` (was `primary: shoulders`, `secondary: triceps`). This is the one classification change in this revision **you didn't specify** — it was a forced consequence of retiring the generic `shoulders` muscle value, and I had to pick a replacement. Standard classification for a compound vertical dumbbell press, low ambiguity, but please confirm — its weight/reps (12.5kg, 16 reps) are your original confirmed values, only the muscle split is new.

### Low ambiguity — assumed by me as a direct consequence of the taxonomy refactor, not previously flagged

**Deadlifts** — secondary `back` → `lats`. Deadlifts' isometric lat engagement (keeping the bar close, protecting the spine) is a standard, well-established secondary role — low ambiguity, but this is a data change to an exercise whose weight (35kg) you already confirmed, so flagging it explicitly rather than burying it in a rename.

**RDL to Upright Row** — secondary `upper_back, shoulders` → `upper_back, lateral_deltoids, trapezius`. This library alternate combines an RDL with an upright row; once `shoulders` was retired I extrapolated its secondary muscles from your new Upright Row classification (lateral_deltoids + trapezius are the upright-row component's primary movers). Reasonable by construction, but worth a glance since it's inferred, not stated.

### Minor consistency note (not a classification error, just worth deciding)

**Close-Grip Bench Press vs. Close-Grip Push-Ups.** Your correction gave Close-Grip Bench Press a dual-primary classification (`triceps, chest` both primary). The existing Close-Grip Push-Ups (bodyweight alternate, same movement pattern) still uses the older single-primary scheme (`triceps` primary, `chest` secondary) from before this taxonomy pass. Same exercise pattern, two different classification shapes — not urgent, but worth aligning at some point, likely by applying the dual-primary scheme to Close-Grip Push-Ups too.

### Resolved this revision (previously flagged, now confirmed by you)

Upright Row, Good Mornings, Single-Arm Dumbbell Row, Lunges, Close-Grip Bench Press, Flat Bench Press, Bench Flyes — all now carry your explicitly-confirmed muscle classifications. `needsReview` stays `true` on these where weight/reps/equipment are still placeholder estimates (all of them except — none; all seven still need weight/reps confirmation), but the muscle-classification uncertainty itself is closed.

**Generic `back` vs. `shoulders` competing with specific muscle values** — resolved per your taxonomy rule. Both removed from the `Muscle` enum entirely; every use has been reassigned to a specific value (see above).

**Bulgarian Split Squat, Bent-Over Row** — unchanged from the prior audit; still resolved/confirmed.

---

## Changelog (this revision)

1. Added `trapezius` to `Muscle`. Removed `back` and `shoulders`. Renamed `quadriceps` → `quads`.
2. Upright Row: `primary: [lateral_deltoids, trapezius]`, `secondary: [biceps, upper_back]` (was `primary: [lateral_deltoids]`, `secondary: [shoulders, biceps]`).
3. Good Mornings, Single-Arm Dumbbell Row, Lunges, Flat Bench Press, Bench Flyes: muscle values unchanged (already matched your classification) — `notes` updated to record confirmation.
4. Close-Grip Bench Press: `primary: [triceps, chest]`, `secondary: [anterior_deltoids]` (was `primary: [triceps]`, `secondary: [chest]`).
5. Deadlifts: `secondary: [spinal_erectors, lats]` (was `[spinal_erectors, back]`).
6. RDL to Upright Row: `secondary: [upper_back, lateral_deltoids, trapezius]` (was `[upper_back, shoulders]`).
7. Overhead Press: `primary: [anterior_deltoids]`, `secondary: [lateral_deltoids, triceps]` (was `primary: [shoulders]`, `secondary: [triceps]`); newly flagged `needsReview: true`.
8. All `quadriceps` occurrences renamed to `quads` (Squats, Squat Pulse, Lunges, Sumo Squats, Squat + Calf Raise, Bodyweight Squat Pulses, Bulgarian Split Squat).
9. Tests updated/added in `test/exercise-catalog.test.ts` and `test/muscle-coverage.test.ts` — 52 tests passing (was 44), `tsc --noEmit` clean.

No `ProgrammeGroup`, template, allocation, or weight/reps data changed. Phase 2 not started.

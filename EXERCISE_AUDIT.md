# Exercise Audit

Snapshot of every exercise currently in `packages/domain/src/data/exercises.ts` (33 total), for review before the optimisation engine is built. No exercise data was changed to produce this document — it's a read-only report generated from the current library and `data/programme-template.ts`.

**Weight notation:** "each DB" = a dumbbell held in each hand simultaneously; "single DB" = one dumbbell only (unilateral, or held with both hands); "bar" = total barbell load. This basis isn't a stored field — it's inferred here from each exercise's movement pattern for readability.

**Status column meanings:**
- **In Template** — Yes / Yes (finisher) / No
- **Alternate** — Yes if it's library-only (not in the current template), No if it's in the template
- **Review** — Yes if flagged `needsReview: true` (placeholder data pending your confirmation)

---

## Legs (5 template + 1 finisher, 6 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Squats | legs | quadriceps | glutes, adductors | barbell | rack | 20 kg (bar) | 20 reps | 5% | Yes | No | No |
| Squat Pulse | legs | quadriceps | glutes | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | No |
| Lunges (Alternating) | legs | quadriceps, glutes | hamstrings, adductors | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | **Yes** |
| Sumo Squats | legs | glutes, adductors | quadriceps | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | No |
| Squat + Calf Raise | legs | quadriceps | glutes, calves | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | No |
| Bodyweight Squat Pulses | legs | quadriceps | glutes | bodyweight | standing | — | 30 sec | — | **Yes (finisher)** | No | No |

Library-only leg alternate (not in the template, shown here rather than under Chest — see below):

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Bulgarian Split Squat | legs | glutes, quadriceps | hamstrings, adductors | dumbbell | bench | 8 kg (each DB) | 12 reps/side | 2.5% | No | **Yes** | No |

---

## Back (5 template, 6 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Deadlifts | back | hamstrings, glutes | spinal_erectors, back | barbell | rack | 35 kg (bar) | 20 reps | 5% | Yes | No | No |
| Bent-Over Row | back | lats | upper_back, biceps | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | **Yes** |
| Single-Arm Dumbbell Row | back | lats | upper_back, biceps | dumbbell | bench | 8 kg (single DB) | 12 reps/side | 5% | Yes | No | **Yes** |
| Good Mornings | back | hamstrings, glutes | spinal_erectors | barbell | rack | 20 kg (bar) | 16 reps | 5% | Yes | No | **Yes** |
| Superman Holds | back | spinal_erectors | glutes | bodyweight | floor | — | 30 sec | — | Yes | No | No |
| RDL to Upright Row | back | hamstrings, glutes | upper_back, shoulders | barbell | rack | 20 kg (bar) | 16 reps | 5% | No | **Yes** | No |

---

## Chest (3 template, 5 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Flat Bench Press | chest | chest | triceps, anterior_deltoids | barbell | bench | 20 kg (bar) | 16 reps | 2.5% | Yes | No | **Yes** |
| Bench Flyes | chest | chest | anterior_deltoids | dumbbell | bench | 6 kg (each DB) | 16 reps | 2.5% | Yes | No | **Yes** |
| Push-Ups | chest | chest | triceps, anterior_deltoids | bodyweight | bench_or_floor | — | 15 reps | — | Yes | No | No |
| Flat DB Press | chest | chest | triceps, anterior_deltoids | dumbbell | bench | 8 kg (each DB) | 20 reps | 2.5% | No | **Yes** | No |
| Incline DB Press | chest | upper_chest | anterior_deltoids, triceps | dumbbell | bench | 8 kg (each DB) | 16 reps | 2.5% | No | **Yes** | No |

---

## Triceps (3 template, 4 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lying Tricep Extensions | triceps | triceps | — | dumbbell | bench | 4 kg (each DB) | 16 reps | 2.5% | Yes | No | No |
| Close-Grip Bench Press | triceps | triceps | chest | barbell | bench | 20 kg (bar) | 16 reps | 2.5% | Yes | No | **Yes** |
| Tricep Kickbacks | triceps | triceps | — | dumbbell | bench | 4 kg (each DB) | 16 reps | 2.5% | Yes | No | No |
| Close-Grip Push-Ups | triceps | triceps | chest | bodyweight | bench_or_floor | — | 12 reps | — | No | **Yes** | No |

---

## Shoulders (3 template, 5 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Overhead Press | shoulders | shoulders | triceps | dumbbell | standing | 12.5 kg (each DB) | 16 reps | 2.5% | Yes | No | No |
| Lateral Raises | shoulders | lateral_deltoids | — | dumbbell | standing | 4 kg (each DB) | 16 reps | 2.5% | Yes | No | No |
| Upright Row | shoulders | lateral_deltoids | shoulders, biceps | dumbbell | standing | 6 kg (each DB) | 16 reps | 2.5% | Yes | No | **Yes** |
| Front Raises | shoulders | anterior_deltoids | — | dumbbell | standing | 4 kg (each DB) | 16 reps | 2.5% | No | **Yes** | No |
| RDL to Upright Row | *(listed under Back — same exercise, not duplicated)* | | | | | | | | | | |

---

## Biceps (3 template, 4 library total)

| Exercise | Programme Group | Primary Muscles | Secondary Muscles | Equipment | Location | Starting Weight | Reps / Duration | Progression % | In Template | Alternate | Review |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Barbell Curl | biceps | biceps | — | barbell | rack | 15 kg (bar) | 16 reps | 2.5% | Yes | No | **Yes** |
| Alternating Dumbbell Curl | biceps | biceps | — | dumbbell | standing | 6 kg (each DB) | 20 reps | 2.5% | Yes | No | No |
| Hammer Curl | biceps | biceps, brachialis | forearms | dumbbell | standing | 6 kg (each DB) | 16 reps | 2.5% | Yes | No | No |
| Concentration Curl | biceps | biceps | — | dumbbell | bench | 6 kg (single DB) | 12 reps/side | 2.5% | No | **Yes** | No |

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
- **Flagged `needsReview: true`:** 9 (all newly-added in the programme correction — see below)

---

## Flagged: assumptions and ambiguity in muscle / programme-group classification

This is the section you asked for specifically — separate from the general `needsReview` weight/reps placeholders (which are a data-completeness issue), this covers exercises where the *classification itself* involved a judgment call, ranked by how confident I am in it.

### Higher ambiguity — recommend you confirm

**Upright Row** — `primary: lateral_deltoids`, `secondary: shoulders, biceps`.
Training literature genuinely disagrees on this one: the primary mover shifts with grip width — a narrow grip emphasizes upper trapezius and front delts, a wider grip shifts toward lateral delts. There's also no `trapezius` value in the current `Muscle` enum, so trap involvement (which many sources treat as the *primary* driver, not secondary) isn't representable at all right now. This is the one classification I'd flag as unresolved rather than just unconfirmed.

**Good Mornings** — `primary: hamstrings, glutes`, `secondary: spinal_erectors`.
Modeled by analogy to Deadlifts/RDL (posterior-chain hinge), but some classifications treat Good Mornings as primarily a spinal-erector/lower-back exercise with hamstrings/glutes as secondary — essentially the reverse emphasis. Worth confirming which framing matches how you actually feel this movement.

### Lower ambiguity — assumed by analogy, standard classification, likely fine but not explicitly confirmed

**Single-Arm Dumbbell Row** — `primary: lats`, `secondary: upper_back, biceps`.
Mirrors your confirmed Bent-Over Row classification (same pulling pattern, unilateral). Anatomically consistent, but you only confirmed Bent-Over Row explicitly — this one is inferred, not given.

**Lunges (Alternating)** — `primary: quadriceps, glutes`, `secondary: hamstrings, adductors`.
Modeled on Bulgarian Split Squat / Sumo Squat (unilateral/wide-stance leg pattern). Standard classification for a walking/alternating lunge, low ambiguity.

**Close-Grip Bench Press** — `primary: triceps`, `secondary: chest`.
Modeled on the existing Close-Grip Push-Ups classification (same close-grip horizontal press pattern, barbell instead of bodyweight). Standard, low ambiguity.

**Flat Bench Press / Bench Flyes** — chest primary, anterior_deltoids (+ triceps for the press) secondary.
Directly mirrors the already-established Flat DB Press classification. Well-established movement classifications, low ambiguity.

### Resolved, not currently ambiguous (included for completeness)

**Bulgarian Split Squat** — `programmeGroup: legs`, `primary: glutes, quadriceps`, `secondary: hamstrings, adductors`. This was the exercise at the center of the original programme-group correction; muscle values themselves are unchanged from the original spec and were confirmed as part of that correction. No longer grouped under chest, and no special case remains tying it there.

**Bent-Over Row** — `primary: lats`, `secondary: upper_back, biceps`. Explicitly confirmed by you; not an assumption.

### Cross-cutting taxonomy questions (affect multiple exercises, not one)

- **Generic `back` vs. `lats`/`upper_back`/`spinal_erectors`.** Deadlifts' secondary muscles list both `spinal_erectors` *and* `back` — now that more specific back-region values exist (`lats`, `upper_back`), it's worth deciding whether generic `back` should be retired in favor of the specific ones, or whether it's meant to capture something the specific values don't (e.g. general postural/stabilizer involvement). Currently only Deadlifts and RDL to Upright Row use the generic `back` value.
- **Generic `shoulders` vs. `lateral_deltoids`/`anterior_deltoids`.** Overhead Press's primary and RDL-to-Upright-Row/Upright-Row's secondary use generic `shoulders`, while Lateral Raises/Front Raises use the specific deltoid heads. Same question as above: is `shoulders` a deliberate coarser category for compound/multi-head movements, or should it eventually be split?

Neither of these blocks anything — the muscle enum was deliberately kept at "moderate, programming-useful granularity" per your earlier guidance — but since coverage-based optimisation will eventually compare muscles across exercises, a generic value overlapping a specific one on the same body region is worth a conscious decision rather than an accident of seeding order.

---

*No exercise data was modified to produce this audit. Phase 2 has not been started.*

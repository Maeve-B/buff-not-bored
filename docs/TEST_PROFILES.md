# Test profiles — programme generator (Phase 1)

> **Owner:** Maeve. These profiles are the acceptance tests for the generator (PRODUCT_SPEC §6, Phase 1 scope: full-body only, 2–4 days a week, goals strength / hypertrophy / general fitness plus an optional emphasis).
>
> **How to use them:** turn each profile into a test fixture. Every profile must pass the **global checks** plus its own **must / must not** list. If a check here conflicts with the spec, stop and ask Maeve; don't change either one silently.

---

## Global checks (every profile)

1. **Deterministic.** The same profile always gives the identical programme.
2. **Library only.** Every exercise exists in the library, and every exercise is allowed by the profile's equipment.
3. **Hard rules (§6.4) hold in every session:**
   - compound before isolation;
   - no two exercises in a row that heavily fatigue the same muscle (unless it's a deliberate superset of *opposing* muscles);
   - each session has a lower-body pattern, a push, a pull and core;
   - avoids and limitation tags are respected.
4. **Weekly coverage.** Squat, hinge, horizontal push, vertical push, horizontal pull, vertical pull and core are all covered across the week. If the equipment makes a pattern impossible, the gap is **stated in the explanations**, never silently dropped.
5. **Spacing (§6.2).** Sessions that train the same muscles have at least 1 and at most 3 rest days between them. With 2 days a week, they're spaced evenly.
6. **Prescription matches the goal (§6.3):** sets, reps and rest per exercise, by goal, exercise class and training status. Isolation work in a strength programme is never loaded heavier than about an 8-rep max (8–12 reps).
7. **Every exercise has** a progression strategy (§6.5), a light alternative (§6.6) and its rest assigned individually.
8. **Explanations.** Every exercise choice, exclusion and gap has a plain-English reason in `explanations[]`.
9. **Session length.** The estimated duration (sets × (work + rest) + changeovers) fits the profile's session length, within +10%.

---

## Profiles

### P1 · Maeve
**Profile**
- Training status: intermediate (about a year of regular training)
- Days: 3 (Mon / Wed / Fri)
- Session length: 60 min
- Goal: **hypertrophy**, with emphasis on pull-up, glutes and core *(see open question 1)*
- Equipment: full gym (barbell, rack, dumbbells, bench, cables, machines, pull-up bar, assisted pull-up machine)
- Limitations: none
- Pull-up ladder: stage 3 (assisted)

**Must**
- Pull-up ladder work first in every session.
- A glute-focused exercise (hip thrust or bridge pattern) in at least 2 of the 3 sessions.
- Core in every session.
- Rep ranges, progressed by double progression (§6.5).
- Assisted exercises use `reduce_assistance`.
- Broadly resembles Preset Programme 1 (§10.1): same session themes, similar exercise count. It doesn't have to match exactly.

**Must not**
- Use strength-range reps (≤ 6) on every compound lift.

---

### P2 · Nervous beginner
**Profile**
- Training status: beginner (never lifted regularly)
- Days: 2
- Session length: 45 min
- Goal: general fitness
- Equipment: full gym
- Limitations: none
- Preferences: "I find the free-weights area intimidating"

**Must**
- 2 sessions, spaced evenly (for example Mon/Thu).
- 1–3 sets per exercise.
- Beginner-level exercises only.
- 4–6 exercises per session.
- The **technique** progression strategy on any lift they haven't done before.
- Machine or supported options preferred where they're equivalent. The free-weights preference is respected *and explained*.

**Must not**
- Include barbell compound lifts or advanced-level exercises.
- Prescribe more than 3 sets per exercise.

---

### P3 · Dumbbells at home
**Profile**
- Training status: intermediate
- Days: 3
- Session length: 45 min
- Goal: hypertrophy
- Equipment: **dumbbells (2–20 kg) and a bench only** (no bar, bands or cables)
- Limitations: none

**Must**
- Only dumbbell, bench and bodyweight exercises.
- 6–12 reps on compound lifts; 2–3 min rest on compound and 60–90 s on isolation.
- Double progression.
- **Vertical pull can't be covered with this equipment.** The explanations say so, and suggest the simplest fix (for example "add a doorway pull-up bar or a band").

**Must not**
- Include any barbell, cable, machine or pull-up-bar exercise.
- Quietly leave out vertical pull with no explanation.

---

### P4 · Dodgy knee
**Profile**
- Training status: intermediate
- Days: 3
- Session length: 60 min
- Goal: strength
- Equipment: full gym
- Limitations: **knee**

**Must**
- No exercises tagged `knee` in `joint_stress_tags`.
- The lower-body requirement is met with hip-dominant patterns (hinge, hip thrust, bridge).
- The explanations list what was excluded, and why.
- Light alternatives also avoid the knee tag.

**Must not**
- Include squats, lunges, split squats, step-ups or leg extensions (or any exercise tagged `knee`).
- Diagnose or comment on the injury beyond "excluded because of the knee limitation".

---

### P5 · Time-poor
**Profile**
- Training status: intermediate
- Days: 4
- Session length: **30 min**
- Goal: general fitness
- Equipment: full gym
- Limitations: none

**Must**
- Every session fits within 30 min (global check 9).
- At most 4–5 exercises per session.
- Supersets of opposing muscle groups used to save time, and faff kept low (the same station where possible).
- Each session still meets the hard rules.
- Weekly coverage is spread across the 4 days.

**Must not**
- Drop core or pulling from any session to save time.

---

### P6 · Mid-way, strength only *(the "advancing" lifter)*
**Profile**
- Training status: **intermediate, moving up** (about 1–2 years of consistent training, confident technique on the main lifts)
- Days: 3
- Session length: 60–75 min
- Goal: **strength only. Explicitly "not interested in muscle size".**
- Equipment: full gym
- Limitations: none

**Must**
- Compound lifts at **≤ 6 reps** (default 3 × 5), with **3 or more sets** (intermediate).
- **2–5 min rest** on compound lifts (default 3 min).
- The **load-nudge** progression strategy: reps fixed, and the user nudged to choose an increase (§7.4). No double progression on compound lifts.
- Built around the main barbell or heavy compound lifts (squat, deadlift or RDL, bench, overhead press, row, pull-up/pulldown), heaviest and most demanding first.
- Isolation work, if any, limited to **1–2 assistance exercises per session** at 8–12 reps. The explanations make clear it supports strength, not size.
- Heavy and light day alternation allowed (§6.2), for example 2 heavy days and 1 lighter day.

**Must not**
- Use hypertrophy rep ranges (6–12) on any compound lift.
- Programme high-volume isolation blocks, or more than 2 isolation exercises in a session.
- Use short (< 2 min) rest on compound lifts.

---

### P7 · Advanced, strength
**Profile**
- Training status: advanced (5+ years, competes or tests their maxes)
- Days: 4
- Session length: 75 min
- Goal: strength
- Equipment: full gym
- Limitations: none

**Must**
- 4 full-body sessions, spacing rules respected, with heavy and light days alternating.
- Compound lifts at ≤ 6 reps with 3 or more sets.
- Advanced exercises allowed.
- No two consecutive heavy days that load the same main lift.

**Must not**
- Generate a split routine (splits are Phase 2).

---

## Edge cases (graceful refusals)

| Input | Expected |
|---|---|
| 5 or more days a week | A clear "Up to 4 days for now. Splits are coming", with the option to generate a 4-day plan instead. No crash. |
| 1 day a week | Generates a single full-body session, and the explanation notes that 2 or more days works better |
| No equipment selected | Bodyweight-only programme, or a clear message asking what's available |
| A limitation that excludes every exercise for a required pattern | The gap is explained, with no invented exercise |
| Goal "endurance" | "Not available yet", with the nearest goal offered (general fitness) |

---

## Open questions for Maeve
1. **P1 goal.** Your preset uses 6–12 rep ranges, which is hypertrophy territory, so I've set your primary goal to hypertrophy with a pull-up and glutes emphasis. Or would you rather be "strength" with the generator allowed to use ranges? This decides how your own profile is tested.
2. **P6 isolation.** Should a strength-only lifter get *any* isolation work by default (I've allowed 1–2 per session), or none unless they ask?

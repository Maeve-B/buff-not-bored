# Buff, Not Bored — Product Specification v2

> **Status:** Replaces `PRODUCT_SPEC.md` v1. This document describes the **end-state vision** and works backwards to a phased build plan. Not everything here is to be built now — see §12 for what is in scope for each phase.
>
> **Sources:** Programming rules are derived from *NSCA Essentials of Strength Training and Conditioning* (5th ed.), mainly ch. 18 (Program Design for Resistance Training), with supporting material from chs. 16, 17, 22 and 24. Motivation rules are derived from Reel, *Working Out: The Psychology of Sport and Exercise*. Both are summarised here as rules; neither book should be quoted in the app's content. Where a rule is general coaching practice rather than from either book, it is marked **[practice]**.

---

## 0. Answers to the five questions

**1. Priority order among the "Future" work (v1 §11–15)**
Follow the phased plan in §12. Of the v1 items, the order is:
1. **Progression**, rebuilt as a *nudge* (§7.4). Wire it into the session start.
2. **Light-day and swap logic.** This uses the existing equipment and refresh engines in a narrow form: swap one exercise while preserving its stimulus.
3. **Boredom refresh** (full "I'm bored"), after the library is expanded.
4. **Equipment and gym-faff optimisation**, as a tiebreaker inside programming rules (§6.4).
5. **Preference learning.** Explicit favourite and avoid first; inferred preferences later.
6. **AI natural-language layer**, last.

**2. Capabilities not in v1.** Onboarding (with the Minimum Viable Action Workout), the programming engine and preset programmes, quick workouts, history, progress tracking, audio walk-through, the motivation layer, light days, recovery check-ins and skill ladders (pull-up). Exercise Capability and weight tracking (already built) slot into skill ladders and progress tracking respectively. "Weight tracking" here means **load lifted** per exercise, not body weight.

**3. Principle changes.** See §3. In summary:
- The product is now **programme-first and motivation-first**. Boredom and gym faff remain core principles but are features, not the whole product.
- Progression for strength work is **nudge-only**: the user chooses the increment. Percentage progression applies only to circuits.
- The AI **interprets** intent; a deterministic engine generates and validates.

**4. Horizon.** Ongoing personal tool with a defined MVP (Phase 1). Single user for now, but **onboarding and programming are designed as if for any user**, so the product can open up later without a rewrite (§2).

**5. Non-goals.** See §13.

---

## 1. Vision

**Buff, Not Bored is a programme creation and motivation app.** It gets a person onto a strength programme that suits them, makes following it effortless, and keeps them going by showing them *that* they are progressing and *why* what they are doing works.

### End-state scenarios

- **New to lifting.** I open the app and it doesn't hand me a 12-week plan. It suggests a *Minimum Viable Action Workout*: three exercises, twice or three times a week. I log the weight I used and the app tells me that's my starting line. A few weeks later it suggests I'm ready for a proper programme.
- **Experienced.** I tell it my goal, how many days I can train, my equipment and my dodgy knee. It builds a programme with a schedule, a progression strategy, a clear goal and recovery rules, and explains its choices.
- **At the gym.** Today's session is ready. I tap start and audio talks me through it, so my phone stays in my pocket. Logging a set is one or two taps.
- **Ready to progress.** At session start: "You've beaten your target on Goblet Squat twice in a row. Want to go up? +1 kg / +2 kg / +2.5 kg / Not yet." I choose.
- **Tired.** The pre-session check-in says I slept badly. The app offers a light day: same pattern, less fatiguing exercises.
- **Bored.** One tap swaps in fresh but equivalent exercises. **Bench taken?** One tap swaps that exercise for one that keeps the stimulus and doesn't send me across the gym.
- **Months in.** I can see my lifts rising, I've climbed the pull-up ladder from dead hang to my first rep, and the home screen reminds me why consistency beats intensity.

---

## 2. Users and horizon

- **Now:** a single user (Maeve). There are no accounts or multi-user infrastructure.
- **Design stance:** onboarding, programming and motivation content are designed for *any* user (beginner or experienced). Maeve's own programme becomes **Preset Programme 1** rather than hard-coded seed data.
- **Data rule:** keep user-specific state (logs, preferences, capabilities, weights, programmes) separate from shared content (the exercise library, presets and motivation content). This makes multi-user a deferred decision rather than a rewrite.

---

## 3. Product principles

### 3.1 Training objectives come first *(kept from v1)*
Substitutions, refreshes, light days and faff optimisation must preserve the training stimulus: movement pattern, primary muscles and goal-appropriate loading. Never substitute something just because it is easier.

### 3.2 Every session moves towards a goal *(new)*
Every programme has a defined goal (strength, hypertrophy, endurance, general fitness or a stated emphasis). Skills the user can't yet do, such as a pull-up, are first-class goals with staged ladders.

### 3.3 The user owns load decisions *(replaces v1 §4.5)*
For strength work, the app **detects readiness and nudges**. The user chooses the increment from sensible options or enters their own. The app never silently changes a prescribed load. Percentage-based progression is used only in circuit mode.

### 3.4 Balanced by default *(new)*
Programmes cover push *and* pull, upper and lower body, and core. Pulling (horizontal and vertical) is mandatory in any full-body programme.

### 3.5 Minimise gym faff *(kept)*
Prefer fewer station, equipment and weight changes. This is a **tiebreaker** applied *within* the programming rules (§6.4), never a reason to break them.

### 3.6 Boredom is an optimisation variable *(kept, scope clarified)*
Variety is a feature, delivered through refresh and swap. It matters most for people who have been training consistently, because they are the most vulnerable to boredom (§8.1). It is not the product's whole identity.

### 3.7 Learn preferences *(kept)*
Explicit preferences (favourite and avoid) always override inferred ones.

### 3.8 Motivate through competence and choice, not pressure *(new)*
Motivation comes from seeing progress against yourself, having real choices and understanding why. No shaming, no social comparison, no punishing streaks. Rest is part of training (§8).

### 3.9 Low friction in the gym *(kept from v1 §10)*
No typing mid-workout. One or two taps per set. Audio-first in the end state.

---

## 4. Architecture rules

### 4.1 AI interprets; the engine decides
- The AI's job is conversation: gather needs, explain, and translate natural language into **structured inputs** (for example `{goal, days, equipment, limitations}`) or **proposed changes**.
- The **deterministic programming engine** (`packages/domain`) generates programmes, validates them against the rules in §6, and applies changes.
- The AI **never** writes directly to programmes, logs, the library or progression state. Every AI-proposed change goes through the engine's validation, and the user confirms it.
- The engine must be able to **explain** each choice (for example "Excluded Bulgarian split squat: knee limitation").

### 4.2 Logic lives in the domain package
All programme, progression, swap, refresh, faff-scoring and motivation-selection logic lives in `packages/domain`, with unit tests. UI components stay thin, so that a future native app is a reskin.

### 4.3 Platform
- **Now:** web app, installable on a phone (PWA).
- **Later:** native mobile (for example Expo or React Native, reusing `packages/domain`). The likely trigger is audio walk-through: if lock-screen and background audio aren't reliable as a PWA (iOS especially), that is the point to go native.

---

## 5. Feature catalogue (end state)

Each feature lists its **end state** and its **MVP slice**. Phase assignments are in §12.

### 5.1 Onboarding
**End state**
- Asks about experience first (for example: "Have you strength-trained regularly in the last 6 months?").
- **Beginner path → Minimum Viable Action Workout (MVA).** The app suggests 2–4 easy-to-learn exercises covering a lower-body pattern, a push, a pull and optionally core, at 1–2 sets each, 2–3 times a week. The user picks from a short list and logs the weight they used. **This becomes their starting point**, and the app tells them so. After **6 completed MVA sessions**, the app offers to move them onto a programme. The user can decline and stay on the MVA, or skip straight to a programme at any time.
- **Experienced path → needs analysis** (§6.1), via the form or AI chat (§5.14) → programme creation, or "pick a preset".
- **Skip** is always available. The user lands on the home screen and can resume onboarding later from settings or a home-screen prompt.

**MVP slice:** beginner path to the MVA with a starting weight; experienced path to a needs analysis (form or AI chat) that saves a needs profile and recommends a preset; skip and resume.

**Why (motivation link):** this matches the "preparation" stage of behaviour change (testing the waters), and early easy wins build self-efficacy (§8.1).

### 5.2 Home screen
**End state:** always leads with a **motivational message** chosen by rule from the motivation content library (§8.3) based on the user's state. It also shows today's session (or "rest day — rest is training"), quick-start buttons and a progress highlight.

**MVP slice:** motivational message (rule-selected from seed content), today's session and quick start.

### 5.3 Exercise library
**End state:** a structured library big enough for programming, swaps, light days and refresh to be meaningful: at least 6–8 options per movement pattern across equipment types. The data model is in §9.

**MVP slice:** rebuild the library to the §9 model; add pulling (horizontal and vertical), glute-focused and anti-movement core work; add light alternatives; fix rep defaults (§6.3). The starter list is in §10.2.

### 5.4 Programming
**End state:** two routes to a programme.
1. **Preset programmes**, selectable in the app. The first is Preset Programme 1 (§10.1).
2. **Created programmes**, built by the engine from a needs analysis (§6.1). The needs analysis is collected through an in-app form *or* AI chat; both produce the same structured input.

Every programme, preset or created, has:
1. **A planned schedule**, such as full body Monday, Wednesday and Friday, with a consistent set of exercises.
2. **A progression strategy**: what progresses (reps, load or technique/ladder stage) and when (§6.5).
3. **A defined goal** that sets exercise selection, volume, intensity and rest (§6.3).
4. **Recovery and adjustment**: check-ins, light days, deloads and pain handling (§6.6).
5. **A light-day option.** Any session can be switched to a light day (§6.6).

**MVP slice:** Preset Programme 1 with schedule, progression nudge and light day, plus a **scoped programme generator** (full body, 2–4 days a week, with a review step; §12 Phase 1, item 12). The full engine (splits, endurance, check-ins, deloads, pain handling) comes in Phase 2.

### 5.5 Quick workouts (standalone)
**End state:** one-off sessions outside a programme, either preset or generated:
- **Circuit** (already built). Minimal rest; percentage-based progression is allowed here.
- **Full body**, with swap per exercise.
- Later: generated from constraints ("30 minutes, dumbbells only").

Quick workouts log to history like any other session.

**MVP slice:** circuit (existing) plus full body with swap.

### 5.6 Session logging
- Explicit **Start workout** and **End workout**. A session counts in history only once it has been started and ended (or auto-closed after inactivity, with a prompt).
- For each set: actual weight and actual reps (pre-filled with the prescription, so a tap confirms it), plus one-tap feedback (§7.3).
- Swap, skip and "light day" are available mid-session.

### 5.7 Progression nudge
See §7.4. **MVP.**

### 5.8 History — UX on hold, data still captured
> **UX on hold (Maeve, 2026-10-21):** the History screen is parked while its UX is rethought; it may overlap with Progress (§5.9). Data capture is unaffected: logging still records sessions, programmes, and exercises done, skipped and swapped. See §14, decision 7.

- Session count (per week, per month and all time) against the plan.
- Programmes done, with start and end dates.
- Exercises done and not done, skipped and swapped.
- **Purpose:** gives the user a record of accomplishment and feeds preference learning and a realistic picture of ability (with Exercise Capability).

**MVP slice:** session count, programmes done, exercises done and not done.

### 5.9 Progress tracking
- Per exercise: weight × reps over time, best set and personal-best markers.
- Skill ladders: current stage and stages reached, with dates.
- Session volume-load (sets × reps × load), optional and secondary.
- For assisted exercises, progress is **less assistance over time** (§9.1).
- Motivation overlay: short "why tracking matters" explainers (§8.3).
- **No body-weight or body-composition tracking** (§8.2, §13). Progress means what you can lift and do.

**MVP slice:** per-exercise load-over-time chart (built on the existing weight tracking) with PB markers.

### 5.10 Audio walk-through
**End state:** a hands-free, audio-guided session that announces the exercise, gives a setup cue and 1–2 form cues, counts sets, runs the rest timer ("30 seconds left") and moves to the next exercise. Logging is by confirmation (one tap, a headphone button or, later, voice).

**MVP:** not included. Phase 3. Build as a PWA first and test lock-screen behaviour (§4.3).

### 5.11 Boredom refresh
v1 §12 behaviour, adapted: refresh replaces **one exercise per session slot** (slots are defined by the programme; see §9.2) with an alternative that matches the slot's movement pattern, goal and equipment, respects avoids, avoids recent repeats and minimises faff. **Phase 3.**

### 5.12 Equipment / gym-faff optimisation
v1 §13 behaviour, applied as a tiebreaker (§6.4) and as the "equipment taken → swap" action. **The swap action is MVP; full optimisation is Phase 3.**

### 5.13 Preference learning
v1 §14 behaviour. Explicit favourite and avoid in Phase 2; inferred preferences in Phase 4.

### 5.14 AI chat
**End state:** an in-app coach that can:
- run the needs analysis conversationally and hand structured input to the engine;
- propose modifications ("avoid the bench today", "I'm bored", "make Wednesday shorter") as structured requests;
- explain the *why* behind the programme, progression and motivation, using the rule explanations and motivation content.

It follows §4.1 strictly.

**Phasing:**
- **Phase 1:** needs-analysis chat. It produces the same structured needs profile as the form (§6.1), which the user confirms, saves and can edit. In Phase 1 the profile is used to recommend a preset, personalise onboarding and feed the scoped programme generator (§12 Phase 1, item 12). The full Phase 2 generator consumes the same saved profile, so nothing has to be collected twice.
- **Phase 4:** modifications and "explain why".

---

## 6. Programming rules (engine specification)

*Derived from NSCA ch. 18 unless marked. These are starting parameters; keep them as configurable data, not hard-coded constants.*

### 6.1 Needs analysis (programme inputs)
| Input | Values |
|---|---|
| Goal | strength · hypertrophy · muscular endurance · general fitness; optional **emphasis** (for example glutes, core, pull-up) |
| Training status | beginner · intermediate · advanced, derived from how long they have trained regularly, what kind of training, and their technique experience |
| Available days per week | 1–7, plus preferred days |
| Session length | minutes |
| Equipment | from an equipment list (barbell, rack, dumbbells (range), bench, cable, machines, pull-up bar, bands, bodyweight only, …) |
| Limitations | joint or region tags (knee, lower back, shoulder, wrist, …) plus free text |
| Preferences | favourite and avoid exercises; likes or dislikes (for example "no burpees") |

**One primary goal per training block.** A combination ("strength + glutes") is handled as a primary goal plus an emphasis, not two equal goals.

### 6.2 Frequency and scheduling
| Training status | Sessions per week |
|---|---|
| Beginner | 2–3 |
| Intermediate | 3–4 |
| Advanced | 4+ |

- Leave **at least 1 and no more than 3 rest days** between sessions that stress the same muscle groups.
- With 2 full-body sessions a week, space them evenly (for example Monday and Thursday, not Monday and Wednesday).
- Splits (upper/lower and so on) are only used when days per week ≥ 4.
- Heavy and light days can alternate to allow more frequent training (this is the basis for the light-day feature).

### 6.3 Load, reps, sets and rest by goal
**Exercise classes** (NSCA's "core vs assistance"; called **compound vs isolation** in the app, to avoid confusion with "core" meaning abs):
- **Compound:** large muscle areas, two or more primary joints (squat, hinge, press, row, pull-up).
- **Isolation:** smaller muscle areas, one primary joint (curls, raises, extensions, calf raises).

| Goal | Reps per set (compound) | Sets (beginner / intermediate+) | Rest |
|---|---|---|---|
| Strength | ≤ 6 (**default 5**) | 1–3 / 3+ | 2–5 min (default 3 min) |
| Hypertrophy | 6–12 (default 10) | 1–3 / 3+ | 2–3 min compound; 60–90 s isolation |
| Muscular endurance | 12–20 (default 15) | 1–3 / 3+ | ≤ 30 s |
| Circuit | per circuit design | rounds | 20–30 s between stations |

- **Isolation work in a strength programme** should not be loaded heavier than about an 8-rep max. **Default isolation exercises to 8–12 reps** even when the programme goal is strength.
- Rest is assigned **per exercise** (based on load and muscle mass), not uniformly per programme.
- Prescription is expressed as **sets × reps** (for example 3 × 5) with an optional effort target (reps in reserve, §7.3).
- Bodyweight and duration-based exercises (planks, hangs) use sets × seconds.

### 6.4 Session construction and exercise order
**Hard rules (must hold)**
1. More demanding compound exercises come first; isolation work comes after.
2. Don't place two exercises in a row that heavily fatigue the same muscle (for example a row then a pull-up both hit the biceps), unless the session deliberately pre-fatigues.
3. Every full-body session includes at least: a lower-body knee-dominant *or* hip-dominant pattern, a push, a pull, and core. Over the week, cover squat, hinge, horizontal push, vertical push, horizontal pull, vertical pull and core.
4. Respect avoids and limitation tags.

**Soft rules (prefer)**
- Alternate upper and lower, or push and pull, to manage fatigue (good for beginners).
- Lower-body compound before upper-body compound when they are not alternated.
- **Supersets** of opposing muscle groups (for example a push paired with a pull) are allowed. They save time and often share a station, so they help with faff too.

**Faff scoring (tiebreaker only).** Among orderings and selections that satisfy the hard rules and are equivalent on the soft rules, choose the lowest faff score (station changes, equipment changes, weight changes, setup time; v1 §13). Faff can **never** override a hard rule.

### 6.5 Progression strategies
Each programme declares one strategy per exercise class:
| Strategy | Use | How it works |
|---|---|---|
| **Load nudge** (default for strength) | compound and isolation lifts | Reps stay fixed; when the trigger fires, the app nudges and the user picks the increment (§7.4) |
| **Double progression** | hypertrophy and isolation | Work within a rep range (for example 8–12); once the top of the range is reached on all sets, nudge for a load increase and drop back to the bottom of the range |
| **Ladder** | skills (pull-up, push-up) and bodyweight | Advance a stage when the stage criteria are met; the user confirms (§10.3) **[practice]** |
| **Percentage** | circuits only | Auto-adjust load or time by a set % per block |
| **Technique** | new or poorly-performed lifts | No load change until the user marks the movement as "felt solid" |

### 6.6 Recovery and adjustment
- **Pre-session check-in** (optional, one tap each): sleep, energy, soreness, and any pain (yes/no, with a region). Poor scores lead the app to *offer* a light day.
- **Light day:** each exercise switches to its `light_alternative` (a less fatiguing variant: machine-supported, lighter-loaded, bodyweight or isolation within the same pattern). Alternatively, the same exercises are kept with one fewer set. **Light-day sessions never trigger progression nudges.**
- **Deload:** after about 4–6 weeks of progression, the app *offers* a lighter week with reduced volume (fewer sets) at similar loads. The user opts in. Performance often improves after a deload, because accumulated fatigue lifts.
- **Pain handling:** when an exercise is flagged as painful, swap it immediately to an alternative that avoids that region, and tag the exercise for review. If the user reports pain repeatedly, suggest seeing a professional. The app never diagnoses.
- **Repeated failure:** if an exercise is "Failed" or "Too hard" in 2 consecutive sessions, suggest hold, reduce or swap, and the user chooses.
- **Watch for overreaching:** falling performance across several exercises *plus* poor check-ins leads the app to suggest a deload or extra rest day.

---

## 7. Logging, feedback and progression nudge

### 7.1 Set log fields
`prescribed_weight, actual_weight, prescribed_reps, actual_reps (or seconds), completed, feedback, is_light_day, swapped_from_exercise_id`

### 7.2 One-tap defaults
Pre-fill actuals with the prescription. Tapping a set confirms it as done, and only deviations need input (via a +/- stepper, no keyboard).

### 7.3 Feedback scale (mapped to reps in reserve)
The reps-in-reserve scale comes from the NSCA book (Table 18.10). The five labels are our plain-English mapping onto it.
| Label | Meaning |
|---|---|
| Easy | could have done 4+ more reps |
| Good | 2–3 more |
| Hard | 1 more |
| Too hard | 0 — barely made it |
| Failed | couldn't complete the prescription |

### 7.4 Progression nudge (MVP)
**Trigger (adapted from NSCA's "2-for-2" rule).** For a given exercise, in **two consecutive non-light sessions**, either:
- on the final set the user did **≥ 2 reps over target**, *or*
- they hit the target on all sets with feedback **Easy** (or **Good** on all sets for isolation lifts).

**Nudge**, shown at **session start** for that exercise:
> "You've beaten your target on *Goblet Squat* two sessions running. Ready to go up?"
> `[+ small] [+ medium] [+ large] [Custom…] [Not yet]`

- The increment chips come from the exercise's `increment_options`, which reflect real available jumps. Typical guidance for less-trained lifters is +1–2 kg upper body and +2–4 kg lower body (more for stronger lifters). These are **options, not prescriptions**.
- "Not yet" snoozes the nudge for that exercise until the trigger fires again.
- Don't fire the nudge if the user flagged pain on that exercise recently, or if technique strategy is active.
- The chosen weight becomes the new prescription. Log the decision (for progress views and learning).

---

## 8. Motivation framework

*Derived from Reel, Working Out. The themes below are the basis of all motivational content, home-screen messages, overlays and AI-chat tone.*

### 8.1 Core themes
| # | Theme | The idea | Where it shows up |
|---|---|---|---|
| M1 | **Competence and mastery** | Intrinsic motivation grows when you feel capable. The strongest source of confidence is your own recent, repeated success. | Progress tracking, PB moments, ladder stages, a "your wins" record |
| M2 | **Autonomy and choice** | People stick with what they have a say in. | User picks increments, swaps, presets, light days; the app explains rather than dictates |
| M3 | **Goal staircase** | Specific, measurable, realistic, time-bound goals; short-term steps leading to a long-term goal; process goals ("brace before each rep") over outcome goals. | Onboarding goal-setting, skill ladders, session focus cue |
| M4 | **Start where you are (stage of change)** | Beginners are "testing the waters" and need small, achievable actions that build self-efficacy. People who've trained consistently for months are the most at risk of boredom. | MVA onboarding; boredom refresh aimed at established users |
| M5 | **Beat the barriers** | The top barriers are lack of time, lack of energy or fatigue, and life stress. | Quick workouts, light days, "something beats nothing" messaging, shorter-session options |
| M6 | **Compare to yourself only** | Focus on personal improvement, not comparison with others. | Progress views show you vs past you; no leaderboards |
| M7 | **Helpful self-talk** | Optimistic, present-focused, about what's controllable; setbacks are fixable and successes repeatable. | Tone for all copy, especially after missed sessions or failed sets |
| M8 | **Immediate feedback** | Recognition straight after the effort motivates most. | End-of-set and end-of-session acknowledgements, PB call-outs |
| M9 | **Enjoyment** | People keep doing exercise they enjoy. | Preference learning, variety, avoids honoured |

### 8.2 Guardrails
- **Physique anxiety.** Body evaluation (weigh-ins, body composition) can raise anxiety and reduce motivation. The app has **no body-weight tracking**, and messages never frame progress around appearance or body size. Progress is always about performance.
- **No pressure mechanics.** No streak-loss shaming or guilt copy. Rest days are framed positively. Missed sessions get "pick up where you left off", never a reset.
- **Overtraining and burnout.** Never encourage training through pain or skipping rest. Motivation copy must not push extra sessions beyond the plan.

### 8.3 Content system
- A **motivation content library**: short messages, each tagged with `theme (M1–M9)`, `user_state` and `surface`.
- **User states:** `new_user`, `mva_in_progress`, `on_plan`, `missed_sessions`, `returning_after_gap`, `just_hit_pb`, `ladder_stage_up`, `plateau`, `low_checkin`, `long_term_consistent`.
- **Surfaces:** home screen, onboarding (the *why* of MVA), progress tracking (the *why* of tracking), history, session end, light-day prompt.
- **Selection is deterministic:** match state and surface, avoid recently shown messages, and rotate themes.
- Later, the AI may *rephrase* selected content in a personal voice, but only from approved themes and never adding new claims.
- **Seed content** (around 5 per state) is written for Phase 1 in plain, warm, British English. It must be original wording, not quotes from the book.

---

## 9. Data model changes

### 9.1 Exercise (library entry)
Keep the v1 fields, plus:
| Field | Notes |
|---|---|
| `movement_pattern` | one of: squat · hinge · lunge/unilateral · hip extension (bridge/thrust) · horizontal push · vertical push · horizontal pull · vertical pull · elbow flexion · elbow extension · shoulder raise · calf · anti-extension · anti-rotation · lateral flexion/anti-lateral · rotation · carry |
| `exercise_class` | compound · isolation |
| `skill_level` | beginner · intermediate · advanced |
| `load_type` | barbell · dumbbell_pair · dumbbell_single · kettlebell · cable · machine · bodyweight · band · assisted_machine |
| `equipment[]`, `station` | station is where it's done (rack, bench, cable stack, floor, pull-up bar, machine X) |
| `unilateral`, `per_side` | boolean |
| `default_prescription` | per goal: sets, reps or seconds, rest |
| `increment_options[]` | real available jumps (for example dumbbells [1, 2, 2.5] kg; barbell [2.5, 5] kg) |
| `load_direction` | `add_load` (normal) or `reduce_assistance` (assisted pull-up, assisted dead hang). With `reduce_assistance`, the logged value is assistance in kg, a **lower number is progress**, the nudge reads "Ready to drop assistance?", and progress charts invert accordingly |
| `progression_strategy_default` | §6.5 |
| `light_alternative_ids[]` | §6.6 |
| `swap_group` | equivalent-stimulus alternatives |
| `regression_id`, `progression_id` | ladder neighbours |
| `joint_stress_tags[]` | knee · lower_back · shoulder · wrist · elbow · hip; used for limitation filtering |
| `cues` | setup and 1–2 form cues, in our own words, for audio and the UI |
| `progression_percentage` | **circuits only** |

`starting_weight` moves out of the library into **user exercise state** (per user: current prescription, history, preference, capability).

### 9.2 Programme groups become session slots
The v1 seven programme groups were a property of one programme. In v2, **a programme defines its own slots** (for example "Lower — squat pattern", "Pull — vertical"). Each slot has a pattern and goal and holds one exercise. Refresh and swap operate per slot. Muscle coverage is always computed from the exercises' actual muscles (the v1 §3 rule stands).

### 9.3 Programme
`id, name, goal, emphasis[], training_status_target, schedule (days, sessions), sessions[] → slots[] → {exercise_id, sets, reps|seconds, rest, superset_group?}, progression_strategy per class, deload_rule, light_day_rule, source (preset|generated), generation_inputs (if generated), explanations[]`

### 9.4 Session log
`id, programme_id?, session_template_id?, type (programme|quick|circuit|mva), started_at, ended_at, is_light_day, checkin{sleep, energy, soreness, pain_regions[]}, sets[]`

---

## 10. Content to build

### 10.1 Preset Programme 1 — Full Body 3× + Pull-Up *(Maeve's current programme; seed exactly)*
- **Goal:** strength and muscle. **Emphasis:** pull-up, glutes, core.
- **Schedule:** 3 fixed sessions a week: Monday (squat and push), Wednesday (deadlift and shoulders), Friday (glutes and legs).
- **Progression:** the prescriptions are **rep ranges**, so this preset uses **double progression** (§6.5). Work up to the top of the range on all sets; the trigger then fires and the user is nudged to add load (or drop assistance) and returns to the bottom of the range. The pull-up and dead hang also advance on the ladder (§10.3).
- **Pull-up work comes first** in every session, while fresh, because it is the priority skill.
- **Light day:** available on every session.
- **Blank weights (`____`):** the user enters these at first use. They are saved as the starting point, not guessed.

**Monday · Squat and push**
| # | Exercise | Muscles | Prescription | Starting load |
|---|---|---|---|---|
| 1 | Assisted pull-up | lats, upper back, biceps, grip | 3 × 4–8 | assistance: ____ |
| 2 | Assisted dead hang | grip, shoulders, lats | 3 × 20–30 s | assistance: ____ |
| 3 | Back squat | quads, glutes | 3 × 6–10 | 40 kg |
| 4 | DB bench press | chest, shoulders, triceps | 3 × 8–12 | 10 kg per DB |
| 5a | Seated cable row | upper back, lats, biceps | 3 × 8–12 | 19 kg |
| 5b | Lateral raise *(superset with 5a)* | side delts | 2 × 12–20 | 4 kg per DB |
| 6 | Captain's chair knee raise | abs, hip flexors | 2 × 8–12 | bodyweight |

**Wednesday · Deadlift and shoulders**
| # | Exercise | Muscles | Prescription | Starting load |
|---|---|---|---|---|
| 1 | Assisted pull-up | lats, upper back, biceps, grip | 3 × 4–8 | assistance: ____ |
| 2 | Assisted dead hang | grip, shoulders, lats | 3 × 20–30 s | assistance: ____ |
| 3 | Conventional deadlift | glutes, hamstrings, quads, back extensors | 3 × 5–8 | 60 kg |
| 4 | Overhead press | shoulders, triceps | 3 × 6–10 | 20 kg |
| 5 | Lat pulldown | lats, upper back, biceps | 3 × 8–12 | 29 kg |
| 6 | Leg curl | hamstrings | 3 × 10–15 | ____ |
| 7 | Cable woodchop | obliques, abs | 2 × 10 per side | ____ |

**Friday · Glutes and legs**
| # | Exercise | Muscles | Prescription | Starting load |
|---|---|---|---|---|
| 1 | Assisted pull-up | lats, upper back, biceps, grip | 3 × 4–8 | assistance: ____ |
| 2 | Assisted dead hang | grip, shoulders, lats | 3 × 20–30 s | assistance: ____ |
| 3 | Hip thrust machine | glutes, hamstrings | 3 × 8–15 | ____ |
| 4 | Leg press | quads, glutes | 3 × 10–15 | ____ |
| 5 | Incline DB press | upper chest, shoulders, triceps | 3 × 8–12 | 8 kg per DB |
| 6a | Chest-supported DB row | upper back, lats, rear delts, biceps | 2 × 8–12 | 8–10 kg per DB |
| 6b | Lateral raise *(superset with 6a)* | side delts | 2 × 12–20 | ____ |
| 7 | Farmer carry | core, obliques, grip, forearms | 3 × 30–45 s | ____ |

**Notes for the engine**
- Supersets are modelled with `superset_group`.
- Farmer carry and dead hang are time-based (sets × seconds).
- Assisted exercises use `load_direction: reduce_assistance` (§9.1).
- Every exercise above must exist in the library with a `light_alternative` and a `swap_group`.

### 10.2 Starter library (minimum for MVP)
Existing v1 exercises are kept, re-tagged to §9.1, with rep defaults corrected. Add the following:
- **Vertical pull:** dead hang, scapular pull-up, lat pulldown, assisted pull-up (band and machine), negative pull-up, pull-up, chin-up
- **Horizontal pull:** one-arm DB row, chest-supported DB row, seated cable row, bent-over barbell row, inverted row, face pull
- **Hinge and glutes:** Romanian deadlift (barbell and DB), hip thrust, glute bridge (with single-leg variation), good morning, cable kickback, back extension
- **Squat and lunge:** goblet squat, front squat, reverse lunge, forward lunge, step-up, leg press, split squat
- **Push:** barbell bench press, incline DB press, DB fly, machine chest press, push-up progressions (incline → floor), seated DB shoulder press, machine shoulder press
- **Core:** dead bug, bird dog, side plank, Pallof press, hanging knee raise, ab crunch
- **Light alternatives:** machine and supported variants for each pattern (leg press for squat, chest-supported row for bent-over row, glute bridge for hip thrust, …)

### 10.3 Pull-up ladder **[practice]**
| Stage | Exercise | Advance when (user confirms) |
|---|---|---|
| 1 | Dead hang | 3 × 30 s |
| 2 | Scapular pull-ups | 3 × 8 controlled |
| 3 | Assisted pull-up (band or machine) | 3 × 5–8 at decreasing assistance |
| 4 | Negative pull-up (3–5 s lowering) | 3 × 5 with control |
| 5 | First pull-up | 1 clean rep |
| 6 | Pull-up sets | 3 × 3, then build |

Lat pulldown and rows run alongside every stage as supporting work. Ladder status is stored using the existing **Exercise Capability** feature. A stage-up is a celebrated moment (M1, M8).

Within stage 3, progress is **reducing assistance**. Maeve is currently at stage 3, doing assisted pull-ups and assisted dead hangs.

---

## 11. What exists today (for orientation)
- Exercise database (v1 shape), workout logging, circuit mode.
- **Exercise Capability** and **weight tracking** (load lifted per exercise), built after v1 and now mapped to §10.3 and §5.9. If any body-weight tracking exists, remove it (§13).
- Domain engines in `packages/domain` for refresh, progression and equipment optimisation, not wired into the UI. These should be **refactored to the v2 rules** (nudge-only progression; faff as a tiebreaker; slot-based refresh) rather than wired up as-is.

---

## 12. Phased plan (working backwards from the vision)

### Phase 0 — Clean-up
- Migrate the library to the §9.1 model; move per-user state out of the library.
- Correct the rep and set defaults (§6.3).
- Refactor the progression engine to the nudge model (§7.4); remove percentage progression except for circuits.

### Phase 1 — MVP: "follow a good programme and see yourself progress"
1. Expanded library (§10.2), including pulling, glutes, core and light alternatives.
2. Preset Programme 1 (§10.1), seeded exactly, with supersets and assisted exercises.
3. Session start/end and fast logging with the RIR feedback scale (§7).
4. Progression nudge at session start (§7.4).
5. Light day and the "equipment taken → swap" action.
6. Pull-up ladder using Exercise Capability (§10.3).
7. Quick workouts: circuit (existing) and full body with swap.
8. History (§5.8 MVP slice) and progress tracking (§5.9 MVP slice).
9. Onboarding: MVA beginner path, experienced → preset, and skip (§5.1).
10. Home-screen motivation with seed content and deterministic selection (§8.3).
11. AI chat for the needs analysis (§5.14 Phase 1): it produces a confirmed, saved needs profile and recommends a preset.
12. **Scoped programme generator** (§6), built after items 2 and 3 so Maeve can train on the app meanwhile:
    - **Input:** the needs profile (§6.1) from the AI chat or the form. The AI only collects and structures the profile; the deterministic engine generates the programme (§4.1 unchanged).
    - **Programme types:** full body only, 2–4 days a week.
    - **Goals:** strength, hypertrophy or general fitness, plus an optional emphasis (for example glutes, core, pull-up).
    - **Rules applied:** frequency and spacing (§6.2); sets, reps and rest by goal and exercise class (§6.3); all hard and soft rules in §6.4; a progression strategy per exercise (§6.5); a light alternative for every exercise (§6.6).
    - **Limitations:** exclude exercises by `joint_stress_tags`, and respect avoids.
    - **Exercises:** chosen from the existing library only. Never invented.
    - **Explanations:** every choice recorded in `explanations[]` in plain language (§9.3).
    - **Review step (design-first screen):** Maeve sees the generated programme with its explanations and can accept it, regenerate it, or swap per slot (reusing the swap logic) before it becomes her active programme.
    - **Testing (required):** the same profile always produces the same programme; every generated programme passes every §6.4 hard rule across a spread of profiles (for example 2 or 4 days, dumbbells only, knee limitation, beginner and advanced); Maeve's own profile produces a sensible programme comparable to Preset Programme 1.

**MVP is done when** Maeve can (a) generate a programme from her needs profile, with explanations she agrees with, and (b) use the app for a 6-week block with no workarounds.

### Phase 2 — Programme creation
- The generator extended beyond the Phase 1 scope: splits (4+ days), the muscular endurance goal.
- Experienced-user onboarding goes through programme creation.
- Pre-session check-in, deload offers, pain handling (§6.6).
- Favourite and avoid management screens.
- The generator keeps consuming the needs profile already saved in Phase 1.

### Phase 3 — Engagement
- Audio walk-through (PWA first; decide on native here).
- Full boredom refresh (§5.11) and full faff optimisation.
- Motivation overlays on progress, history and session end; expanded content library.

### Phase 4 — Intelligence
- AI chat for modifications and "explain why".
- Inferred preference learning.
- Constraint-generated quick workouts.

---

## 13. Non-goals
**Ruled out (not planned)**
- AI generating or validating programmes directly, or changing loads without user confirmation
- Social features: leaderboards, sharing, comparison with others
- Streak-shaming or guilt mechanics
- Appearance or body-composition goals as a motivational frame
- Body-weight, weigh-in or body-composition tracking
- Diagnosing pain or injury
- Nutrition and calorie tracking
- Cardio and conditioning programming
- Olympic lifts and power/plyometric programming

**Deferred (designed for, not built)**
- Multi-user accounts
- Native mobile app
- Wearable integrations

---

## 14. Decisions log
1. **Rep defaults:** 5 reps for compound lifts in strength programmes, 8–12 for isolation work. ✅ Confirmed.
2. **Preset Programme 1:** Maeve's current Monday/Wednesday/Friday programme, seeded exactly (§10.1), using rep-range double progression. ✅
3. **MVA graduation:** offered after 6 sessions; the user can always skip. ✅
4. **Feedback labels:** Easy / Good / Hard / Too hard / Failed, mapped onto the book's reps-in-reserve scale. ✅
5. **AI needs-analysis chat:** moved to Phase 1. ✅
6. **No body-weight tracking.** "Weight tracking" means load lifted. ✅
7. **History UX on hold:** the History screen (§5.8) is parked while Maeve rethinks its UX, which may overlap with Progress (§5.9). Session and history data are still captured exactly as specced; no History UI is built for now. ⏸ (2026-10-21)
8. **Scoped programme generator moved into Phase 1 (MVP):** programming is the most important part of the product, so it is tested early. Full body only, 2–4 days a week, strength / hypertrophy / general fitness plus an optional emphasis, from the existing library only, with plain-language explanations and a review step (accept, regenerate, or swap per slot). Built after Preset Programme 1 and logging. The MVP definition (§12) now requires generating a programme from Maeve's needs profile, with explanations she agrees with. Splits, the endurance goal, check-ins, deloads, pain handling and favourite/avoid screens stay in Phase 2. ✅ (2026-10-26)

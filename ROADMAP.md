# Roadmap

> Owned by Maeve. The agent reads it and proposes changes only by asking or in a PR. Built from `PRODUCT_SPEC.md` §12 (phased plan) and §13 (non-goals); the spec has the detail behind each line.

## Direction
Buff, Not Bored is a programme creation and motivation app: it gets a person onto a strength programme that suits them, makes following it effortless, and keeps them going by showing them that they are progressing and why (spec §1).

**MVP is done when** Maeve can use the app for a full 6-week block of Preset Programme 1 with no workarounds, and the progress view shows each lift's trend.

## Now
### R-00 · Phase 0 — Clean-up
- Migrate the library to the §9.1 model; move per-user state out of the library.
- Correct the rep and set defaults (§6.3).
- Refactor the progression engine to the nudge model (§7.4); remove percentage progression except for circuits.

### R-01 · Phase 1 — MVP: "follow a good programme and see yourself progress"
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
11. AI chat for the needs analysis (§5.14 Phase 1): a confirmed, saved needs profile that recommends a preset.

## Next
### R-02 · Phase 2 — Programme creation
- Needs-analysis form (§6.1) → deterministic programme generator (§6) with explanations.
- Experienced-user onboarding goes through programme creation.
- Pre-session check-in, deload offers, pain handling (§6.6).
- Explicit favourite and avoid.
- The generator consumes the needs profile already saved in Phase 1.

## Later
### R-03 · Phase 3 — Engagement
- Audio walk-through (PWA first; decide on native here).
- Full boredom refresh (§5.11) and full faff optimisation.
- Motivation overlays on progress, history and session end; expanded content library.

### R-04 · Phase 4 — Intelligence
- AI chat for modifications and "explain why".
- Inferred preference learning.
- Constraint-generated quick workouts.

## Not doing
**Ruled out**
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

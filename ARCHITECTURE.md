# Buff, Not Bored — Proposed Architecture

Status: **DRAFT — for review. Nothing in this document has been built yet.**

This proposal is derived from `PRODUCT_SPEC.md`. Where the spec is explicit (e.g. "the optimisation should be based on explicit scoring rather than subjective AI judgement," "the exact progression algorithm must be designed and tested separately"), this document treats that as a hard constraint on the architecture, not a suggestion.

---

## 1. Recommended Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript everywhere | One type system across UI, API, and domain logic; lets the exercise catalog's shape be shared and checked at compile time. |
| Frontend | Next.js (App Router) + React | Single deployable app, Server Actions give low-latency mutations (important for section 10's "extremely fast" logging), RSC for read-heavy screens. |
| Styling/UI | Tailwind CSS + a lightweight component set (e.g. shadcn/ui) | Fast to build large-touch-target, mobile-first screens for use mid-workout. |
| State (client) | Server Actions + minimal client state (React state / `useOptimistic`); no global store initially | The app is mostly "fetch today's session, log a set." A heavyweight client store isn't justified in V1. |
| API layer | Next.js Route Handlers / Server Actions, thin | See §6 — these are wrappers, not where logic lives. |
| Validation | Zod | Used at every boundary: HTTP input, DB output, and — critically — the AI layer's output (§8). |
| Database | PostgreSQL (Neon or Supabase free tier) | Relational fit is strong (exercises ↔ muscles ↔ programme groups ↔ sessions ↔ logs); portfolio-credible; leaves room for real multi-user auth later. SQLite+Prisma is an acceptable fallback for local-only dev. |
| ORM | Prisma | Type-safe schema, migrations, and seeding — good fit for seeding the one user's exact programme from §5/§6. |
| Domain/engine package | Plain TypeScript, framework-free | See §2 and §7 — no dependency on Next, Prisma, or React. |
| Testing | Vitest (unit, domain-heavy) + Playwright (a handful of e2e flows) | See §9. |
| Package management | pnpm workspaces (monorepo) | Enables true separation between domain logic and app code (§3), without the overhead of a second deployable service. |
| Deployment | Vercel (web) + Neon/Supabase (DB) | Free-tier friendly for a single-user portfolio app. |

**Explicitly deferred:** auth/multi-tenancy libraries, a separate backend service, a mobile app, any AI SDK. These are premature for V1 per §2 and §15 of the spec.

---

## 2. Application Architecture

Three concentric layers, dependencies point inward only:

```
┌─────────────────────────────────────────────┐
│  apps/web  (Next.js: pages, Server Actions)  │  ← UI + I/O plumbing
│    depends on ↓                              │
├─────────────────────────────────────────────┤
│  packages/db  (Prisma schema, repositories)  │  ← persistence
│    depends on ↓                              │
├─────────────────────────────────────────────┤
│  packages/domain  (the workout engine)       │  ← pure business logic
│    depends on nothing app-specific           │
└─────────────────────────────────────────────┘

  packages/ai  (future) → produces input FOR domain,
                            never bypasses it (§8)
```

The domain package is the one piece of this system with real intellectual content (progression rules, boredom substitution, equipment scoring). Everything else — Next.js, Prisma, Postgres — is replaceable plumbing. The architecture is organized to protect that asymmetry: the engine must be usable from a script, a test, an API route, or eventually a CLI, without modification.

---

## 3. Folder Structure

```
buff-not-bored/
├── PRODUCT_SPEC.md
├── ARCHITECTURE.md
├── README.md
├── package.json                # pnpm workspace root
├── pnpm-workspace.yaml
│
├── apps/
│   └── web/                    # Next.js app
│       ├── app/
│       │   ├── session/        # today's workout: view + log sets
│       │   ├── history/        # past sessions
│       │   └── api/            # route handlers, thin, delegate to domain+db
│       ├── components/         # presentational only, no business rules
│       └── lib/
│           └── actions/        # Server Actions — validate input, call domain, call db, return
│
└── packages/
    ├── domain/                 # the deterministic workout engine (§7)
    │   ├── src/
    │   │   ├── entities/       # Exercise, ProgrammeGroup, MuscleGroup, WorkoutSession, ...
    │   │   ├── engine/
    │   │   │   ├── workout-builder/     # assembles default V1 session (§9 of spec)
    │   │   │   ├── boredom/             # §12 — refresh/substitution
    │   │   │   ├── progression/         # §11 — weight recommendation
    │   │   │   └── equipment-optimiser/ # §13 — faff scoring
    │   │   └── types/
    │   └── test/                # unit + scenario tests, no DB/HTTP required
    │
    ├── db/                      # Prisma schema, migrations, seed script
    │   ├── prisma/schema.prisma
    │   ├── seed/                # loads the §5/§6 exercise library + the one user's programme
    │   └── src/repositories/    # typed query functions, return domain types (not Prisma types)
    │
    ├── shared/                  # DTOs/Zod schemas shared by web ↔ domain ↔ ai
    │
    └── ai/                      # future — natural-language intent parser (§8, §15)
        └── src/
            ├── intent-schema.ts # Zod schema for the structured constraints (e.g. RefreshConstraints)
            └── provider/        # LLM adapter behind an interface; mockable in tests
```

Rationale for a monorepo over a single Next.js app with a `lib/` folder: it makes the domain/UI boundary structurally enforced (the domain package cannot `import` from Next.js — it isn't a dependency), rather than a convention someone can quietly violate six weeks in.

---

## 4. Data Model

Modeled relationally, matching the spec's explicit distinction between **programme group** (organisational) and **muscle group** (physiological) — these are never the same column.

```
User            (id, name)                          — single row in V1, per §2

Exercise        (id, name, programme_group, exercise_type,
                 movement_patterns[], equipment, location,
                 starting_weight, weight_unit,
                 prescribed_reps, reps_unit, prescribed_duration,
                 progression_percentage, active, notes)

ExerciseMuscle  (exercise_id, muscle, role)          — role: primary | secondary
                                                         (this is what makes muscle coverage
                                                          independent of programme_group)

Preference      (user_id, exercise_id, state, source, updated_at)
                                                      — state: preferred|neutral|disliked|avoid
                                                      — source: explicit | inferred
                                                         (explicit always outranks inferred, per §4.4/§14)

ProgrammeTemplate (id, user_id, name)                — the twice-weekly full-body structure (§3)
ProgrammeTemplateSlot (template_id, programme_group, order)
                                                      — "this session needs one exercise from
                                                         Legs, one from Back, ..." — the skeleton
                                                         the engine fills

WorkoutSession   (id, user_id, date, template_id, status)
PlannedExercise  (session_id, exercise_id, slot_order,
                  prescribed_weight, prescribed_reps, is_warmup, is_cooldown)
                                                      — warm-up/cool-down flagged and excluded
                                                         from coverage + progression per §7/§8

SetLog           (planned_exercise_id, actual_weight, actual_reps,
                   completed, feedback, logged_at)
                                                      — feedback: easy|good|hard|too_hard|failed

ExerciseHistory  (materialized/query view over SetLog+PlannedExercise)
                                                      — "recent performance" and "recently used"
                                                         lookups the engine needs (§4.5, §12.6)
```

Notes:
- `Exercise.programme_group` and `ExerciseMuscle` are deliberately separate tables/columns — this is the concrete enforcement of the spec's Bulgarian Split Squat example (§3).
- Warm-up and cool-down exercises are represented as `PlannedExercise` rows with a flag, not a separate schema, so logging UI stays uniform — but the domain layer filters them out before any coverage/progression calculation, per §7/§8 of the spec.
- Multi-user is one nullable-free column away (`user_id` is already present) but no auth is built in V1, per §2.

---

## 5. Core Domain Objects

These live in `packages/domain/src/entities` and `types`, expressed as plain TypeScript types/interfaces (not classes with behavior baked in — see §7):

- **Exercise** — the full structured record from §5 of the spec.
- **MuscleCoverage** — a normalized `{ muscle: primary | secondary }[]` view, always derived from `ExerciseMuscle`, never from `programme_group`.
- **ProgrammeGroup** — enum: Legs, Back, Chest, Triceps, Shoulders, Biceps, Core.
- **ProgrammeSlot** — "this session needs one exercise from group X."
- **WorkoutSession** — an ordered list of `PlannedExercise` (warm-up → 7 groups → cool-down).
- **PlannedExercise** — an `Exercise` plus a prescription (weight, reps/duration) for one session.
- **SetResult** — the logged outcome of a `PlannedExercise` (actual weight/reps, completion, feedback).
- **PreferenceState** — `preferred | neutral | disliked | avoid`, with `explicit | inferred` provenance.
- **RefreshConstraints** — the structured intent object from §15 (`mode`, `location_preference`, `variety`, etc.) — this is the *only* shape the AI layer is allowed to produce.
- **EquipmentProfile** — `{ equipment, location }` for an exercise, used by the optimiser (§13).
- **ProgressionRecommendation** — `{ exercise_id, suggested_weight, rationale }`, output of the progression engine, never applied silently (see §7 phasing).

---

## 6. Separation Between UI and Business Logic

Enforced at three levels, not just by convention:

1. **Package boundary.** `packages/domain` has no dependency on `next`, `react`, or `@prisma/client`. It cannot physically import UI or persistence code. Its public API is a small set of pure functions:
   - `buildDefaultSession(catalog, template): WorkoutSession`
   - `refreshWorkout(session, catalog, preferences, history, constraints): WorkoutSession`
   - `recommendProgression(exercise, history): ProgressionRecommendation`
   - `scoreEquipmentTransitions(session): number`
2. **Server Actions are translators, not decision-makers.** An action like `logSet(...)` or `requestRefresh(...)` does: parse/validate input (Zod) → load data via `packages/db` → call the relevant `packages/domain` function → persist the result via `packages/db` → return a DTO. No branching on training logic (which exercise to swap, how much to increase weight) is allowed to live in `apps/web`.
3. **Components are presentational.** React components receive already-decided data (a `WorkoutSession`, a `ProgressionRecommendation`) and render it, or capture input and hand it to a Server Action. They do not compute muscle coverage, scoring, or progression themselves.

This means the entire engine is testable with zero UI or HTTP in the loop, and — if this later became a CLI or a mobile app — only `apps/web` would be rewritten.

---

## 7. The Deterministic Workout Engine

Four sub-modules, each a pure function over explicit inputs, matching spec sections §9/§11/§12/§13:

**`workout-builder`** (V1 first, matches §9)
Assembles the default session in the fixed order (warm-up → Legs → Back → Chest → Triceps → Shoulders → Biceps → Core → cool-down) directly from the seeded programme. No optimization of order in V1, as the spec explicitly states.

**`boredom` engine** (§12)
Given the current `WorkoutSession`, the full catalog, `Preference` data, and recent `ExerciseHistory`:
1. For each of the 7 programme groups, select candidate replacement exercises (same `programme_group`, `active = true`).
2. Filter out: explicitly avoided exercises, exercises used in the last *N* sessions (configurable, not hardcoded), and exercises whose `MuscleCoverage` doesn't adequately overlap the exercise being replaced.
3. Rank remaining candidates by: preference weight (preferred > neutral > disliked, avoid already excluded) → equipment-transition score (§13, used as a tie-breaker, not a primary driver) → least-recently-used.
4. Pick the top candidate per group; default "I'm bored" replaces one per group (all seven), matching §4.3/§12.

This is implemented as an explicit, inspectable pipeline (filter → rank → select), not a black box, so each rule can be unit tested independently ("never selects an avoided exercise" is a test, not a hope).

**`progression` engine** (§11)
The spec is explicit that *"the exact progression algorithm must be designed and tested separately before implementation"* and warns against assuming a simple percentage bump is always right. Architecturally, this is handled by:
- Defining a `ProgressionStrategy` interface: `(exercise, history) => ProgressionRecommendation`.
- Shipping a V1 strategy that implements the literal rule table already in §11 (Easy→consider increase, Good→maintain/cautious increase, Hard→maintain, Too hard→reduce/maintain, Failed→reduce) using `progression_percentage` as the step size.
- Never auto-applying the recommendation — V1 surfaces it as a suggestion the user can confirm/override at the start of the next session, which also gives real usage data to validate or replace the strategy later without an architecture change.

**`equipment-optimiser`** (§13)
A pure scoring function over a candidate `WorkoutSession`/ordering: counts equipment changes, location changes (bench/rack/standing/floor), and weight-implement changes between consecutive exercises. Returns a number, lower is better. Used only as a **tie-breaker** inside the boredom engine in V1 (per §4.3's priority: training objectives first). Reordering the whole session for faff-minimization is explicitly out of scope for V1 (§9) and would be a later phase.

All four modules share one property: **inputs and outputs are plain data**, so every scenario in the spec ("Bulgarian Split Squat is Chest-grouped but lower-body-muscled," "explicit avoidance beats inferred dislike") can be written as a table-driven unit test without any infrastructure.

---

## 8. How a Future AI Layer Integrates

The spec is unambiguous: *"AI should NOT directly generate or validate workouts."* The architecture enforces this by giving the AI layer exactly one contract:

```
natural language  →  packages/ai  →  RefreshConstraints (Zod-validated)  →  packages/domain
```

- `packages/ai` calls an LLM (adapter behind an interface, so it's mockable in tests and swappable in provider) with a **fixed, narrow instruction**: turn free text into the `RefreshConstraints` shape shown in §15 of the spec — nothing else.
- The output is parsed through the **same Zod schema** used for the manually-built constraints object from the UI's "I'm bored" button. If it fails validation, the request falls back to default boredom behavior (or asks the user to clarify) — it never partially executes an unvalidated instruction.
- Crucially, `RefreshConstraints` can only ever narrow or bias the existing boredom engine's filter/rank pipeline (e.g. `location_preference: "bench"` tightens the candidate filter in step 2 above). It has no field, and the domain engine exposes no function, that lets it directly choose an exercise, set a weight, or bypass muscle-coverage/equipment validation.
- This means the AI layer can be deleted entirely and every other layer keeps working — it's an optional translator sitting in front of the engine's existing, already-tested input surface, not a new code path through it.

---

## 9. Testing Strategy

Testing effort is weighted toward the domain package, because that's where correctness actually matters for this app's premise.

| Layer | Tool | What's covered |
|---|---|---|
| `packages/domain` | Vitest | Unit tests per module (workout-builder, boredom, progression, equipment-optimiser). Scenario/table-driven tests directly from spec examples: Bulgarian Split Squat coverage, explicit-avoidance-beats-inferred-dislike, "refresh replaces exactly one per group," warm-up/cool-down excluded from coverage & progression. Target: near-100% coverage here — it's cheap (no I/O) and this is the highest-value code in the app. |
| `packages/db` | Vitest + a real (throwaway) Postgres, or `pg-mem` | Seed script produces the exact §5/§6 catalog; repository functions return correctly shaped domain types. |
| `apps/web` (Server Actions) | Vitest, domain/db mocked | Actions validate input correctly, call the right domain function, persist the right result — without asserting on domain logic itself (that's already covered above). |
| `apps/web` (UI) | Playwright, a handful of flows | "Log a set in the fewest possible taps" (§10), "tap I'm bored → session updates," "view today's session." Not exhaustive — a few flows that protect the app's actual value proposition. |
| `packages/ai` (future) | Vitest, LLM adapter mocked | Given canned model outputs (including malformed ones), verify Zod validation and fallback behavior. Never tests "is the AI's judgment good" — that's explicitly not its job. |

CI: domain + db + action tests run on every push (fast, cheap); Playwright suite runs on merge to main.

---

## 10. Phased Implementation Plan

**Phase 0 — this document.** Review and sign-off before any code is written.

**Phase 1 — Domain package, no app around it.**
`packages/domain` entities/types + the seeded §5/§6 exercise library as static data + `workout-builder` producing the fixed-order default session. Full unit test suite. Deliverable: `pnpm test` proves the default session matches §9 of the spec, runnable from a script with no UI/DB.

**Phase 2 — Persistence.**
`packages/db`: Prisma schema per §4 above, migration, seed script that loads the same exercise library into Postgres and creates the one seeded user + programme template (§2). Repository functions with tests.

**Phase 3 — Minimal usable app.**
`apps/web`: view today's session, log sets fast (weight/reps/feedback, minimal taps per §10), view session history. No boredom, no progression yet — this is "the app works end to end" milestone.

**Phase 4 — Boredom engine.**
`boredom` module + "I'm bored" action in the UI, wired to real `Preference`/`ExerciseHistory` data. Implicit preference tracking (completed/skipped/replaced) starts here; explicit avoid/prefer as a UI affordance.

**Phase 5 — Progression engine (V1 rule table).**
`progression` module implementing §11's literal rule table, surfaced as a suggested-weight prompt at next session start, user-confirmable rather than auto-applied.

**Phase 6 — Equipment optimisation as tie-breaker.**
`equipment-optimiser` scoring wired into the boredom engine's ranking step (§13), still not reordering full sessions.

**Phase 7 — AI natural-language layer (optional/stretch).**
`packages/ai`: intent parser → `RefreshConstraints`, per §8/§15 above. Explicitly scoped so it can be dropped without touching Phases 1–6.

**Phase 8 — Out of scope for this project's V1, noted for completeness.**
Multi-user auth/onboarding, session reordering optimization, mobile app. Not started unless requirements change (§2).

Each phase after Phase 1 is shippable and demoable on its own — useful for a portfolio project, since the repo shows working, incrementally-committed history rather than one large drop.

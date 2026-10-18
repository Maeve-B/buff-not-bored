# Build workflow — feature-by-feature with visual review

Maeve (product owner, designer) reviews every feature **visually** before the next one starts. Follow this loop for every slice in `BACKLOG.md` (which is broken down from `ROADMAP.md` and `PRODUCT_SPEC.md` §12). `BACKLOG.md` is the only tracker.

## The loop

### 1. Plan (stop for approval)
Before writing code, post a short plan:
- Which spec sections the feature implements (for example "§7.4 Progression nudge").
- **Screens and states affected.** List every screen, and every state of each (empty, first use, normal, edge cases such as light day, assisted exercise or blank weight, and errors).
- Domain changes (`packages/domain`) and data or migration changes.
- Anything in the spec that is ambiguous or conflicts, as questions.

**Wait for Maeve to approve the plan.** If she supplies a design (mockup, screenshot or design link), implement to it. If she doesn't, follow the Placeholder UI rules below.

### 2. Build
- Work on a branch named `feature/<short-name>`, created off `origin/main`.
- Put the logic in `packages/domain`, with unit tests, and keep the UI thin (spec §4.2).
- `pnpm test` must pass.
- Do not edit `PRODUCT_SPEC.md`. Propose spec changes in the review note instead.

### 3. Visual review pack (stop for review)
Run the web app locally and capture screenshots with Playwright (Chromium is installed):
- **Viewport:** mobile, 390 × 844, plus one desktop shot if the layout differs.
- Capture every screen and state listed in the plan, using realistic seed data (Preset Programme 1).
- For flows (for example onboarding, or logging a set), capture each step in order.
- Save the screenshots to `reviews/<feature-name>/NN-description.png`.

Write `reviews/<feature-name>/REVIEW.md` containing:
1. What was built, in 3–5 bullets, written for a designer rather than a developer.
2. The screenshots, embedded in flow order, each with a one-line caption.
3. How to try it yourself (the command to run, and where to tap).
4. Deviations from the spec or the design, and why.
5. Open questions or decisions needed.

**Then stop.** Do not start the next feature until Maeve says it is approved.

### 4. Iterate
- Apply her feedback on the same branch and refresh the screenshots for the changed states only.
- Once she approves, ask before opening the PR. The PR description includes the screenshots (see the PR template). Maeve merges; the agent then marks the slice done in `BACKLOG.md`.

## Placeholder UI
- **Not designed yet:** if there's no design, build a simple layout and label it "proposed, not designed" in `REVIEW.md` and the PR.
- **Design-first screens** (set logging, the progression nudge, onboarding/MVA, home): build a working skeleton only, meaning the real behaviour and data with plain, unstyled layout. Then stop for Maeve's design before polishing.

## Rules
- One feature at a time; never batch features into one review.
- Small, reviewable changes. If a feature is large, split it and agree the split at the plan step.
- Never change a prescribed load automatically (spec §3.3), and never add body-weight tracking (spec §13).

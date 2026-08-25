# Buff, Not Bored — Product Specification

## 1. Product Overview

Buff, Not Bored is an adaptive strength-training app.

The goal is to help a user follow an effective twice-weekly full-body strength programme while reducing three major sources of friction:

1. Workout boredom — doing the same exercises repeatedly.
2. Gym faff — unnecessary equipment changes and movement around the gym.
3. Poor progression — uncertainty about when and how much to increase weights.

The app should adapt the workout without compromising the underlying training objectives.

The initial version is based on one user's existing programme and exact working weights.

---

# 2. Initial User

V1 is designed for a single user.

Do not build multi-user onboarding yet.

The initial programme belongs to one user and should be seeded into the application.

---

# 3. Training Model

Strength training occurs twice per week.

Both sessions are full-body sessions.

Example:

Monday — Full Body
Wednesday — Full Body

The user may eventually be able to choose their training days.

Cardio occurs separately and is not part of the strength programme.

Each strength session should provide meaningful training exposure across:

- Legs
- Back
- Chest
- Triceps
- Shoulders
- Biceps
- Core

## Important distinction

Programme groups and physiological muscle groups are different concepts.

An exercise belongs to a programme group for organisational purposes.

Its actual muscles must be represented separately.

Example:

Bulgarian Split Squat:

Programme group:
Chest

Actual primary muscles:
Quadriceps
Glutes

The Bulgarian Split Squat is deliberately placed in the Chest programme group because it currently uses the same equipment and setup as the chest exercises.

The optimisation engine must use actual muscle classifications when calculating muscle coverage.

It must NOT assume that programme group = muscle group.

---

# 4. Product Principles

## 4.1 Training objectives come first

Exercise substitutions must preserve the relevant training stimulus.

The system must not substitute exercises simply because another exercise is easier to perform.

---

## 4.2 Minimise gym faff

The user wants to avoid unnecessary movement around the gym.

The system should eventually optimise:

- equipment changes
- weight changes
- location changes
- bench/rack changes
- setup time

Example:

If several exercises can be performed using the bench and the same dumbbells, the system should prefer grouping them together where this does not compromise the workout.

---

## 4.3 Boredom is an optimisation variable

The user may request a workout refresh because they are bored.

Default boredom behaviour:

Replace exactly ONE exercise from EACH programme group.

There are seven programme groups:

- Legs
- Back
- Chest
- Triceps
- Shoulders
- Biceps
- Core

Therefore a full refresh potentially replaces seven exercises.

However, substitutions must preserve appropriate muscle coverage and remain compatible with the available equipment.

---

## 4.4 Learn exercise preferences

The system should learn from user behaviour.

Possible preference states:

- preferred
- neutral
- disliked
- avoid

If the user repeatedly rejects an exercise, the system should reduce the probability of suggesting it.

If the user explicitly says:

"Avoid Bulgarian split squats."

the system should store that preference as an explicit avoidance.

Explicit avoidance should have higher priority than inferred dislike.

---

## 4.5 Progression

The system should eventually recommend increases in weight based on actual workout performance.

Progression should consider:

- prescribed weight
- prescribed reps
- actual weight
- actual reps
- user feedback
- previous performance
- exercise-specific progression percentage

Initial progression percentages are starting parameters.

They are not immutable rules.

---

# 5. Initial Exercise Database

The exercise database must represent exercises as structured data.

Each exercise should have:

- id
- name
- programme_group
- primary_muscles
- secondary_muscles
- movement_patterns
- exercise_type
- equipment
- starting_weight
- weight_unit
- prescribed_reps
- prescribed_duration
- reps_unit
- location
- progression_percentage
- active
- notes

---

# 6. Exercise Library

## LEGS

### Squats

Programme group:
Legs

Primary muscles:
- quadriceps

Secondary muscles:
- glutes
- adductors

Movement pattern:
- squat

Exercise type:
- compound

Equipment:
- barbell

Location:
- rack

Starting weight:
- 20kg

Reps:
- 20

Progression:
- 5%

---

### Squat Pulse

Programme group:
Legs

Primary muscles:
- quadriceps

Secondary muscles:
- glutes

Movement pattern:
- squat

Exercise type:
- compound

Equipment:
- barbell

Location:
- rack

Starting weight:
- 20kg

Reps:
- 16

Progression:
- 5%

---

### Sumo Squats

Programme group:
Legs

Primary muscles:
- glutes
- adductors

Secondary muscles:
- quadriceps

Movement pattern:
- squat

Exercise type:
- compound

Equipment:
- barbell

Location:
- rack

Starting weight:
- 20kg

Reps:
- 16

Progression:
- 5%

---

### Squat + Calf Raise

Programme group:
Legs

Primary muscles:
- quadriceps

Secondary muscles:
- glutes
- calves

Movement pattern:
- squat
- calf raise

Exercise type:
- compound

Equipment:
- barbell

Location:
- rack

Starting weight:
- 20kg

Reps:
- 16

Progression:
- 5%

---

### Bodyweight Squat Pulses

Programme group:
Legs

Primary muscles:
- quadriceps

Secondary muscles:
- glutes

Movement pattern:
- squat

Exercise type:
- bodyweight

Equipment:
- bodyweight

Location:
- standing

Duration:
- 30 seconds

---

# BACK

### Deadlifts

Programme group:
Back

Primary muscles:
- hamstrings
- glutes

Secondary muscles:
- spinal erectors
- back

Movement pattern:
- hinge

Exercise type:
- compound

Equipment:
- barbell

Location:
- rack

Starting weight:
- 35kg

Current working range:
- 35–40kg

Reps:
- 20

Progression:
- 5%

---

### RDL to Upright Row

Programme group:
Back

Primary muscles:
- hamstrings
- glutes

Secondary muscles:
- upper back
- shoulders

Movement pattern:
- hinge
- full-body combination

Exercise type:
- compound

Equipment:
- barbell

Location:
- rack

Starting weight:
- 20kg

Current working range:
- 20–25kg

Reps:
- 16

Progression:
- 5%

---

### Superman Holds

Programme group:
Back

Primary muscles:
- spinal erectors

Secondary muscles:
- glutes

Movement pattern:
- back extension

Exercise type:
- bodyweight

Equipment:
- bodyweight

Location:
- floor

Duration:
- 30 seconds

---

# CHEST

### Flat DB Press

Programme group:
Chest

Primary muscles:
- chest

Secondary muscles:
- triceps
- anterior deltoids

Movement pattern:
- horizontal push

Exercise type:
- compound

Equipment:
- dumbbells

Location:
- bench

Starting weight:
- 8kg each dumbbell

Reps:
- 20

Progression:
- 2.5%

---

### Incline DB Press

Programme group:
Chest

Primary muscles:
- upper chest

Secondary muscles:
- anterior deltoids
- triceps

Movement pattern:
- incline push

Exercise type:
- compound

Equipment:
- dumbbells

Location:
- bench

Starting weight:
- 8kg each dumbbell

Reps:
- 16

Progression:
- 2.5%

---

### Bulgarian Split Squat

Programme group:
Chest

IMPORTANT:
This programme classification exists for workout/equipment organisation only.

Actual muscle classification is lower body.

Primary muscles:
- quadriceps
- glutes

Secondary muscles:
- hamstrings
- adductors

Movement pattern:
- unilateral leg

Exercise type:
- compound

Equipment:
- dumbbells

Location:
- bench

Starting weight:
- 8kg each dumbbell

Reps:
- 12 per side

Progression:
- 2.5%

---

### Push-Ups

Programme group:
Chest

Primary muscles:
- chest

Secondary muscles:
- triceps
- anterior deltoids

Movement pattern:
- horizontal push

Exercise type:
- bodyweight

Equipment:
- bodyweight

Location:
- bench/floor

Reps:
- 15

---

# TRICEPS

### Lying Tricep Extensions

Programme group:
Triceps

Primary muscles:
- triceps

Movement pattern:
- elbow extension

Exercise type:
- isolation

Equipment:
- dumbbells

Location:
- bench

Starting weight:
- 4kg each dumbbell

Reps:
- 16

Progression:
- 2.5%

---

### Close-Grip Push-Ups

Programme group:
Triceps

Primary muscles:
- triceps

Secondary muscles:
- chest

Movement pattern:
- horizontal push

Exercise type:
- bodyweight

Equipment:
- bodyweight

Location:
- bench/floor

Reps:
- 12

---

### Tricep Kickbacks

Programme group:
Triceps

Primary muscles:
- triceps

Movement pattern:
- elbow extension

Exercise type:
- isolation

Equipment:
- dumbbells

Location:
- bench

Starting weight:
- 4kg each dumbbell

Reps:
- 16

Progression:
- 2.5%

---

# SHOULDERS

### Lateral Raises

Programme group:
Shoulders

Primary muscles:
- lateral deltoids

Movement pattern:
- lateral raise

Exercise type:
- isolation

Equipment:
- dumbbells

Location:
- standing

Starting weight:
- 4kg each dumbbell

Reps:
- 16

Progression:
- 2.5%

---

### Front Raises

Programme group:
Shoulders

Primary muscles:
- anterior deltoids

Movement pattern:
- anterior raise

Exercise type:
- isolation

Equipment:
- dumbbells

Location:
- standing

Starting weight:
- 4kg each dumbbell

Reps:
- 16

Progression:
- 2.5%

---

### Overhead Press

Programme group:
Shoulders

Primary muscles:
- shoulders

Secondary muscles:
- triceps

Movement pattern:
- vertical push

Exercise type:
- compound

Equipment:
- dumbbells

Location:
- standing

Starting weight:
- 12.5kg each dumbbell

Reps:
- 16

Progression:
- 2.5%

---

# BICEPS

### Concentration Curl

Programme group:
Biceps

Primary muscles:
- biceps

Movement pattern:
- elbow flexion

Exercise type:
- isolation

Equipment:
- dumbbell

Location:
- bench

Starting weight:
- 6kg

Reps:
- 12 per side

Progression:
- 2.5%

---

### Alternating Dumbbell Curl

Programme group:
Biceps

Primary muscles:
- biceps

Movement pattern:
- elbow flexion

Exercise type:
- isolation

Equipment:
- dumbbells

Location:
- standing

Starting weight:
- 6kg each dumbbell

Reps:
- 20

Progression:
- 2.5%

---

### Hammer Curl

Programme group:
Biceps

Primary muscles:
- biceps
- brachialis

Secondary muscles:
- forearms

Movement pattern:
- elbow flexion

Exercise type:
- isolation

Equipment:
- dumbbells

Location:
- standing

Starting weight:
- 6kg each dumbbell

Reps:
- 16

Progression:
- 2.5%

---

# CORE

### Plank

Programme group:
Core

Primary muscles:
- abdominals

Secondary muscles:
- glutes

Movement pattern:
- anti-extension

Exercise type:
- core

Equipment:
- bodyweight

Location:
- bench/floor

Duration:
- 45 seconds

---

### Russian Twists

Programme group:
Core

Primary muscles:
- obliques

Secondary muscles:
- abdominals

Movement pattern:
- rotation

Exercise type:
- core

Equipment:
- dumbbell

Location:
- bench/floor

Starting weight:
- 4kg

Reps:
- 20

Progression:
- 2.5%

---

### Bicycle Crunches

Programme group:
Core

Primary muscles:
- abdominals

Secondary muscles:
- obliques

Movement pattern:
- rotation/flexion

Exercise type:
- core

Equipment:
- bodyweight

Location:
- floor

Reps:
- 20

---

# 7. Warm-up

Warm-up:

1. Squats
2. Squat + Upright Row
3. Bicep Curls
4. Overhead Press

Target duration:
5–6 minutes

Warm-up exercises:

- do not count towards muscle coverage
- do not participate in progression calculations
- are performed before the main programme

---

# 8. Cool-down

Target duration:
3–5 minutes

Target areas:

- quads
- hamstrings
- chest
- lats
- shoulders
- triceps
- biceps
- hip flexors

Cool-down does not participate in workout optimisation.

---

# 9. Default Workout

The initial workout should follow the existing programme structure:

1. Warm-up
2. Legs
3. Back
4. Chest
5. Triceps
6. Shoulders
7. Biceps
8. Core
9. Cool-down

Target session duration:

45–50 minutes

This is an estimate, not a hard constraint.

The initial version should NOT optimise the exercise order.

---

# 10. Workout Logging

For each exercise the user should be able to record:

- prescribed weight
- actual weight
- prescribed reps
- actual reps
- completion
- feedback

Feedback options:

- Easy
- Good
- Hard
- Too hard
- Failed

The interaction should be extremely fast.

This is a gym app, so the user should not need to type extensively during a workout.

---

# 11. Future Progression Engine

The progression engine should eventually use:

- previous prescribed weight
- previous actual weight
- prescribed reps
- actual reps
- completion status
- user feedback
- exercise progression percentage
- recent performance history

Initial concept:

If the user completes the prescribed work comfortably, increase the next prescribed load according to the exercise's progression percentage.

If the user reports:

Easy:
consider progression.

Good:
maintain or cautiously progress.

Hard:
maintain.

Too hard:
reduce or maintain.

Failed:
reduce.

The exact progression algorithm must be designed and tested separately before implementation.

Do not assume a simplistic percentage increase is always appropriate.

---

# 12. Future Boredom Engine

When the user selects "I'm bored":

Default behaviour:

Replace exactly one exercise in each of the seven programme groups.

The replacement must:

1. Belong to the same programme group.
2. Provide appropriate muscle coverage.
3. Be compatible with the user's available equipment.
4. Respect explicit exercise avoidance.
5. Consider inferred preferences.
6. Avoid excessive repetition of recently used exercises.
7. Prefer exercises that minimise equipment/location changes.

The system must preserve the overall training intent.

---

# 13. Future Equipment Optimisation

The user particularly dislikes moving around the gym.

The optimiser should eventually consider:

- equipment type
- equipment location
- bench usage
- rack usage
- dumbbell weight
- barbell weight
- setup changes
- location changes

Example:

If two valid exercise selections train the target muscles equally well, prefer the one requiring fewer equipment changes.

The optimisation should be based on explicit scoring rather than subjective AI judgement.

---

# 14. Future Preference Learning

Track:

- exercises completed
- exercises skipped
- exercises replaced
- explicit dislikes
- explicit avoids
- explicit favourites
- post-exercise feedback

Repeated behaviour may produce an inferred preference.

Explicit user preferences must always override inferred preferences.

---

# 15. Future AI Layer

AI should NOT directly generate or validate workouts.

AI's job should eventually be to interpret natural-language intent.

Example:

User says:

"I'm bored and don't want to leave the bench today."

AI should translate this into structured constraints such as:

```json
{
  "mode": "refresh",
  "location_preference": "bench",
  "variety": "high"
}
```

The deterministic engine remains solely responsible for validating and applying these constraints. The AI layer never writes directly to the workout, the exercise database, or progression state.

# S-001 · Exercise library in the new shape

## What was built
- Every one of the 33 existing exercises now carries the new spec v2 details (§9.1): what kind of movement it is, what it needs, how it goes up, what to swap it for, which joints it stresses, and coaching cues.
- **Nothing on screen changes.** The old details (body-part group, equipment, location) stay alongside the new ones, so "I'm bored", "shorter workout" and the rest of the app behave exactly as before.
- The library now checks itself. For example, a light alternative must be the same kind of movement, a loaded exercise must offer real weight jumps, and no strength exercise may default to percentage progression.
- Saved workouts store the new details too. The database change only adds columns; nothing existing changed.
- A workout you started before this update still saves. The app saves the library's current version of each exercise, and older saved copies are filled in from the library when they're read back.

## Screenshots
No screen changes, so no screenshots. This table is the review (D-005).

## How to try it
Nothing to tap yet. These details start doing visible work in S-002 (your weights), S-003 (rep defaults) and S-004 (the nudge), and in Phase 1's light day and swap.

## Please check: my judgement calls ⚠️
1. **Weight jumps** use the spec's typical values: barbell +2.5 / +5 kg, dumbbells +1 / +2 / +2.5 kg. Do they match your gym?
2. **Upright Row** is filed as a *shoulder raise*, not the v1 "vertical pull". Vertical pull in v2 means pull-ups and pulldowns.
3. **Bench Flyes** are filed as a *horizontal push* (isolation), with their own swap group.
4. **Superman Holds** are filed as a *hinge* (isolation), with their own swap group. That makes them the light alternative for Deadlifts, RDL to Upright Row and Good Mornings.
5. **Stations follow the old locations,** so Deadlifts, RDL to Upright Row and Barbell Curl say *rack* even though they're really done in open space. Keeping them the same means faff scoring behaves as before. I can change them if you'd rather.
6. **Alternating Dumbbell Curl** counts as one-sided, but its reps are a total, not per side.
7. **Bodyweight moves default to "ladder" progression,** following §6.5. Only the pull-up ladder is defined so far (Phase 1), so for now this just means the progression engine won't nudge their load.
8. **Light alternatives:** 14 exercises have one and 19 don't yet. The v1 library has no machine or supported variants, which Phase 1's expansion adds.
9. **Skill levels and joint-stress tags** are my reading. Squats, Deadlifts, the barbell presses, Lunges and Bulgarian Split Squats are *intermediate*; the rest are *beginner*.
10. **Cues** are new wording throughout (listed at the bottom).

Your earlier answers are applied: core exercises are *isolation*; RDL to Upright Row is a *hinge*; Squat + Calf Raise is a *squat*.

## What it is and what it needs
| Exercise | Pattern | Class | Level | Load | Needs | Station | One side |
|---|---|---|---|---|---|---|---|
| Squats | squat | compound | intermediate | barbell | barbell, rack | rack | – |
| Squat Pulse | squat | compound | beginner | barbell | barbell, rack | rack | – |
| Lunges (Alternating) | lunge unilateral | compound | intermediate | barbell | barbell, rack | rack | yes |
| Sumo Squats | squat | compound | beginner | barbell | barbell, rack | rack | – |
| Squat + Calf Raise | squat | compound | beginner | barbell | barbell, rack | rack | – |
| Bodyweight Squat Pulses | squat | compound | beginner | bodyweight | bodyweight | open space | – |
| Bulgarian Split Squat | lunge unilateral | compound | intermediate | dumbbell pair | dumbbells, bench | bench | yes, per side |
| Deadlifts | hinge | compound | intermediate | barbell | barbell | rack | – |
| RDL to Upright Row | hinge | compound | intermediate | barbell | barbell | rack | – |
| Bent-Over Row | horizontal pull | compound | intermediate | barbell | barbell | rack | – |
| Single-Arm Dumbbell Row | horizontal pull | compound | beginner | dumbbell single | dumbbells, bench | bench | yes, per side |
| Good Mornings | hinge | compound | intermediate | barbell | barbell, rack | rack | – |
| Superman Holds | hinge | isolation | beginner | bodyweight | bodyweight | floor | – |
| Flat Bench Press | horizontal push | compound | intermediate | barbell | barbell, bench | bench | – |
| Bench Flyes | horizontal push | isolation | beginner | dumbbell pair | dumbbells, bench | bench | – |
| Flat DB Press | horizontal push | compound | beginner | dumbbell pair | dumbbells, bench | bench | – |
| Incline DB Press | horizontal push | compound | beginner | dumbbell pair | dumbbells, bench | bench | – |
| Push-Ups | horizontal push | compound | beginner | bodyweight | bodyweight | floor | – |
| Lying Tricep Extensions | elbow extension | isolation | beginner | dumbbell pair | dumbbells, bench | bench | – |
| Close-Grip Bench Press | horizontal push | compound | intermediate | barbell | barbell, bench | bench | – |
| Close-Grip Push-Ups | horizontal push | compound | beginner | bodyweight | bodyweight | floor | – |
| Tricep Kickbacks | elbow extension | isolation | beginner | dumbbell pair | dumbbells, bench | bench | – |
| Lateral Raises | shoulder raise | isolation | beginner | dumbbell pair | dumbbells | open space | – |
| Front Raises | shoulder raise | isolation | beginner | dumbbell pair | dumbbells | open space | – |
| Upright Row | shoulder raise | compound | beginner | dumbbell pair | dumbbells | open space | – |
| Overhead Press | vertical push | compound | intermediate | dumbbell pair | dumbbells | open space | – |
| Barbell Curl | elbow flexion | isolation | beginner | barbell | barbell | rack | – |
| Concentration Curl | elbow flexion | isolation | beginner | dumbbell single | dumbbells, bench | bench | yes, per side |
| Alternating Dumbbell Curl | elbow flexion | isolation | beginner | dumbbell pair | dumbbells | open space | yes |
| Hammer Curl | elbow flexion | isolation | beginner | dumbbell pair | dumbbells | open space | – |
| Plank | anti extension | isolation | beginner | bodyweight | bodyweight | floor | – |
| Russian Twists | rotation | isolation | beginner | dumbbell single | dumbbells | floor | – |
| Bicycle Crunches | rotation | isolation | beginner | bodyweight | bodyweight | floor | – |

## How it goes up, and what replaces it
| Exercise | Weight jumps | Progression | Light alternative | Swap group | Joint stress |
|---|---|---|---|---|---|
| Squats | +2.5 / +5 kg | load nudge | Bodyweight Squat Pulses | squat | knee, hip, lower back |
| Squat Pulse | +2.5 / +5 kg | load nudge | Bodyweight Squat Pulses | squat | knee, hip |
| Lunges (Alternating) | +2.5 / +5 kg | load nudge | – | lunge | knee, hip |
| Sumo Squats | +2.5 / +5 kg | load nudge | Bodyweight Squat Pulses | squat | knee, hip |
| Squat + Calf Raise | +2.5 / +5 kg | load nudge | Bodyweight Squat Pulses | squat | knee, hip |
| Bodyweight Squat Pulses | – | ladder | – | squat | knee |
| Bulgarian Split Squat | +1 / +2 / +2.5 kg | load nudge | – | lunge | knee, hip |
| Deadlifts | +2.5 / +5 kg | load nudge | Superman Holds | hinge | lower back, hip |
| RDL to Upright Row | +2.5 / +5 kg | load nudge | Superman Holds | hinge | lower back, hip, shoulder |
| Bent-Over Row | +2.5 / +5 kg | load nudge | Single-Arm Dumbbell Row | horizontal-pull | lower back |
| Single-Arm Dumbbell Row | +1 / +2 / +2.5 kg | load nudge | – | horizontal-pull | – |
| Good Mornings | +2.5 / +5 kg | load nudge | Superman Holds | hinge | lower back, hip |
| Superman Holds | – | ladder | – | back-extension | lower back |
| Flat Bench Press | +2.5 / +5 kg | load nudge | Push-Ups | horizontal-push | shoulder |
| Bench Flyes | +1 / +2 / +2.5 kg | double progression | – | chest-fly | shoulder |
| Flat DB Press | +1 / +2 / +2.5 kg | load nudge | Push-Ups | horizontal-push | shoulder |
| Incline DB Press | +1 / +2 / +2.5 kg | load nudge | Push-Ups | incline-push | shoulder |
| Push-Ups | – | ladder | – | horizontal-push | wrist, shoulder |
| Lying Tricep Extensions | +1 / +2 / +2.5 kg | double progression | – | triceps-extension | elbow |
| Close-Grip Bench Press | +2.5 / +5 kg | load nudge | Close-Grip Push-Ups | triceps-press | elbow, shoulder, wrist |
| Close-Grip Push-Ups | – | ladder | – | triceps-press | wrist, elbow |
| Tricep Kickbacks | +1 / +2 / +2.5 kg | double progression | – | triceps-extension | elbow |
| Lateral Raises | +1 / +2 / +2.5 kg | double progression | – | lateral-raise | shoulder |
| Front Raises | +1 / +2 / +2.5 kg | double progression | – | front-raise | shoulder |
| Upright Row | +1 / +2 / +2.5 kg | load nudge | Lateral Raises | upright-row | shoulder, wrist |
| Overhead Press | +1 / +2 / +2.5 kg | load nudge | – | vertical-push | shoulder, lower back |
| Barbell Curl | +2.5 / +5 kg | double progression | – | biceps-curl | elbow, wrist |
| Concentration Curl | +1 / +2 / +2.5 kg | double progression | – | biceps-curl | elbow |
| Alternating Dumbbell Curl | +1 / +2 / +2.5 kg | double progression | – | biceps-curl | elbow |
| Hammer Curl | +1 / +2 / +2.5 kg | double progression | – | biceps-curl | elbow |
| Plank | – | ladder | – | anti-extension | – |
| Russian Twists | +1 / +2 / +2.5 kg | double progression | Bicycle Crunches | rotation | lower back |
| Bicycle Crunches | – | ladder | – | rotation | – |

## Cues (setup, then form)
- **Squats.** Bar across your upper back, feet about shoulder-width, toes slightly out. Brace before you descend. Knees track over your toes.
- **Squat Pulse.** Squat stance with the bar on your upper back; sink to the bottom position. Stay low and pulse through the bottom quarter. Keep your chest up.
- **Lunges (Alternating).** Bar across your upper back, standing tall with feet hip-width. Step long enough that your front shin stays upright. Lower the back knee gently towards the floor.
- **Sumo Squats.** Wide stance, toes turned out, bar across your upper back. Push your knees out over your toes. Sit straight down between your heels.
- **Squat + Calf Raise.** Squat stance with the bar on your upper back. Stand fully out of the squat, then rise onto your toes. Lower your heels slowly before the next rep.
- **Bodyweight Squat Pulses.** Feet shoulder-width, arms out in front for balance; sink into a squat. Keep the pulses small and steady. Weight through your whole foot.
- **Bulgarian Split Squat.** Back foot laces-down on the bench, front foot a long stride ahead. Drop straight down, not forwards. Drive up through your front heel.
- **Deadlifts.** Bar over your midfoot, shins close, hands just outside your legs. Brace and push the floor away. Keep the bar close all the way up.
- **RDL to Upright Row.** Stand tall holding the bar at your thighs, hands about shoulder-width. Hinge back with soft knees until you feel your hamstrings. Stand up, then lead the row with your elbows.
- **Bent-Over Row.** Hinge forward with a flat back, bar hanging under your shoulders. Pull the bar to your lower ribs. Keep your torso still.
- **Single-Arm Dumbbell Row.** One knee and hand on the bench, dumbbell hanging below your shoulder. Pull your elbow back towards your hip. Don't twist to lift it.
- **Good Mornings.** Bar across your upper back, feet hip-width, soft knees. Push your hips back and keep your back flat. Stop when you feel a stretch in your hamstrings.
- **Superman Holds.** Lie face down with your arms stretched out in front. Lift your arms, chest and legs a few centimetres. Squeeze your glutes and breathe steadily.
- **Flat Bench Press.** Lie with your eyes under the bar, feet flat, shoulder blades pulled together. Lower the bar to mid-chest with control. Press back up over your shoulders.
- **Bench Flyes.** Lie on the bench with the dumbbells above your chest, palms facing. Open your arms wide with a slight bend in the elbows. Bring them back together as if hugging a tree.
- **Flat DB Press.** Lie on the bench with a dumbbell in each hand at chest level. Press up and slightly together. Lower slowly until your elbows are just below the bench.
- **Incline DB Press.** Set the bench to a low incline; dumbbells at your upper chest. Press up over your shoulders. Keep your shoulder blades set against the bench.
- **Push-Ups.** Hands just wider than your shoulders, body in one straight line. Lower your chest to just above the floor. Keep your hips in line with your shoulders.
- **Lying Tricep Extensions.** Lie on the bench with the dumbbells straight up over your shoulders. Bend only at the elbows to lower the weights beside your head. Keep your upper arms still.
- **Close-Grip Bench Press.** Lie under the bar with your hands about shoulder-width apart. Keep your elbows tucked close to your sides. Lower to your lower chest and press up.
- **Close-Grip Push-Ups.** Hands under your shoulders, body in one straight line. Elbows brush your sides as you lower. Press back up without letting your hips sag.
- **Tricep Kickbacks.** Hinge forward, upper arms tight to your sides and parallel to the floor. Straighten your arms back behind you. Pause at the top before lowering.
- **Lateral Raises.** Stand tall with a dumbbell at each side, slight bend in the elbows. Raise your arms out to shoulder height. Lead with your elbows, not your hands.
- **Front Raises.** Stand tall with the dumbbells in front of your thighs. Raise them in front to shoulder height. Lower slowly without swinging.
- **Upright Row.** Stand tall with the dumbbells in front of your thighs. Pull up along your body, elbows leading. Stop around chest height if your shoulders complain.
- **Overhead Press.** Stand tall with the dumbbells at shoulder height. Brace your core and press straight overhead. Don't lean back.
- **Barbell Curl.** Stand tall holding the bar with an underhand, shoulder-width grip. Keep your elbows pinned to your sides. Lower all the way down with control.
- **Concentration Curl.** Sit on the bench, elbow braced against your inner thigh. Curl the dumbbell up towards your shoulder. Lower slowly to a full stretch.
- **Alternating Dumbbell Curl.** Stand tall with a dumbbell in each hand, palms forward. Curl one arm at a time. No swinging: keep your body still.
- **Hammer Curl.** Stand tall with the dumbbells at your sides, palms facing in. Curl up keeping your thumbs on top. Elbows stay by your sides.
- **Plank.** Forearms on the floor under your shoulders, legs straight behind you. Squeeze your glutes and tuck your ribs down. Breathe steadily; don't let your hips sag.
- **Russian Twists.** Sit leaning back slightly, knees bent, holding one dumbbell at your chest. Rotate from your ribs, not just your arms. Keep your chest tall.
- **Bicycle Crunches.** Lie on your back, hands lightly behind your head, knees lifted. Bring each elbow towards the opposite knee. Move slowly; don't pull on your neck.

## Deviations from the spec
- §9.1's `default_prescription` (sets, reps and rest per goal) is not here; it's S-003. `starting_weight` is still in the library; it moves out in S-002.
- No exercise has an easier or harder neighbour yet; ladders arrive in Phase 1 (§10.3).



### D-020 · The setup conversation: one question at a time, your place kept (2026-10-28, Maeve, S-015)
- Decision: until your training needs are saved, Home opens with a scripted conversation that asks the needs questions one at a time. Optional questions have Skip; questions only appear when they apply (heaviest dumbbell, a note about limitations). Avoid and favourite exercises use progressive disclosure: "Any?" first, then a search. It ends on a summary where any answer can be changed, then Save: "Saved. Your programme comes next."
- Your place is saved in the database after every step (one row, a small schema change Maeve approved), so it resumes on any device. "Not now" pauses it; Home then offers "Carry on". Saving the profile (here or from the Settings form) ends the conversation.
- The script (order, which questions apply, the checks) is in the engine; the wording is in the app, for Maeve to rewrite.
- Alternatives: keeping the place on this device only (no schema change, but no resuming elsewhere).

### D-021 · The daily check-in (2026-10-28, Maeve, S-016)
- Decision: once you're set up, the first visit to Home each day opens with a check-in, one tap per question: sleep (Badly / OK / Well), energy (Low / OK / High), soreness (Not at all / A bit / Very) and pain (No / Yes → where: knee, lower back, shoulder, wrist, elbow, hip; the same six areas as limitations and the library's joint-stress tags). "Not today" skips it for the day. Home then shows a one-line "Checked in today" summary with Change.
- One check-in per day is saved in the database (a new table, Maeve approved). Nothing adapts from it yet (S-018).
- No check-in on the day you first set up: there's nothing to "welcome back" from yet (S-016 review).
- "Today" is the calendar day of the computer running the app (fine locally; noted in the backlog for hosting).

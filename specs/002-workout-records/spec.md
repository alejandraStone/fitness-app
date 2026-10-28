# Feature Specification: Workout Records

## 1. Purpose

Allow users to record the actual performance of an existing routine on a selected date, preserve a historical snapshot of the planned configuration, review saved workouts, and edit their recorded performance without altering the source routine or its history.

This feature covers workout recording, saved workout detail, and workout history. Progression charts, personal records, and progression recommendations belong to a later feature.

## 2. Scope

### In scope

- Start workout recording from a routine scheduled on the Home calendar.
- Record actual weight and repetitions for every planned set.
- Capture and preserve a historical snapshot of the routine configuration.
- Show the previous saved result for the same exercise when available.
- Save workouts transactionally with all exercises and sets.
- Open saved workout detail immediately after saving.
- View and edit saved workout performance.
- Access Workout History from the Home `Actividad` section.
- Show workout activity in Home and distinguish saved workouts from scheduled routines on the calendar.
- Persist workouts locally and preserve history when routines are edited or deleted.
- Enforce at most one saved workout per routine and date.

### Out of scope

- Progression charts, exercise history screens, personal records, and recommendations.
- Free workouts not created from an existing routine.
- Adding, removing, or skipping exercises or sets during recording.
- Recording a different number of sets than the routine defines.
- Editing a workout's date after it has been saved.
- Deleting saved workouts.
- Routine configuration editing from the workout flow.
- Weight unit selection and conversion. Weights remain in kilograms until the Profile feature is implemented.
- A global exercise catalog or reusable exercise entities.
- Real-time workout tracking, rest timers, tempo, RIR, or additional-set management.
- Backend services, authentication, cloud storage, or synchronization.

## 3. User Stories

- As a user, I want to record what I actually lifted for a scheduled routine so that my training is saved.
- As a user, I want to see the previous result for an exercise so that I can choose the next load with context.
- As a user, I want my planned routine configuration to remain unchanged by what I actually recorded.
- As a user, I want to review a saved workout after training.
- As a user, I want to correct the actual weights or repetitions of a saved workout.
- As a user, I want to browse my workout history by date.
- As a user, I want my workout history to remain available even if I edit or delete the source routine.

## 4. Functional Requirements

### FR-01: Recording entry and eligibility

A workout recording MUST start from a routine scheduled on the Home calendar for the selected date.

The selected date MUST be today or a past date. A future date MUST NOT expose the recording action.

The routine MUST exist and MUST be effectively scheduled for the selected date through recurring weekdays, a one-time assignment, or both.

The selected Home date MUST become the workout date when recording starts. The recording screen MUST NOT provide a separate date picker.

Opening the recording screen and leaving without saving MUST NOT create a workout or affect history.

A routine MUST NOT have more than one saved workout for the same date.

When a saved workout already exists for the routine and selected date, the Home card MUST show `Ver entrenamiento` and open the saved workout detail instead of starting another recording.

Free workouts and recording from Routine Detail or the Routines list are outside this feature.

### FR-02: Historical snapshot

When recording begins, the application MUST capture an immutable snapshot of:

- Routine name.
- Exercise names and display order.
- Exercise notes.
- Planned sets.
- Planned repetition range.
- Planned weight.
- Actual set values entered by the user.

Changes to the source routine while the recording screen is open MUST NOT alter the captured snapshot.

If the source routine is permanently deleted before the workout is saved, the workout MUST NOT be saved. The pending recording MUST be cancelled and the user MUST be informed.

The snapshot MUST be persisted with the workout on the first successful save.

The workout date MUST be immutable after the workout is saved.

### FR-03: Recording actual performance

The recording screen MUST show all exercises in their configured order and all planned sets for each exercise.

For each exercise, the screen MUST show:

- Exercise name.
- Optional notes.
- Planned sets and repetition range.
- Planned weight.
- One editable row per planned set.
- The previous saved result when available.

For every planned set:

- Weight MUST be prefilled with the planned weight.
- Repetitions MUST start empty.
- Weight and repetitions MUST be editable independently.
- Actual weight MUST NOT update the routine's planned weight.

The user MUST NOT be able to add sets, remove sets, skip sets, add exercises, remove exercises, or save a partial workout.

All planned sets MUST have valid repetitions before saving.

Validation rules:

- Actual weight MUST be a non-negative number.
- Zero kilograms MUST represent an exercise without external load.
- Repetitions MUST be positive integers.
- Every planned set MUST contain repetitions.

Invalid input MUST prevent saving and MUST be presented with clear inline feedback in Spanish.

### FR-04: Previous performance

When available, the recording screen MUST show the previous saved result for the same exercise.

The same exercise MUST be identified by its exercise name snapshot, normalized by trimming leading and trailing whitespace and comparing case-insensitively. Matching MUST work across different routines.

The previous result MUST be the most recent saved workout whose date is strictly before the selected workout date. If multiple workouts share that date, the most recently saved one MUST be used.

The previous result MUST include:

- Workout date.
- Recorded weight for each set.
- Recorded repetitions for each set.

The previous result MUST use historical snapshot data, never the current routine configuration.

If no previous result exists, no previous result MUST be shown.

When editing a saved workout, the workout being edited MUST be excluded from the previous-performance search.

Because exercise names are user-defined, renaming an exercise does not retroactively change historical snapshots. Earlier results under the previous name may no longer match.

### FR-05: Saving a workout

Saving MUST persist the workout, its historical exercises, and all recorded sets as one atomic operation.

If any part of the save fails, no partial workout, exercise, or set data MUST remain in persistence. The recording draft MUST remain available so the user can retry.

After a successful save, the application MUST open the saved Workout Detail screen.

The application MUST NOT show a success snackbar. The saved workout detail is the success confirmation.

### FR-06: Home card state and calendar

For a scheduled routine on Home:

- If the selected date is today or in the past and no saved workout exists, the card MUST show `Registrar mi entrenamiento`.
- If a saved workout exists for that routine and date, the card MUST show `Ver entrenamiento`.
- If the selected date is in the future, the card MUST NOT show a recording action.

If a routine is no longer scheduled for the date after a workout was saved, the workout MUST remain available in Workout History.

If the source routine is deleted, its saved workouts MUST remain available in Workout History.

The Home calendar MUST distinguish dates with scheduled routines from dates with saved workouts. A date containing both MUST represent both states.

The exact calendar indicator treatment is defined by the design documentation.

### FR-07: Workout Detail

Workout Detail MUST display the saved historical record:

- Workout date.
- Routine name from the snapshot.
- Exercises in their historical order.
- Exercise notes from the snapshot.
- Planned sets, repetition range, and planned weight from the snapshot.
- Actual weight and repetitions for every set.
- Summary of exercise count, total sets, and total repetitions.
- Action to edit the recorded performance.

Workout Detail MUST remain readable if the source routine no longer exists.

The workout date MUST NOT be editable.

A saved workout MUST NOT expose a delete action.

Progression suggestions and progression results are outside this feature and MUST NOT be shown as placeholders.

### FR-08: Editing a saved workout

The user MUST be able to edit the actual recorded performance of a saved workout.

Editing MUST allow changes to actual weights and repetitions only.

The following MUST remain unchanged:

- Workout date.
- Routine name snapshot.
- Exercise names and order.
- Exercise notes snapshot.
- Planned sets, repetition range, and planned weight.
- Number of exercises and sets.

The same validation and transactional guarantees from recording MUST apply.

Saving an edit MUST return the user to Workout Detail with the updated values.

Editing a workout MUST NOT modify the source routine or its planned configuration.

### FR-09: Workout History

Workout History MUST be a secondary stack screen opened from the Home `Actividad` section through `Ver historial`.

It MUST show only saved workouts, never scheduled routines that have not been recorded.

Items MUST be ordered from most recent to oldest and grouped by month.

Each item MUST show:

- Workout date.
- Routine name from the snapshot.
- A concise summary of exercises and sets.

Selecting an item MUST open Workout Detail.

When no saved workouts exist, the screen MUST show a clear empty state in Spanish.

Loading and persistence errors MUST be shown with retry options where appropriate.

### FR-10: Home Activity summary

The Home `Actividad` section MUST show the number of saved workouts in the visible month and provide access to Workout History through `Ver historial`.

When the visible month has no saved workouts, the section MUST show a Spanish empty message while keeping `Ver historial` available.

The summary MUST be calculated from saved workouts only. Scheduled routines and planned targets MUST NOT count as completed training.

### FR-11: Draft lifecycle

A workout draft MUST remain in memory while the recording screen is active.

The draft MUST NOT be persisted across application restarts.

Leaving the recording screen MUST discard the draft immediately without a confirmation dialog.

An unfinished draft MUST NOT appear in history, count towards activity, or affect any derived data.

Starting a new recording after discarding a draft MUST create a new snapshot from the current routine configuration.

### FR-12: Local persistence and integrity

Workout data MUST be stored in local SQLite storage and remain available after application restarts.

The application MUST remain usable without an Internet connection.

The persistence layer MUST enforce at most one saved workout per routine and date.

Routine edits MUST NOT rewrite saved workout snapshots.

Routine deletion MUST NOT cascade-delete workouts, workout exercises, sets, or historical snapshots.

All persisted weights MUST use kilograms.

Workout dates MUST use the application's date-only representation and MUST NOT shift across time zones.

Stable identifiers MUST be used for workouts, workout exercises, and sets.

### FR-13: User-facing language and accessibility

Every user-facing message MUST be written in Spanish, including labels, buttons, validation, empty states, errors, confirmations, and accessibility labels.

Code, identifiers, comments, tests, and technical documentation MUST remain in English.

Interactive controls MUST have clear accessibility labels and usable touch targets.

## 5. Acceptance Criteria

### AC-01: Start a workout from Home

**Given** a routine is scheduled for today or a past date,

**When** the user selects that date on Home and taps `Registrar mi entrenamiento`,

**Then** the recording screen MUST open with the routine snapshot and the selected date.

**And** no workout MUST be saved until the user completes and saves the recording.

### AC-02: Block future recording

**Given** the user selects a future date,

**When** a routine is scheduled for that date,

**Then** the Home card MUST NOT offer `Registrar mi entrenamiento`.

### AC-03: Preserve the snapshot

**Given** a recording is in progress,

**When** the source routine is edited,

**Then** the captured snapshot MUST remain unchanged.

**When** the source routine is deleted before saving,

**Then** the workout MUST NOT be saved and the pending recording MUST be cancelled.

### AC-04: Validate all sets

**Given** a workout recording is open,

**When** any planned set has missing or invalid repetitions,

**Then** the workout MUST NOT be saved and the invalid fields MUST show Spanish validation feedback.

### AC-05: Save atomically

**Given** all sets contain valid actual values,

**When** the user saves the workout,

**Then** the workout, exercises, and sets MUST be persisted together.

**And** if persistence fails, no partial workout data MUST remain and the draft MUST remain available for retry.

### AC-06: Open Workout Detail after saving

**Given** a workout was saved successfully,

**When** the save completes,

**Then** Workout Detail MUST open with the saved values and no success snackbar.

### AC-07: Enforce one workout per routine and date

**Given** a saved workout exists for a routine and date,

**When** the user returns to Home for that date,

**Then** the routine card MUST show `Ver entrenamiento`.

**And** starting a second workout for the same routine and date MUST be rejected.

### AC-08: Show previous performance

**Given** the same exercise name exists in an earlier saved workout,

**When** the user records or edits that exercise,

**Then** the previous result MUST show its date, weights, and repetitions.

**And** matching MUST ignore leading/trailing whitespace and letter case.

### AC-09: Show historical detail

**Given** a saved workout exists,

**When** the user opens Workout Detail,

**Then** the screen MUST show the historical snapshot and actual performance, including the exercise, set, and repetition summary.

**And** deleting or editing the source routine MUST NOT change that detail.

### AC-10: Edit actual performance

**Given** a saved workout is open,

**When** the user edits its actual weights or repetitions and saves,

**Then** only actual performance data MUST change.

**And** the date, planned snapshot, exercise order, and set count MUST remain unchanged.

### AC-11: Browse history

**Given** saved workouts exist,

**When** the user opens `Ver historial` from Home,

**Then** workouts MUST appear newest first, grouped by month, using historical routine names.

**And** selecting one MUST open its Workout Detail.

### AC-12: Show activity and calendar state

**Given** saved workouts exist in the visible month,

**When** Home loads,

**Then** the `Actividad` section MUST show the monthly count and `Ver historial`.

**And** dates with saved workouts MUST be visually distinguishable from dates with scheduled routines.

### AC-13: Preserve data across restarts

**Given** a workout was saved successfully,

**When** the application is closed and reopened,

**Then** the workout and its historical snapshot MUST remain available.

### AC-14: Work offline

**Given** the device has no Internet connection,

**When** the user records, saves, views, or edits a workout,

**Then** the operation MUST complete locally and persist after restarting the application.

### AC-15: Discard the draft directly

**Given** the user has entered actual values in a recording,

**When** they leave the recording screen without saving,

**Then** the draft MUST be discarded immediately without a confirmation dialog.

**And** no workout, exercise, or set data MUST be created.

### AC-16: Use Spanish copy

**Given** any workout screen or interaction,

**When** the application shows user-facing text,

**Then** every visible message MUST be written in Spanish.

## 6. Dependencies and Assumptions

- `specs/001-routines/spec.md` defines routine configuration, scheduling, and Home entry points.
- `docs/architecture/database.md` defines the workout, workout exercise, and set persistence model.
- `docs/desing/screens.md` defines Record Workout, Workout Detail, Workout History, Home activity, and calendar presentation.
- `docs/desing/design-system.md` defines visual and component conventions.
- Every recorded routine contains at least one exercise, as guaranteed by the routines feature.
- Weight unit selection remains deferred to the Profile feature; workout weights are stored and displayed in kilograms.
- Progression charts, personal records, and recommendations are not implemented here. Later features consume saved workouts as their source of historical performance.

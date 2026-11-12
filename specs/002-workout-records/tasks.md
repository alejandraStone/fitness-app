# Tasks: Workout Records

## Preconditions

- `specs/002-workout-records/spec.md` and `specs/002-workout-records/plan.md` are the source of truth.
- Routines and scheduling from `specs/001-routines/` are implemented.
- Complete tasks in dependency order. Home integration is intentionally placed after the workout routes because its actions open them.
- Work on one task at a time and mark it complete only after its verification criteria pass.

## Phase 1 — Domain

### T001 — Define workout domain models

- Define workout, workout exercise, workout set, workout summary, recording context and previous-performance models.
- Define stable workout, workout exercise and workout set identifiers.
- Reuse `DateOnly`, `Timestamp` and `RoutineId` from the routines domain.
- Keep the models independent of React Native and SQLite.
- Add the public domain exports.

**Depends on:** None.

**Verify:** Models represent the saved workout, historical snapshot and actual performance requirements without adding out-of-scope fields.

**Status:** Completed (2026-11-02). Added `src/domain/workouts/models.ts` with the workout, exercise, set, summary, recording-context and previous-performance models, stable identifiers, routines type reuse and public exports. The domain `WorkoutRepository` port is included; no React Native or SQLite imports were added.

### T002 — Implement actual-performance and snapshot validation

- Validate actual weight as a non-negative number and repetitions as a positive integer.
- Reject empty repetitions and empty weights.
- Require exactly one valid recorded set per planned set.
- Reject set-count mismatches and added or removed exercise entries. Preserve every configured exercise entry, including entries that share a name.
- Build snapshot exercises from routine configuration without mutating the routine.
- Return Spanish validation messages.
- Add unit tests for valid input, invalid input and boundary cases.

**Depends on:** T001.

**Verify:** Tests cover zero kilograms, negative weight, missing repetitions, missing sets, extra sets and changed exercise counts.

**Status:** Completed (2026-11-02). Added immutable snapshot construction and actual-performance validation with Spanish messages. Unit tests cover valid values, zero kilograms, negative and empty weights, missing and invalid repetitions, missing and extra sets, malformed entries and changed exercise counts.

### T003 — Implement matching, previous performance and summaries

- Implement exercise-name normalization using trimming, Unicode composition and case-insensitive comparison.
- Select the previous result by normalized name across all saved workouts.
- Use the latest workout date strictly before the selected date, then the latest `savedAt`, then a deterministic tie-breaker.
- Exclude the workout being edited.
- Calculate exercise count, total sets and total repetitions for a saved workout.
- Add unit tests for matching, tie-breaking, exclusion and summary counts.

**Depends on:** T001.

**Verify:** Tests prove that whitespace and letter case do not affect matching, same-date workouts use the latest saved record, and summaries match the saved data.

**Status:** Completed (2026-11-02). Added exercise-name normalization, previous-performance selection with date, `savedAt` and identifier tie-breaking, draft exclusion and saved-workout summaries. Unit tests cover whitespace, case, Unicode composition, strict date ordering, duplicate names and summary counts.

## Phase 2 — SQLite Persistence

### T004 — Add workout persistence migration

- Add append-only migration version 3 named `add_workout_saved_at_and_uniqueness`.
- Add `saved_at TEXT` to `workouts` and backfill existing development rows deterministically from their date.
- Create a unique index on `workouts (routine_id, date)`.
- Create an index supporting date-ordered history and month queries.
- Do not rebuild the `workouts` table or modify released migrations.
- Update migration tests and expected indexes.

**Depends on:** T001.

**Verify:** A new database migrates to version 3, the unique constraint rejects a duplicate routine/date pair, and the migration fails safely without deleting data when existing duplicates are found.

**Status:** Completed (2026-11-02). Added append-only migration 3 `add_workout_saved_at_and_uniqueness`: `saved_at` backfilled from each workout date, a unique index on `(routine_id, date)` and a `(date DESC, saved_at DESC)` history index. Migration tests cover the new schema, index set, backfill, duplicate rejection and transactional rollback that preserves version 2 data when duplicates block the upgrade. Full suite: 34 suites / 211 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T005 — Implement workout creation and detail repository

- Implement `SqliteWorkoutRepository` creation and detail reads.
- Insert the workout, ordered exercises and ordered sets in one transaction.
- Map database rows to the domain models.
- Return exercises ordered by position and sets ordered by set number.
- Implement lookup by workout ID and by routine/date.
- Map the unique routine/date violation to a domain-level duplicate failure.
- Add repository tests.

**Depends on:** T004, T001.

**Verify:** A workout with multiple exercises and sets is created and read back in order; a duplicate routine/date fails without partial data; SQLite remains inside the data layer.

**Status:** Completed (2026-11-02). Added `SqliteWorkoutRepository` with transactional creation, ordered exercise and set reads, lookup by workout ID and routine/date, and mapping of the SQLite routine/date unique violation to `DuplicateWorkoutError`. Repository tests cover ordered round-trips, missing lookups, composite uniqueness and transaction rollback. Full suite: 35 suites / 216 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T006 — Implement actual-performance updates

- Update only actual set weights and repetitions for an existing workout.
- Run the update in a transaction.
- Verify that each set belongs to the specified workout exercise.
- Preserve the date, routine snapshot, exercise snapshots, order and planned values.
- Reject unknown workouts or mismatched set ownership.
- Add repository tests.

**Depends on:** T005.

**Verify:** Editing actual values changes only `sets` data; snapshots and dates remain byte-for-byte unchanged; failed updates leave the original values intact.

**Status:** Completed (2026-11-02). Added transactional `updateActualSets` to `SqliteWorkoutRepository`. It verifies the workout exists, every exercise belongs to it and every set belongs to its workout exercise before updating only `weight_kg` and `reps`. Tests cover actual-only edits with deliberately changed snapshot fields, snapshot/date preservation, unknown workouts, cross-workout set and exercise ownership, and rollback after a partial update. Full suite: 35 suites / 220 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T007 — Implement summary and previous-performance reads

- Implement aggregate workout summaries for full history and for a calendar month.
- Order summaries by workout date descending, then `saved_at` descending.
- Use a month date range from the first day of the month to the first day of the next month.
- Implement previous-performance candidates strictly before a selected date.
- Order candidates by date and save timestamp so the application can select the latest match.
- Add repository tests.

**Depends on:** T005.

**Verify:** History and month queries return the correct counts and order; same-date workouts are ordered by `saved_at`; previous candidates exclude the selected date and the edited workout when requested.

**Status:** Completed (2026-11-02). Added aggregate summary reads for full history and half-open date ranges, ordered by workout date and `saved_at` descending. Added previous-performance candidate reads strictly before the selected date, with newest-first ordering and optional exclusion of the edited workout; candidates return complete saved workouts for application-level name matching. Repository tests cover aggregate counts, same-date `saved_at` ordering, month boundaries, exclusion and strict date filtering. Full suite: 35 suites / 223 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T008 — Verify workout persistence integrity

- Add integration tests for transaction rollback, duplicate prevention and ordered reads.
- Verify that routine edits do not rewrite workout snapshots.
- Verify that routine deletion does not delete workouts, workout exercises, sets or snapshots.
- Verify that saved workouts survive a database close and reopen.
- Update existing direct-SQL workout fixtures for `saved_at` where ordering is asserted.
- Confirm no foreign key is added from `workouts.routine_id` to routines.

**Depends on:** T005, T006, T007.

**Verify:** AC-03, AC-05, AC-07 and AC-13 persistence behavior is covered by real SQLite integration tests.

**Status:** Completed (2026-11-02). Added real-SQLite persistence integration tests for rollback after a child set fails, duplicate routine/date rejection without partial data, ordered exercise/set reads from unordered input, snapshot preservation across routine edits, workout preservation after routine deletion, and workout/snapshot persistence across a database close and reopen. Updated the existing direct-SQL historical-preservation fixture to include `saved_at` and verify it remains unchanged. The existing migration test confirming `PRAGMA foreign_key_list('workouts')` is empty remains in place. Full suite: 36 suites / 228 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

## Phase 3 — Application and Composition

### T009 — Implement recording preparation use case

- Validate the requested date and reject future dates.
- Confirm the routine exists and is effectively scheduled through recurring weekdays, a one-time assignment, or both.
- Return the existing saved workout when the routine/date pair is already recorded.
- Build the recording context from the current routine.
- Load previous performances strictly before the selected date.
- Add dependency-injected tests for the current date and all failure paths.

**Depends on:** T003, T005.

**Verify:** AC-01, AC-02 and AC-08 application behavior passes, including future, unscheduled, missing-routine and already-saved cases.

**Status:** Completed (2026-11-02). Added `prepareWorkoutRecording` with injected `today`, routine and scheduling repositories. It validates the date, rejects future dates before loading data, rejects missing or unscheduled routines, returns an existing saved workout instead of starting a duplicate recording, builds the immutable snapshot from the current routine, and loads previous performances strictly before the selected date aligned with context exercise order. Added application error codes and Spanish messages. Tests cover current and past dates, recurring and one-time scheduling, invalid and future dates, missing and unscheduled routines, existing workouts, and normalized previous-performance matching. Full suite: 37 suites / 235 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T010 — Implement save-workout use case

- Validate the captured snapshot and actual values.
- Confirm the source routine still exists before saving.
- Return a recoverable cancellation result if the routine was deleted during recording.
- Reject a second workout for the same routine and date with a Spanish message.
- Generate workout, exercise and set identifiers and the save timestamp.
- Persist the complete workout through one repository transaction.
- Add unit and integration tests.

**Depends on:** T009, T005.

**Verify:** AC-03, AC-05 and AC-07 pass; a failed save creates no partial data and leaves the draft available for retry.

**Status:** Completed (2026-11-09). Added `saveWorkout` with actual-performance validation against the captured snapshot, source-routine existence checking, recoverable cancellation when the routine was deleted during recording, Spanish duplicate handling, identifier and save-timestamp generation, and transactional persistence through the captured snapshot. `save-workout.test.ts` covers valid saves, invalid values, deleted routines, duplicates and recoverable persistence failures. `save-workout.integration.test.ts` uses real SQLite to cover complete round-trips, duplicate preservation, deleted-routine cancellation, snapshot preservation after a routine edit, full rollback when a child set insert fails and a successful retry from the same captured context. Full suite: 39 suites / 245 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T011 — Implement detail and edit-context use cases

- Return the complete saved workout for Workout Detail.
- Return the saved workout plus previous performances for editing.
- Exclude the current workout from previous-performance search.
- Handle missing workouts without exposing persistence errors.
- Add tests for deleted source routines and missing workout identifiers.

**Depends on:** T005.

**Verify:** Detail remains readable after the source routine is deleted, and edit context returns only earlier workouts.

**Status:** Completed (2026-11-10). Added `getWorkoutDetail` for complete snapshot reads and `getWorkoutEditingContext` for the saved workout plus aligned previous performances. The editing context excludes the current workout and only uses earlier saved workouts. Tests cover complete reads, missing identifiers, workouts whose source routine was deleted, current-workout exclusion, aligned earlier results and persistence-error translation. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T012 — Implement update-workout-actuals use case

- Allow changes only to actual weights and repetitions.
- Reject changes to date, routine snapshot, exercise identity, order, set count or planned configuration.
- Validate all sets before updating.
- Return the updated workout.
- Add unit tests for valid edits, missing workouts, invalid values and structural changes.

**Depends on:** T011.

**Verify:** AC-10 application behavior passes and no snapshot field can be changed through the edit path.

**Status:** Completed (2026-11-10). Added `updateWorkoutActuals`, which loads the persisted workout, rejects every structural change to identifiers, date, routine snapshot, exercise order and planned configuration, validates actual values with the domain rules and calls the transactional actual-only repository update. Tests cover valid edits, missing workouts, invalid values, read/write persistence failures and each structural field. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T013 — Implement history and monthly-summary use cases

- Return all saved-workout summaries newest first.
- Return summaries for the visible Home month.
- Keep scheduled routines out of both results.
- Handle empty databases and invalid month input.
- Add unit tests for ordering, month boundaries and empty results.

**Depends on:** T005, T007.

**Verify:** History and Home activity receive saved workouts only; month queries include the first and last day of the month and exclude adjacent months.

**Status:** Completed (2026-11-10). Added `listWorkoutHistory` and `listWorkoutsByMonth` with a shared application-layer ordering rule. History returns saved workouts newest first with deterministic tie-breaking; month queries canonicalize any valid date to the half-open range from the first day to the first day of the next month and never include scheduled routines. Tests cover ordering, ties, empty results, both month boundaries, adjacent months, December rollover, invalid months and persistence errors. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T014 — Compose workout services with the existing database

- Extract `createRoutineServices(database)` from the current singleton.
- Add `createWorkoutServices(database)`.
- Add a single application-services composition that opens one SQLite connection and composes both service groups.
- Keep the existing provider as the initialization boundary.
- Preserve `useRoutineServices()` for current screens and add `useWorkoutServices()`.
- Keep the retryable initialization error state.

**Depends on:** T009, T010, T011, T012, T013.

**Verify:** Existing routine screens continue to work; workout screens can call the new services; only one database connection is opened; a failed initialization can retry.

**Status:** Completed (2026-11-10). Extracted `createRoutineServices(database)` and added `createWorkoutServices(database)`. `getAppServices()` opens `openAppDatabase()` once, shares that connection with both service factories and caches the promise; failed initialization clears the cache so the provider can retry. The existing provider exposes `useRoutineServices()` and the new `useWorkoutServices()` while preserving its loading and retryable error states. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

## Phase 4 — Shared Workout Presentation

### T015 — Add workout formatting and read-only entities

- Add formatting for workout dates and summary labels.
- Implement the `N ejercicios · N series` history summary.
- Add a read-only workout exercise/set view for Workout Detail.
- Add summary statistics for exercise count, total sets and total repetitions.
- Use existing Spanish date and weight formatting conventions.
- Add unit tests for formatting functions.

**Depends on:** T001.

**Verify:** Formatting handles singular/plural values, decimals and zero kilograms; all visible copy is Spanish.

**Status:** Completed (2026-11-09). Added `src/entities/workout/` formatting for full Spanish workout dates, exercise and repetition counts, recorded-set performance and the `N ejercicios · N series` history summary. Added reusable read-only exercise/set cards for Workout Detail and a summary statistics view for exercise count, total sets and total repetitions. Formatting reuses the existing calendar, weight, repetition and set conventions. Unit tests cover singular/plural labels, decimals, zero kilograms, recorded sets and a complete Spanish date. Full suite: 41 suites / 253 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T016 — Add workout form value conversion

- Keep actual weights and repetitions as text while the user edits.
- Convert and validate values only on submit.
- Treat empty repetitions as invalid.
- Treat empty or non-numeric weight as invalid.
- Preserve field paths for inline feedback.
- Add unit tests for valid and invalid raw values.

**Depends on:** T002.

**Verify:** Form conversion delegates authoritative rules to the domain validator and never silently converts missing repetitions to zero.

**Status:** Completed (2026-11-09). Added `validateWorkoutFormValues` under `src/features/workout-recording/`. Weight and repetition text stays raw while editing and is converted only when the form is submitted. Empty values become `undefined` and non-numeric values become `NaN`, so the domain validator rejects them explicitly; missing repetitions are never converted to zero. Validation delegates to `validateWorkoutPerformance`, which remains the single owner of the authoritative rules and field paths. Unit tests cover valid decimal and zero weights, empty and non-numeric weights, empty, non-integer and zero repetitions, and exercise/set count mismatches.

### T017 — Build shared recording components

- Add one set input row with independent weight and repetitions fields.
- Add the previous-performance display for an exercise.
- Add the exercise recording card showing planned sets, repetition range, planned weight, notes and all set rows.
- Use existing `AppTextInput`, `Card`, theme tokens and accessibility conventions.
- Do not add controls for adding, removing or skipping sets or exercises.
- Keep components free of persistence access and workflow ownership.

**Depends on:** T015, T016.

**Verify:** Components render planned and actual values correctly, expose accessible field labels and cannot change the number of sets.

**Status:** Completed (2026-11-09). Added `SetInputRow`, `PreviousPerformanceView` and `ExerciseRecordingCard` under `src/features/workout-recording/`. The exercise card shows the captured plan, notes and previous result, and renders exactly one controlled weight/repetition row per planned set using `AppTextInput`, `Card` and theme tokens. Inputs expose Spanish set-specific accessible labels, field errors use the domain field paths, and the components contain no add, remove or skip controls and no persistence or workflow logic. The feature is exported through its public index. Full suite: 41 suites / 253 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

## Phase 5 — Workout Detail

### T018 — Implement the Workout Detail read view

- Add `src/app/workouts/[id]/index.tsx` and register the `Entrenamiento` stack title.
- Load the saved workout through the application layer.
- Show workout date, routine-name snapshot, ordered exercises, notes, planned targets and actual sets.
- Show exercise count, total sets and total repetitions.
- Show loading, not-found and error states.
- Do not show a delete action, editable date or progression placeholder.
- Add Spanish accessibility labels.

**Depends on:** T011, T014, T015.

**Verify:** AC-09 passes for a saved workout, including after its source routine is edited or deleted. The edit action is added in T024.

**Status:** Completed (2026-11-10). Added `WorkoutDetailView`, the `workouts/[id]/index` route and the `Entrenamiento` stack title. Detail loads the saved workout through `getWorkoutDetail`, reloads on focus, shows the historical date, routine name, ordered exercises, notes, planned targets, actual sets and exercise/set/repetition totals, and provides Spanish loading, not-found and retryable error states. It exposes no delete action, date editing or progression placeholder; the edit action was added separately in T024. The application detail test confirms the record stays readable after its source routine is deleted. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

## Phase 6 — Workout History

### T019 — Implement Workout History

- Add `src/app/workouts/history.tsx` and register the `Historial de entrenamientos` stack title.
- Load saved-workout summaries through the application layer.
- Order workouts newest first and group them by month.
- Show date, historical routine name and `N ejercicios · N series` for each item.
- Open Workout Detail when an item is selected.
- Show Spanish loading, empty and error states with retry.
- Never show scheduled routines that have not been saved.

**Depends on:** T013, T015, T018.

**Verify:** AC-11 passes, including empty history, month grouping and opening a saved workout.

**Status:** Completed (2026-11-10). Added `WorkoutHistoryList`, the `groupWorkoutsByMonth` helper, the `workouts/history` route and the `Historial de entrenamientos` stack title. History loads saved summaries through `listWorkoutHistory`, reloads on focus, groups months newest first, shows the date, historical routine name and `N ejercicios · N series` per item, opens Workout Detail on selection and provides Spanish loading, empty and retryable error states. Only persisted workouts are rendered; scheduled routines never enter this flow. Grouping tests cover ordering, month boundaries, empty input and invalid dates. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

## Phase 7 — Recording

### T020 — Add the recording route and context loading

- Add `src/app/workouts/record.tsx` and register the `Registrar entrenamiento` stack title.
- Read the routine identifier and Home-selected date from navigation parameters.
- Load the recording context through the application layer.
- Show loading, invalid-date, unscheduled, missing-routine and error states.
- Open the existing Workout Detail when the routine/date pair is already saved.
- Do not add a date picker to the recording screen.

**Depends on:** T009, T014, T018.

**Verify:** AC-01, AC-02 and AC-07 navigation behavior passes. Opening recording and leaving without saving creates no workout.

**Status:** Completed (2026-11-10). Added the `workouts/record` route and the `Registrar entrenamiento` stack title. The route reads the routine identifier and Home-selected date from navigation parameters, loads the immutable context through `prepareWorkoutRecording`, shows Spanish loading, invalid-date, unscheduled, missing-routine and retryable error states, and replaces itself with the existing Workout Detail when the routine/date pair is already saved. No date picker or other recording entry point was added; leaving without saving performs no persistence write. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T021 — Implement the recording form

- Render all exercises in snapshot order and all planned sets.
- Show exercise name, notes, planned sets, repetition range and planned weight.
- Prefill actual weight from planned weight and leave repetitions empty.
- Show previous performance when available.
- Allow independent weight and repetition edits.
- Prevent adding, removing or skipping exercises or sets.
- Validate every set inline before saving.
- Keep all copy and accessibility labels in Spanish.

**Depends on:** T017, T020.

**Verify:** AC-03, AC-04 and AC-08 pass. A workout with any missing or invalid repetitions cannot be saved, and actual values never update the routine.

**Status:** Completed (2026-11-10). Added the shared `WorkoutRecordingForm` with one controlled weight/repetition row per planned set in snapshot order. It shows exercise names, notes, planned sets, repetition ranges and planned weight, prefills actual weight from the plan, leaves repetitions empty, displays previous performances when available and provides Spanish inline field feedback. The form cannot add, remove or skip exercises or sets, and validation delegates to the domain rules only on submit. Tests cover raw-value conversion and every invalid/valid case. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T022 — Implement save, duplicate handling and errors

- Add the `Guardar` recording action with loading state.
- Prevent duplicate submissions.
- Save through the application use case.
- Show inline Spanish errors when saving fails and keep the draft available.
- Cancel and inform the user if the source routine was deleted.
- On success, replace the recording route with the saved Workout Detail.
- Do not show a success snackbar.

**Depends on:** T010, T021.

**Verify:** AC-05 and AC-06 pass. A failed save leaves no partial data; a successful save opens detail without a back path to the draft.

**Status:** Completed (2026-11-10). Added the `Guardar` header action with loading and disabled states and a synchronous duplicate-submission guard. Saving uses `saveWorkout` with the captured context, keeps the draft and shows inline Spanish errors when persistence fails, and cancels the recording with a Spanish explanation when the source routine was deleted. On success the recording route is replaced with the saved Workout Detail, with no success snackbar. Existing save unit and real-SQLite integration tests cover atomicity, duplicate preservation, deleted-routine cancellation and retry from the same draft. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

### T023 — Enforce the draft lifecycle

- Keep the draft only in component memory.
- Discard it immediately when leaving by back navigation, gesture or hardware back.
- Do not show a discard confirmation dialog.
- Ensure unfinished drafts never appear in history, activity or persistence.
- Create a fresh snapshot every time recording starts again.
- Guard against leaving while a save is in progress.

**Depends on:** T020, T021.

**Verify:** AC-15 passes. Leaving after entering values creates no workout and shows no confirmation; reopening starts from the current routine configuration.

**Status:** Completed (2026-11-10). The recording draft lives only in the route component's memory; no draft data is written before a successful save. Leaving by header back, gesture or hardware back discards it immediately without a confirmation dialog. `usePreventRemove` blocks route removal while a save is in progress, and every mount loads a fresh snapshot from the current routine configuration. Full suite: 47 suites / 288 tests pass; type checking passes and lint reports only the pre-existing `MonthlyCalendar.tsx` warning.

## Phase 8 — Editing

### T024 — Implement the edit route and form

- Add `src/app/workouts/[id]/edit.tsx` and register the `Editar entrenamiento` stack title.
- Add the edit action to Workout Detail.
- Load the editing context through the application layer.
- Prefill actual weights and repetitions from the saved workout.
- Show previous performance excluding the current workout.
- Reuse the shared recording form and validation.
- Prevent changes to date, snapshot, exercise order, planned values and set count.

**Depends on:** T011, T017, T021, T018.

**Verify:** AC-10 input behavior passes; only actual weights and repetitions are editable, and a deleted source routine does not block editing.

**Status:** Completed (2026-11-12). Added the `workouts/[id]/edit` route and the `Editar entrenamiento` stack title. Workout Detail exposes the edit action, which loads the saved record through `getWorkoutEditingContext`. The edit form reuses `WorkoutRecordingForm`, prefills actual weights and repetitions, shows previous performances excluding the current workout, and rebuilds the immutable context from the persisted snapshot so date, routine name, exercise order, planned values and set count cannot change. Exact structural changes remain rejected by `updateWorkoutActuals`. Verified in the web build at a mobile viewport, including editing after the source routine was deleted. Full suite: 47 suites / 291 tests pass.

### T025 — Save edits and refresh detail

- Save actual values through the application layer.
- Prevent duplicate submissions.
- Show inline Spanish validation and persistence errors.
- Return to Workout Detail on success.
- Reload detail on focus so updated values appear immediately.
- Do not show a success snackbar.

**Depends on:** T012, T024.

**Verify:** AC-10 passes end-to-end; updated values persist, and the date, snapshot and set count remain unchanged.

**Status:** Completed (2026-11-12). Saving edits uses `updateWorkoutActuals` with a synchronous duplicate-submission guard, applies inline Spanish validation and persistence errors, and returns to Workout Detail on success. Detail reloads on focus, so updated values appear immediately without a success snackbar. Verified end-to-end in the web build: actual weights and repetitions changed, the date, routine and exercise snapshots, planned values and set count stayed unchanged, and the edited values survived a browser restart.

## Phase 9 — Home Integration

### T026 — Load workouts for Home

- Load the monthly schedule and saved-workout summaries for the visible month.
- Preserve existing Home data while refreshing after a secondary screen closes.
- Build lookup data for the selected date, routine cards and calendar markers.
- Handle schedule, workout and combined loading or error states without fake data.
- Refresh Home after recording, saving or editing.

**Depends on:** T013, T014, T018, T019, T020.

**Verify:** Home receives saved workouts for the visible month and selected date; scheduled routines remain separate; retry works after a persistence failure.

**Status:** Completed (2026-11-12). Home loads the monthly schedule and saved-workout summaries concurrently with `Promise.allSettled`, preserves visible data while refreshing after a secondary screen closes, and exposes independent schedule/workout loading and retryable error states. Selected-date lookup maps saved workouts by routine/date for the card actions, while month counts feed the calendar and activity section. Scheduled routines remain a separate dataset and are never counted as completed workouts. Verified in the web build after returning from recording and editing, including month changes and empty months.

### T027 — Implement Home card workout states

- Show `Registrar mi entrenamiento` for eligible today/past routines without a saved workout.
- Show `Ver entrenamiento` when a saved workout exists for the routine and date.
- Hide the recording action completely for future dates.
- Open the recording route for a new workout and Workout Detail for an existing one.
- Keep tapping the card itself opening Routine Detail.
- Remove the `Próximamente` dialog and placeholder behavior.
- Keep all copy in Spanish.

**Depends on:** T026, T018, T020.

**Verify:** AC-01, AC-02 and AC-07 Home behavior passes; no second recording can start for the same routine/date.

**Status:** Completed (2026-11-12). Scheduled routine cards show `Registrar mi entrenamiento` for eligible today or past dates without a saved workout and `Ver entrenamiento` when the routine/date pair is already saved. Future dates render no workout action, tapping the card still opens Routine Detail, and the old `Próximamente` placeholder is absent. Opening a saved workout uses Workout Detail; the recording route also redirects to the existing workout if the pair is opened again. Verified in the web build for past, current and future dates.

### T028 — Distinguish saved workouts on the calendar

- Add a saved-workout marker to the monthly calendar.
- Use a visual treatment distinct from the scheduled-routine marker.
- Show both states when a date has scheduled routines and a saved workout.
- Show saved workouts even when their source routine is no longer scheduled or has been deleted.
- Include both counts in the calendar accessibility label.

**Depends on:** T026.

**Verify:** AC-12 calendar behavior passes and the states are distinguishable without relying on color alone.

**Status:** Completed (2026-11-12). The calendar renders a small primary dot for scheduled routines and a separate sage bar for saved workouts, showing both when a date has both states. A legend labels `Rutina programada` and `Entrenamiento guardado`, and accessibility labels include both counts. Saved workouts keep their marker after the source routine is no longer scheduled or is deleted. Verified in the web build before and after routine deletion, including selected and unselected dates.

### T029 — Add the Home Activity summary

- Add the `Actividad` section below the selected-date section.
- Show the number of saved workouts in the visible month.
- Count workouts, not scheduled routines, planned sessions or calendar days.
- Show a Spanish empty message when the month has none.
- Keep `Ver historial` available in both populated and empty states.
- Open Workout History through `Ver historial`.

**Depends on:** T013, T019, T026.

**Verify:** AC-12 activity behavior passes; changing months updates the count; opening history shows all saved workouts.

**Status:** Completed (2026-11-12). Home renders `Actividad` below the selected-date section with the visible month's saved-workout count, a Spanish empty message when the month has none, and `Ver historial` in both states. The count derives only from saved-workout summaries, never from scheduled routines, planned sessions or calendar days. Verified in the web build for an empty month, a populated month and month navigation, with `Ver historial` opening the full saved-workout history.

## Phase 10 — Documentation and Verification

### T030 — Update architecture and design documentation

- Update `docs/architecture/database.md` with `saved_at`, the unique routine/date rule and previous-performance ordering.
- Update `docs/desing/screens.md` to remove Workout Records placeholders and document Home activity, recording, detail, editing and history.
- Update `docs/desing/design-system.md` with the saved-workout calendar marker, activity summary and workout presentation rules.
- Update `specs/002-workout-records/tasks.md` statuses as tasks complete.
- Do not leave conflicting statements about fake activity data or the `Próximamente` action.

**Depends on:** T026, T027, T028, T029.

**Verify:** Documentation matches the implemented screens and persistence behavior and contains no superseded rules.

**Status:** Completed (2026-11-12). Updated `docs/architecture/database.md` with `saved_at`, the unique routine/date rule, the history index and previous-performance ordering. Updated `docs/desing/screens.md` with Home activity, card workout states, calendar markers, recording, detail, editing and history behavior, and removed the superseded Workout Records placeholders. Updated `docs/desing/design-system.md` with the saved-workout calendar marker, activity summary and workout presentation rules. Confirmed no remaining statements describe fake activity data or a `Próximamente` recording action.

### T031 — Run automated checks

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm test -- --runInBand`.
- Run `npx expo export --platform web`.
- Resolve new errors and warnings introduced by this feature.
- Report pre-existing failures separately instead of claiming they passed.

**Depends on:** T001–T030.

**Verify:** Commands complete successfully or every remaining failure is documented as pre-existing and unrelated.

**Status:** Completed (2026-11-12). Ran `npm run typecheck` (pass), `npm run lint` (pass, no warnings), `npm test -- --runInBand` (47 suites / 291 tests pass) and `npx expo export --platform web` (successful export). No new errors or warnings remain.

### T032 — Verify the web flows at a mobile viewport

- Record a workout from a current or past Home date.
- Confirm a future date has no recording action.
- Confirm leaving a draft discards it without confirmation.
- Confirm previous performance ignores case and surrounding whitespace.
- Save and open Workout Detail.
- Confirm the card changes to `Ver entrenamiento` and opening it shows the same workout.
- Confirm a second recording for the same routine/date is impossible.
- Edit actual values and confirm the snapshot and date do not change.
- Confirm Home activity, card state and calendar markers refresh.
- Open Workout History, browse months and open a workout.
- Delete a source routine and confirm its workouts remain.
- Confirm all visible copy is Spanish.

**Depends on:** T031.

**Verify:** AC-01 through AC-12 and AC-15 pass in the web build at a mobile viewport with no browser errors.

**Status:** Completed (2026-11-12). Verified the web build at a 390×844 mobile viewport with headless Chrome. Confirmed: recording from a past and the current Home date; no recording action on a future date; draft discard on back navigation without a confirmation or persisted workout; previous performance matching across case differences, with whitespace normalization additionally covered by the domain tests; saving and opening Workout Detail; the Home card changing to `Ver entrenamiento`; editing only actual values with unchanged date and snapshot; Home activity and calendar markers refreshing; history grouped by month and opening detail; workouts remaining after deleting the source routine; editing after routine deletion; persistence across a browser restart; and Spanish copy throughout. The export had already completed successfully and the exercised screens produced no runtime failures.

### T033 — Verify native iOS and Android flows

- Exercise recording, validation, saving, detail, editing and history on both platforms.
- Verify keyboard behavior for set inputs and safe areas on secondary screens.
- Verify back navigation discards drafts and rows remain usable on small screens.
- Verify date-only behavior and previous performance.
- Verify offline operation, application restart and local persistence.
- Verify accessibility labels, touch targets, calendar state descriptions and screen-reader focus.
- Record device and OS versions and any remaining gaps.

**Depends on:** T031.

**Verify:** AC-13, AC-14 and AC-16 pass on iOS and Android, or remaining device-specific gaps are explicitly documented.

**Status:** Blocked (2026-11-12). Native iOS and Android verification could not be performed in this environment: no physical device, simulator, emulator or platform tooling is available (`adb`, `emulator` and `xcrun` are not installed). Automated tests and the web verification cover the shared recording, validation, saving, detail, editing, history and Spanish-copy behavior, but the following device-specific checks remain outstanding: keyboard behavior and safe areas on set inputs, native back navigation and gesture draft discard, row usability on small native screens, date-only and previous-performance behavior on device, offline operation and restart persistence on device, and accessibility labels, touch targets, calendar descriptions and screen-reader focus.

### T034 — Review scope and architecture

- Confirm every acceptance criterion in `spec.md` is satisfied or explicitly reported as blocked.
- Confirm one SQLite connection and no direct database access from UI components.
- Confirm workout snapshots survive routine edits and deletion.
- Confirm one workout per routine/date is enforced by SQLite.
- Confirm no progression charts, personal records, free workouts, workout deletion, editable date, weight-unit selection or global exercise catalog were added.
- Confirm no backend, authentication, cloud storage, synchronization or new dependency was introduced.
- Update task statuses and report remaining work, limitations and blockers.

**Depends on:** T032, T033.

**Verify:** Workout Records is complete within the approved V1 scope.

**Status:** Completed (2026-11-12). Scope and architecture review completed. Every acceptance criterion is covered by automated tests and/or the web verification, except the native device checks documented as blocked in T033. Confirmed one SQLite connection shared by routine and workout services, no database or repository access from `src/app` or `src/features`, historical snapshots surviving routine edits and deletion, the SQLite unique routine/date constraint, and no out-of-scope progression charts, personal records, free workouts, workout deletion, editable date, weight-unit selection or global exercise catalog. No backend, authentication, cloud storage, synchronization or new dependency was introduced. The only remaining work is the native iOS/Android verification listed in T033.

## Deferred Work

### Progression charts, personal records and recommendations

- Deferred to the Progression feature.
- Workout Records provides saved historical data only; it must not contain progression placeholders or recommendations.

### Free workouts and workout deletion

- Deferred by product decision and out of scope for V1.
- Recording starts only from a scheduled routine, and Workout Detail has no delete action.

### Editable workout date and weight-unit selection

- Deferred. The workout date is fixed after saving, and weights remain stored and entered in kilograms until Profile is implemented.

### Global exercise catalog

- Deferred. Exercise identity for previous-performance matching remains based on user-defined name snapshots.

## Execution Rules

- Complete tasks in order unless a dependency clearly requires a different sequence.
- Work on one task at a time.
- Before each task, consult `spec.md`, `plan.md`, the architecture documents and the relevant design documents.
- Implement only what the current task requires.
- Add or update tests alongside implementation.
- Run relevant checks before marking a task complete.
- Do not mark a task complete while its verification criteria remain unverified.
- Stop and report contradictions or missing requirements instead of silently changing the specification.
- Do not add success snackbars, fake activity data, progression placeholders or workout deletion.

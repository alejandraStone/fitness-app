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

**Status:** Pending.

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

**Status:** Pending.

### T003 — Implement matching, previous performance and summaries

- Implement exercise-name normalization using trimming, Unicode composition and case-insensitive comparison.
- Select the previous result by normalized name across all saved workouts.
- Use the latest workout date strictly before the selected date, then the latest `savedAt`, then a deterministic tie-breaker.
- Exclude the workout being edited.
- Calculate exercise count, total sets and total repetitions for a saved workout.
- Add unit tests for matching, tie-breaking, exclusion and summary counts.

**Depends on:** T001.

**Verify:** Tests prove that whitespace and letter case do not affect matching, same-date workouts use the latest saved record, and summaries match the saved data.

**Status:** Pending.

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

**Status:** Pending.

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

**Status:** Pending.

### T006 — Implement actual-performance updates

- Update only actual set weights and repetitions for an existing workout.
- Run the update in a transaction.
- Verify that each set belongs to the specified workout exercise.
- Preserve the date, routine snapshot, exercise snapshots, order and planned values.
- Reject unknown workouts or mismatched set ownership.
- Add repository tests.

**Depends on:** T005.

**Verify:** Editing actual values changes only `sets` data; snapshots and dates remain byte-for-byte unchanged; failed updates leave the original values intact.

**Status:** Pending.

### T007 — Implement summary and previous-performance reads

- Implement aggregate workout summaries for full history and for a calendar month.
- Order summaries by workout date descending, then `saved_at` descending.
- Use a month date range from the first day of the month to the first day of the next month.
- Implement previous-performance candidates strictly before a selected date.
- Order candidates by date and save timestamp so the application can select the latest match.
- Add repository tests.

**Depends on:** T005.

**Verify:** History and month queries return the correct counts and order; same-date workouts are ordered by `saved_at`; previous candidates exclude the selected date and the edited workout when requested.

**Status:** Pending.

### T008 — Verify workout persistence integrity

- Add integration tests for transaction rollback, duplicate prevention and ordered reads.
- Verify that routine edits do not rewrite workout snapshots.
- Verify that routine deletion does not delete workouts, workout exercises, sets or snapshots.
- Verify that saved workouts survive a database close and reopen.
- Update existing direct-SQL workout fixtures for `saved_at` where ordering is asserted.
- Confirm no foreign key is added from `workouts.routine_id` to routines.

**Depends on:** T005, T006, T007.

**Verify:** AC-03, AC-05, AC-07 and AC-13 persistence behavior is covered by real SQLite integration tests.

**Status:** Pending.

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

**Status:** Pending.

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

**Status:** Pending.

### T011 — Implement detail and edit-context use cases

- Return the complete saved workout for Workout Detail.
- Return the saved workout plus previous performances for editing.
- Exclude the current workout from previous-performance search.
- Handle missing workouts without exposing persistence errors.
- Add tests for deleted source routines and missing workout identifiers.

**Depends on:** T005.

**Verify:** Detail remains readable after the source routine is deleted, and edit context returns only earlier workouts.

**Status:** Pending.

### T012 — Implement update-workout-actuals use case

- Allow changes only to actual weights and repetitions.
- Reject changes to date, routine snapshot, exercise identity, order, set count or planned configuration.
- Validate all sets before updating.
- Return the updated workout.
- Add unit tests for valid edits, missing workouts, invalid values and structural changes.

**Depends on:** T011.

**Verify:** AC-10 application behavior passes and no snapshot field can be changed through the edit path.

**Status:** Pending.

### T013 — Implement history and monthly-summary use cases

- Return all saved-workout summaries newest first.
- Return summaries for the visible Home month.
- Keep scheduled routines out of both results.
- Handle empty databases and invalid month input.
- Add unit tests for ordering, month boundaries and empty results.

**Depends on:** T005, T007.

**Verify:** History and Home activity receive saved workouts only; month queries include the first and last day of the month and exclude adjacent months.

**Status:** Pending.

### T014 — Compose workout services with the existing database

- Extract `createRoutineServices(database)` from the current singleton.
- Add `createWorkoutServices(database)`.
- Add a single application-services composition that opens one SQLite connection and composes both service groups.
- Keep the existing provider as the initialization boundary.
- Preserve `useRoutineServices()` for current screens and add `useWorkoutServices()`.
- Keep the retryable initialization error state.

**Depends on:** T009, T010, T011, T012, T013.

**Verify:** Existing routine screens continue to work; workout screens can call the new services; only one database connection is opened; a failed initialization can retry.

**Status:** Pending.

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

**Status:** Pending.

### T016 — Add workout form value conversion

- Keep actual weights and repetitions as text while the user edits.
- Convert and validate values only on submit.
- Treat empty repetitions as invalid.
- Treat empty or non-numeric weight as invalid.
- Preserve field paths for inline feedback.
- Add unit tests for valid and invalid raw values.

**Depends on:** T002.

**Verify:** Form conversion delegates authoritative rules to the domain validator and never silently converts missing repetitions to zero.

**Status:** Pending.

### T017 — Build shared recording components

- Add one set input row with independent weight and repetitions fields.
- Add the previous-performance display for an exercise.
- Add the exercise recording card showing planned sets, repetition range, planned weight, notes and all set rows.
- Use existing `AppTextInput`, `Card`, theme tokens and accessibility conventions.
- Do not add controls for adding, removing or skipping sets or exercises.
- Keep components free of persistence access and workflow ownership.

**Depends on:** T015, T016.

**Verify:** Components render planned and actual values correctly, expose accessible field labels and cannot change the number of sets.

**Status:** Pending.

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

**Status:** Pending.

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

**Status:** Pending.

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

**Status:** Pending.

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

**Status:** Pending.

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

**Status:** Pending.

### T023 — Enforce the draft lifecycle

- Keep the draft only in component memory.
- Discard it immediately when leaving by back navigation, gesture or hardware back.
- Do not show a discard confirmation dialog.
- Ensure unfinished drafts never appear in history, activity or persistence.
- Create a fresh snapshot every time recording starts again.
- Guard against leaving while a save is in progress.

**Depends on:** T020, T021.

**Verify:** AC-15 passes. Leaving after entering values creates no workout and shows no confirmation; reopening starts from the current routine configuration.

**Status:** Pending.

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

**Status:** Pending.

### T025 — Save edits and refresh detail

- Save actual values through the application layer.
- Prevent duplicate submissions.
- Show inline Spanish validation and persistence errors.
- Return to Workout Detail on success.
- Reload detail on focus so updated values appear immediately.
- Do not show a success snackbar.

**Depends on:** T012, T024.

**Verify:** AC-10 passes end-to-end; updated values persist, and the date, snapshot and set count remain unchanged.

**Status:** Pending.

## Phase 9 — Home Integration

### T026 — Load workouts for Home

- Load the monthly schedule and saved-workout summaries for the visible month.
- Preserve existing Home data while refreshing after a secondary screen closes.
- Build lookup data for the selected date, routine cards and calendar markers.
- Handle schedule, workout and combined loading or error states without fake data.
- Refresh Home after recording, saving or editing.

**Depends on:** T013, T014, T018, T019, T020.

**Verify:** Home receives saved workouts for the visible month and selected date; scheduled routines remain separate; retry works after a persistence failure.

**Status:** Pending.

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

**Status:** Pending.

### T028 — Distinguish saved workouts on the calendar

- Add a saved-workout marker to the monthly calendar.
- Use a visual treatment distinct from the scheduled-routine marker.
- Show both states when a date has scheduled routines and a saved workout.
- Show saved workouts even when their source routine is no longer scheduled or has been deleted.
- Include both counts in the calendar accessibility label.

**Depends on:** T026.

**Verify:** AC-12 calendar behavior passes and the states are distinguishable without relying on color alone.

**Status:** Pending.

### T029 — Add the Home Activity summary

- Add the `Actividad` section below the selected-date section.
- Show the number of saved workouts in the visible month.
- Count workouts, not scheduled routines, planned sessions or calendar days.
- Show a Spanish empty message when the month has none.
- Keep `Ver historial` available in both populated and empty states.
- Open Workout History through `Ver historial`.

**Depends on:** T013, T019, T026.

**Verify:** AC-12 activity behavior passes; changing months updates the count; opening history shows all saved workouts.

**Status:** Pending.

## Phase 10 — Documentation and Verification

### T030 — Update architecture and design documentation

- Update `docs/architecture/database.md` with `saved_at`, the unique routine/date rule and previous-performance ordering.
- Update `docs/desing/screens.md` to remove Workout Records placeholders and document Home activity, recording, detail, editing and history.
- Update `docs/desing/design-system.md` with the saved-workout calendar marker, activity summary and workout presentation rules.
- Update `specs/002-workout-records/tasks.md` statuses as tasks complete.
- Do not leave conflicting statements about fake activity data or the `Próximamente` action.

**Depends on:** T026, T027, T028, T029.

**Verify:** Documentation matches the implemented screens and persistence behavior and contains no superseded rules.

**Status:** Pending.

### T031 — Run automated checks

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm test -- --runInBand`.
- Run `npx expo export --platform web`.
- Resolve new errors and warnings introduced by this feature.
- Report pre-existing failures separately instead of claiming they passed.

**Depends on:** T001–T030.

**Verify:** Commands complete successfully or every remaining failure is documented as pre-existing and unrelated.

**Status:** Pending.

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

**Status:** Pending.

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

**Status:** Pending.

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

**Status:** Pending.

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

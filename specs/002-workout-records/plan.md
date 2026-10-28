# Implementation Plan: Workout Records

## 1. Technical Approach

- Follow `docs/architecture/overview.md`, `docs/architecture/database.md`, `docs/architecture/frontend.md`, `docs/desing/screens.md` and `docs/desing/design-system.md`.
- Keep workout rules outside UI components. The Domain layer owns snapshots, actual-performance validation, previous-performance matching and workout summaries. The Application layer coordinates recording, saving, editing and history reads. SQLite remains behind repository interfaces.
- Reuse `DateOnly`, `Timestamp` and `RoutineId` from the routines domain instead of duplicating date or identifier primitives.
- Keep one SQLite connection for the application lifetime. Extract creation factories for routine and workout services, compose both in a single application-services boundary, and expose them through the existing provider. Do not open a second database connection for workouts.
- Use React Native Paper `5.15.3`, the shared theme and existing UI primitives. Do not install additional dependencies.
- Keep the recording draft in memory only. Leaving the recording screen discards it immediately without a confirmation dialog.
- Do not show success snackbars. Opening the saved Workout Detail is the success confirmation.
- Write code, identifiers, comments and tests in English. Every user-facing message is written in Spanish.

## 2. Architecture

### 2.1 Domain

Create `src/domain/workouts/` with:

- `models.ts`
  - `WorkoutId`, `WorkoutExerciseId` and `WorkoutSetId`.
  - `Workout`, containing the source routine ID, workout date, routine-name snapshot, save timestamp and ordered exercises.
  - `WorkoutExercise`, containing the exercise-name snapshot, order, planned sets, planned repetition range, planned weight, optional notes snapshot and recorded sets.
  - `WorkoutSet`, containing the set number, actual weight and actual repetitions.
  - `WorkoutSummary`, containing the identifiers and counts needed by Home and history.
  - `WorkoutRecordingContext`, representing the immutable snapshot used while recording.
  - `PreviousExercisePerformance`, containing the prior workout date and recorded sets.
- `validation.ts`
  - Normalize exercise names by trimming, normalizing Unicode composition and lower-casing. Use one helper for both saving and matching.
  - Validate actual weight as a non-negative number and repetitions as a positive integer.
  - Validate that every planned set has exactly one recorded set with valid values.
  - Validate that a recording has all planned exercises and does not add or remove exercises or sets.
  - Build workout snapshots from routine configuration without mutating the routine.
  - Calculate exercise count, total sets and total repetitions from a saved workout.
  - Select the previous performance by normalized exercise name, choosing the latest workout date strictly before the selected date, then the latest `savedAt`, then a deterministic identifier tie-breaker. Exclude the workout being edited.
- `workout-repository.ts`
  - Persistence port for creation, detail, lookup by routine and date, history summaries, monthly summaries, previous-performance candidates and actual-value updates.
  - Read models may expose only the columns required by each workflow.
- `index.ts`
  - Public exports for the workouts domain.

Add unit tests for normalization, set validation, snapshot construction, summary counts and previous-performance selection.

### 2.2 Application

Create `src/application/workouts/` with focused use cases:

- `prepare-workout-recording.ts`
  - Validate the requested date and reject future dates.
  - Confirm that the routine still exists and is effectively scheduled for the date through recurring weekdays or a one-time assignment.
  - Return the existing saved workout when the routine/date pair is already recorded.
  - Build the recording context from the current routine.
  - Load previous performances strictly before the selected date.
- `save-workout.ts`
  - Validate the captured snapshot and actual values.
  - Confirm that the source routine still exists. If it was deleted while recording, return a recoverable cancellation result.
  - Reject a second workout for the same routine and date with a clear Spanish message.
  - Persist the workout, exercises and sets through one repository transaction.
- `get-workout-detail.ts`
  - Return the complete historical workout or a not-found result.
- `get-workout-editing-context.ts`
  - Return the saved workout plus previous performances excluding the current workout.
- `update-workout-actuals.ts`
  - Allow changes only to actual weights and repetitions.
  - Reject changes to exercise identity, order, set count, planned values or workout date.
  - Update actual sets and return the updated workout.
- `list-workout-history.ts`
  - Return all saved-workout summaries newest first by date and save timestamp.
- `list-workouts-by-month.ts`
  - Return saved-workout summaries for the visible Home month using a date range from the first day of the month to the first day of the next month.

Use result objects with stable error codes and Spanish messages. Do not expose repository or SQLite errors to the UI.

Add use-case tests with in-memory fake repositories, plus integration tests against real SQLite where persistence behavior matters.

### 2.3 Persistence and migration

Add migration version 3, `add_workout_saved_at_and_uniqueness`:

- Add `saved_at TEXT` to `workouts`.
- Backfill existing rows deterministically from their date so legacy development data remains readable.
- Create a unique index on `workouts (routine_id, date)` to enforce the one-workout-per-routine-and-date rule.
- Create an index supporting month and history reads, for example `workouts (date DESC, saved_at DESC)`.
- Do not rebuild the `workouts` table; it is referenced by `workout_exercises` and a rebuild would create unnecessary foreign-key risk. The repository always writes `saved_at`, and the application validates it.
- Update `migrations.test.ts` expected indexes and any direct workout inserts in existing tests.

Create `src/data/workouts/sqlite-workout-repository.ts`:

- Insert the workout, ordered exercises and ordered sets in one transaction.
- Map a duplicate routine/date constraint to a domain-level duplicate failure.
- Load detail with exercises ordered by position and sets ordered by set number.
- Load summaries using aggregate queries rather than loading every set for list screens.
- Load previous-performance candidates for workouts strictly before a date, ordered by date and save timestamp, and let the application apply normalized-name matching. This keeps the normalization rule in one place and is sufficient for local V1 data volume.
- Update actual sets transactionally. Verify that each set belongs to the specified workout exercise and that no snapshot or date column is changed.
- Preserve workout history when a routine is edited or deleted. `workouts.routine_id` remains historical metadata without a foreign key.

Add persistence tests for transactions, uniqueness, ordering, actual-only edits, routine deletion, routine editing and restart persistence.

### 2.4 Composition and presentation

Refactor the composition boundary without changing existing routine screens:

- Extract `createRoutineServices(database)` from the current singleton.
- Add `createWorkoutServices(database)` in `src/composition/workout-services.ts`.
- Add `src/composition/app-services.ts` to open the database once, compose both service groups and cache initialization.
- Keep the existing provider as the single initialization boundary. Preserve `useRoutineServices()` for current screens and add `useWorkoutServices()`.
- Keep the retryable database-initialization error state.

Create the workout presentation modules:

- `src/entities/workout/`
  - Shared formatting for workout dates and summaries.
  - Read-only workout exercise and set display used by Workout Detail.
  - Workout summary statistics reused where appropriate.
- `src/features/workout-recording/`
  - Recording and editing form with one row per planned set.
  - Local text-to-number validation and inline field feedback.
  - Previous-performance display.
  - Shared form component for recording and editing, with different initial values and submit behavior.
- `src/features/workout-detail/`
  - Saved workout composition with date, routine snapshot, ordered exercises, actual sets, summary and edit action.
- `src/features/workout-history/`
  - Activity summary card for Home.
  - Grouped workout history list.

Create thin Expo Router routes:

- `src/app/workouts/record.tsx`
- `src/app/workouts/[id]/index.tsx`
- `src/app/workouts/[id]/edit.tsx`
- `src/app/workouts/history.tsx`

Register stack screens with Spanish titles:

- `Registrar entrenamiento`
- `Entrenamiento`
- `Editar entrenamiento`
- `Historial de entrenamientos`

## 3. Implementation Phases

### Phase 1 — Domain rules

- Create workout models, repository interfaces and validation.
- Implement normalized exercise-name matching and previous-performance selection.
- Implement workout summary calculation and snapshot construction.
- Add domain tests.
- No UI or SQLite changes in this phase.

### Phase 2 — Persistence

- Add migration version 3 and update migration tests.
- Implement `SqliteWorkoutRepository`.
- Implement transactional creation and actual-only updates.
- Add duplicate routine/date enforcement.
- Add persistence, ordering, historical-preservation and restart tests.
- Update existing direct-SQL workout fixtures to include `saved_at` where ordering matters.

### Phase 3 — Application workflows

- Implement recording preparation, save, detail, editing context, actual update, history and monthly summary use cases.
- Add result types and Spanish error messages.
- Add unit and integration tests for each use case.
- Compose workout services with the existing routine services and database connection.

### Phase 4 — Home integration

- Load the monthly schedule and saved-workout summaries for the visible month.
- Add a saved-workout lookup by selected date and routine.
- Render `Registrar mi entrenamiento` for eligible today/past routines without a saved workout.
- Render `Ver entrenamiento` for routines with a saved workout.
- Hide the recording action completely for future dates.
- Open the recording route only from the Home card.
- Remove the `Próximamente` dialog and placeholder behavior.
- Add the `Actividad` section with the visible-month saved-workout count and `Ver historial`. Count saved workouts, not scheduled routines or calendar days.
- Show a Spanish empty message for a month without saved workouts while keeping `Ver historial`.
- Add a distinct calendar marker for saved workouts, including workouts whose source routine is no longer scheduled or has been deleted. A date with both scheduled routines and saved workouts shows both markers.
- Include both routine and workout information in the calendar accessibility label.

### Phase 5 — Recording and editing UI

- Build the shared set-entry form with planned targets, actual value inputs and previous performance.
- Take the workout date from the Home selection; do not add a date picker to the recording screen.
- Prefill actual weight from planned weight and leave repetitions empty for recording.
- Prefill actual values from the saved workout for editing.
- Never write actual values back to the routine's planned configuration.
- Validate all sets inline before submitting.
- Keep the draft in component memory and discard it on exit without confirmation.
- Prevent duplicate submissions while saving.
- On a successful save, replace the recording route with Workout Detail.
- On a successful edit, return to Workout Detail and refresh it on focus.
- Show a recoverable Spanish error if the source routine was deleted before saving.
- Keep all user-facing copy in Spanish and all interactive controls accessible.

### Phase 6 — Detail and history

- Implement Workout Detail with the historical snapshot, actual sets, date, routine name and summary of exercise count, total sets and total repetitions.
- Implement the edit action without a delete action or editable date.
- Implement Workout History grouped by month and ordered newest first.
- Show `N ejercicios · N series` for each history item.
- Open Workout Detail from a history item.
- Show loading, empty, not-found and error states.
- Reload detail after an edit and Home after returning from a workout flow.

### Phase 7 — Documentation and verification

- Update `docs/architecture/database.md` with `saved_at`, the unique routine/date rule and previous-performance ordering.
- Update `docs/desing/screens.md` to remove the implementation placeholders and document workout activity, recording, detail and history behavior.
- Update `docs/desing/design-system.md` with the saved-workout calendar marker and activity summary presentation.
- Update task statuses in `specs/002-workout-records/tasks.md` as work completes.
- Run type checking, linting, automated tests and a web export.
- Verify the main flows manually on iOS and Android.

## 4. Testing Strategy

- Domain: name normalization, set validation, empty repetitions, negative weight, missing sets, extra sets, summary counts and previous-performance tie-breaking.
- Application: future-date rejection, unscheduled routine rejection, missing routine, existing workout, snapshot capture, successful save, transactional failure, actual-only edit, history ordering and monthly filtering.
- Persistence: migration v3, unique constraint, transaction rollback, duplicate handling, ordered reads, routine edit preservation, routine deletion preservation and persistence across restarts.
- Presentation helpers: numeric form conversion, grouping by month and summary labels.
- Manual flows:
  - Record from a past or current Home date.
  - Confirm a future date has no recording action.
  - Confirm leaving the recording screen discards the draft without confirmation.
  - Save and open Workout Detail.
  - Confirm the second attempt for the same routine/date opens the existing workout.
  - Confirm previous performance ignores case and surrounding whitespace.
  - Edit actual values and confirm the snapshot and date do not change.
  - Confirm Home card state, monthly activity count and calendar markers update on return.
  - Open history, browse months and open a workout.
  - Delete a routine and confirm its workouts remain available.
  - Restart the app and confirm saved workouts persist.
  - Run with no network connection.

## 5. Completion Criteria

- All acceptance criteria in `specs/002-workout-records/spec.md` pass.
- At most one saved workout exists per routine and date, enforced by SQLite.
- Historical snapshots remain unchanged by routine edits and routine deletion.
- Previous performance uses normalized exercise names and the documented recency rules.
- Recording and editing share consistent validation and transactional behavior.
- Workout Detail, Workout History and Home activity use saved workouts only.
- Future dates never expose the recording action.
- Drafts are never persisted and are discarded directly on exit.
- No success snackbars, delete action or progression placeholders are added.
- No UI component accesses SQLite or repositories directly.
- No backend, authentication, cloud storage, synchronization or new dependency is introduced.
- `npm run typecheck`, `npm run lint`, `npm test -- --runInBand` and `npx expo export --platform web` pass without new errors.

## 6. Dependencies and Risks

- The migration adds a unique index on existing development data. Any duplicate routine/date rows would make the migration fail safely; inspect the local database before applying it and never delete user data without authorization.
- Existing tests insert workouts directly with raw SQL. They must be updated for `saved_at` where ordering behavior is asserted.
- The recording save path must use the captured draft snapshot, not reload exercise configuration, or a routine edit during recording would violate the snapshot rule.
- The source routine must still exist when saving. Deleting it must cancel the pending recording without leaving partial data.
- Previous-performance matching is performed in the application layer for V1. If local workout volume grows enough to make candidate scans expensive, introduce a persisted normalized-name key and index in a later approved change.
- Workout dates must remain date-only values. Do not use local `Date` parsing for comparisons or month ranges.
- The saved-workout calendar marker changes the current single-dot calendar. Its visual treatment must be reflected in the design-system documentation.
- Native visual and interaction verification requires an available iOS or Android device and remains necessary after automated checks pass.

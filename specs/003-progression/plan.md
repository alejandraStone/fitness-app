# Implementation Plan: Progression

## 1. Technical Approach

- Follow `docs/architecture/overview.md`, `docs/architecture/database.md`, `docs/architecture/frontend.md`, `docs/desing/screens.md` and `docs/desing/design-system.md`.
- Keep recommendation rules in a new Domain module. The Application layer coordinates workout, routine and decision reads. SQLite remains behind repository interfaces.
- Store recommendations as derived data only. Persist only explicit keep-weight decisions, keyed by the stable workout exercise identifier.
- Reuse `normalizeExerciseName` and the existing workout recency ordering from the Workout Records domain. Export the recency helper instead of duplicating date, `savedAt` and identifier tie-breaking rules.
- Keep one SQLite connection for the application lifetime. Add Progression services to the existing application-services composition and provider.
- Present recommendations in Workout Detail through a presentation slot. The Workout Detail feature must not import the Progression feature directly; the route composes both features.
- Do not add recommendations to Home, Workout History, Record Workout, Routine Detail, Progress or Exercise Progress.
- Use existing React Native Paper components and design tokens. Do not install additional dependencies.
- Write code, identifiers, comments and tests in English. Every user-facing message is written in Spanish.

## 2. Architecture

### 2.1 Domain

Create `src/domain/progression/` with:

- `models.ts`
  - `ProgressionRecommendation`, containing:
    - `workoutExerciseId: WorkoutExerciseId`;
    - `exerciseName: string`;
    - `repetitions: number[]`, in ascending set-number order;
    - `plannedRepsMax: number`.
- `recommendations.ts`
  - `isQualifyingExercise(exercise)`:
    - `plannedWeightKg > 0`;
    - `sets.length === plannedSets`;
    - every set has `reps >= plannedRepsMax`.
  - `selectLatestExerciseSessions(workouts)`:
    - identity uses `normalizeExerciseName` (trim, Unicode NFC and lowercase);
    - only the newest workout per normalized name is retained;
    - ordering is `date DESC`, `savedAt DESC`, then workout identifier ascending;
    - within one workout, the exercise with the lowest `order` wins; equal order uses the lowest exercise identifier.
  - `findPendingRecommendations({ workout, workouts, routine, keepWeightDecisionIds })`:
    - evaluate exercises in the displayed workout's order;
    - require the displayed workout exercise to be the latest session for its normalized name;
    - require a qualifying exercise under `isQualifyingExercise`;
    - require the source routine to exist;
    - require exactly one current routine exercise with the same normalized name;
    - require exact numeric equality between the current `targetWeightKg` and the snapshot `plannedWeightKg`;
    - exclude workout exercise identifiers with a keep-weight decision;
    - return one recommendation per pending exercise.
  - No recommendation is produced when the current routine has zero or multiple matching exercises. Do not guess which entry the recommendation refers to.
- `progression-decision-repository.ts`
  - `findKeepWeightDecisionIds(workoutId): Promise<WorkoutExerciseId[]>`;
  - `saveKeepWeightDecision(workoutExerciseId, decidedAt): Promise<void>`.
- `index.ts`
  - Public exports for the progression domain.

Export the existing `isMoreRecentWorkout` helper from `src/domain/workouts/history.ts` and reuse it for latest-session selection. This is a visibility-only change; previous-performance behavior must not change.

Add unit tests for qualification, latest-session ordering, duplicate normalized names, routine matching, weight equality, keep-weight suppression and restored-weight eligibility.

### 2.2 Application

Create `src/application/progression/` with:

- `get-workout-progression.ts`
  - Load all saved workouts through `WorkoutRepository.findAll()`.
  - Locate the displayed workout in that collection. A missing workout is a load failure.
  - Load the source routine through `RoutineRepository.findById`. A missing routine is not an error; it produces no recommendations.
  - Load keep-weight decision identifiers for the displayed workout.
  - Delegate all eligibility and latest-session rules to `findPendingRecommendations`.
  - Return `{ ok: true, recommendations }` or `{ ok: false, errors }`.
- `keep-current-weight.ts`
  - Persist the decision with the current ISO timestamp.
  - Use an idempotent repository write so a repeated decision does not create a second row.
  - Return `{ ok: true }` or `{ ok: false, errors }`.
- `progression-errors.ts`
  - Stable codes for load failure and decision failure.
  - The decision failure message is exactly `No se pudo guardar tu decisión. Inténtalo de nuevo.`
  - Do not expose repository or SQLite details.
- Add unit tests with in-memory fake repositories for eligibility reads, missing routine, missing workout, persistence failure and decision success/failure.

### 2.3 Persistence and migration

Add append-only migration version 4, `add_progression_keep_weight_decisions`:

```sql
CREATE TABLE IF NOT EXISTS progression_keep_weight_decisions (
  workout_exercise_id TEXT PRIMARY KEY NOT NULL,
  decided_at TEXT NOT NULL,
  FOREIGN KEY (workout_exercise_id)
    REFERENCES workout_exercises(id) ON DELETE CASCADE
);
```

- The row itself represents the keep-weight decision; no redundant decision-type column is needed.
- `decided_at` stores the decision timestamp.
- The primary key prevents duplicate decisions for one workout exercise.
- Deleting a workout through an authorized internal operation cascades to its decisions. Editing actual workout values does not touch this table.

Add `findAll(): Promise<Workout[]>` to `WorkoutRepository` and `SqliteWorkoutRepository`:

- Return every saved workout with ordered exercises and sets.
- Order by `date DESC`, `saved_at DESC`, `id ASC`.
- Use it for derived Progression reads in V1.
- Update existing in-memory workout repository fakes to implement the new method.

Create `src/data/progression/sqlite-progression-decision-repository.ts`:

- Read decision identifiers by joining `progression_keep_weight_decisions` with `workout_exercises` on `workout_id`.
- Save with `INSERT ... ON CONFLICT (workout_exercise_id) DO NOTHING`.
- Keep all SQL inside the Data layer.

Update `migrations.test.ts` expected tables and version. Add persistence tests for:

- reading decisions only for the requested workout;
- duplicate decision writes;
- editing a workout preserving its decision;
- cascade deletion when the workout is deleted;
- persistence across a file-backed database restart.

### 2.4 Composition

- Add `src/composition/progression-services.ts` with `createProgressionServices(database)`.
- Expose:
  - `getWorkoutProgression(workoutId)`;
  - `keepCurrentWeight(workoutExerciseId)`.
- Reuse the existing `SqliteWorkoutRepository`, `SqliteRoutineRepository` and the new decision repository over the same open database.
- Extend `AppServices` in `src/composition/app-services.ts` with `progression`.
- Add `useProgressionServices()` to the existing `RoutineServicesProvider`. Keep the existing provider name and database-initialization error handling.
- Do not open a second SQLite connection.

### 2.5 Presentation

Create `src/features/progression/` with:

- `ProgressionRecommendationCard.tsx`
  - One `Card` with a `trending-up` icon, the title `Progresión` and the message `Has alcanzado el máximo en estas series. Puedes considerar subir el peso.`
  - One row per recommendation formatted as `{exercise name} · {reps joined with " / "} (objetivo {plannedRepsMax})`.
  - A card-level `Revisar peso` action using `AppButton` variant `primary`.
  - One `Mantener peso` action per row using `AppButton` variant `secondary`.
  - An inline `ErrorBanner` with the exact decision failure message when persistence fails.
  - A busy state that disables card actions and shows loading on the affected `Mantener peso` button.
  - No modal, dialog, snackbar, badge or success confirmation.
  - No empty card, placeholder or section when there are no pending recommendations.
  - Use `colors.sageSoft` for the card surface and `colors.sage` for the icon. Do not use warning or destructive colors.
  - Keep touch targets at least 44 logical pixels by using `AppButton`.
  - The title uses `accessibilityRole="header"`. The message is normal accessible text. Each row’s text carries the full accessibility label; do not group the card into one accessible element that hides the action buttons.
- `recommendation-format.ts`
  - Pure helpers for the row label and accessibility label.
  - Row accessibility label: `{exerciseName}: {reps joined with ", "} repeticiones. Objetivo {plannedRepsMax} repeticiones.`
  - `Mantener peso` accessibility label: `Mantener el peso de {exerciseName}`.
  - `Revisar peso` accessibility label: `Revisar el peso planificado en la rutina`.
- `index.ts`
  - Public export for the Workout Detail route.
- Add tests for formatting and accessibility copy.

Modify `src/features/workout-detail/WorkoutDetailView.tsx`:

- Accept an optional `progressionCard?: ReactNode` prop.
- Render it after the summary card and before the `Ejercicios` section.
- Do not import progression domain or feature code.

Modify `src/app/workouts/[id]/index.tsx`:

- Load Workout Detail and Progression on every focus.
- Hide the recommendation card while progression is refreshing so a routine or workout edit cannot leave a stale card visible. Clear the previous decision error when recommendations refresh.
- A progression load failure must leave Workout Detail usable and omit the card. Do not show a separate loading or error state for evaluation.
- `Revisar peso` opens `/routines/[id]` for `workout.routineId`. It must not open `routines/[id]/edit`, change the routine or resolve the recommendation.
- `Mantener peso` calls `keepCurrentWeight`, removes the affected row immediately on success and clears any previous decision error. Clear the previous decision error when a new attempt starts.
- On failure, keep the card and row visible, show `No se pudo guardar tu decisión. Inténtalo de nuevo.` and allow retry.
- Prevent duplicate decision submissions while a decision is being saved.
- Do not show a success snackbar.
- Do not change Home, Workout History, Record Workout, Routine Detail, Progress or Exercise Progress.

## 3. Implementation Phases

### Phase 1 — Domain rules

- Create progression models, repository port and recommendation rules.
- Reuse exercise-name normalization and export the workout recency helper.
- Add domain tests for qualification, latest-session scope, duplicate names, routine matching, weight equality and decisions.
- No UI or SQLite changes in this phase.

### Phase 2 — Persistence

- Add migration version 4 and the keep-weight decision table.
- Add `WorkoutRepository.findAll` and the SQLite implementation.
- Implement `SqliteProgressionDecisionRepository`.
- Update migration tests and existing workout repository fakes.
- Add repository, cascade, edit-preservation and restart tests.

### Phase 3 — Application and composition

- Implement `getWorkoutProgression` and `keepCurrentWeight`.
- Add progression error types with the exact Spanish decision message.
- Add `ProgressionServices`, compose them in `app-services.ts` and expose `useProgressionServices`.
- Add application tests with fake repositories.

### Phase 4 — Workout Detail presentation

- Build the recommendation card and formatting helpers.
- Add the optional card slot to `WorkoutDetailView`.
- Wire Workout Detail to load, refresh, keep weight and open Routine Detail.
- Cover the hidden state, multiple rows, busy state and persistence error.
- Verify that the card appears between the summary and `Ejercicios`, and that no other screen changes.

### Phase 5 — Documentation and verification

- Update `docs/architecture/database.md` with the decision table, relationship and deletion policy, and clarify that recommendations remain derived.
- Update `docs/desing/screens.md` with the Workout Detail recommendation card and narrow the remaining progression presentation decision to Progress and Home.
- Update `docs/desing/design-system.md` with the recommendation card’s calm sage presentation and action hierarchy.
- Update `specs/003-progression/tasks.md` statuses as work completes.
- Run type checking, linting, the automated test suite and a web export.
- Verify the main flows manually at 390×844 and, when available, on an iOS or Android device.

## 4. Testing Strategy

- Domain:
  - all sets at the maximum and above the maximum qualify;
  - any set below the maximum, a set-count mismatch or zero planned weight does not qualify;
  - latest session ordering uses `date`, `savedAt` and identifier tie-breaking;
  - a newer non-qualifying session suppresses an older qualifying recommendation;
  - duplicate normalized names select only the lowest-order exercise;
  - trim, case and Unicode normalization match routine and workout names;
  - missing routine, zero matches, multiple matches or a weight difference hide the recommendation;
  - restoring the snapshot weight makes the recommendation eligible again;
  - a keep-weight decision suppresses only its workout exercise;
  - a newer workout creates a new recommendation despite older decisions.
- Application:
  - eligible recommendation results;
  - empty results for every resolution condition;
  - missing workout and read failure;
  - decision persistence and exact failure message.
- Persistence:
  - migration v4 schema and version;
  - decision rows scoped to a workout;
  - duplicate writes remain one row;
  - editing a workout preserves its decision;
  - cascade deletion;
  - file-backed persistence across restart;
  - `findAll` ordering and completeness.
- Presentation helpers:
  - row formatting with spaces around `/`;
  - objective text;
  - accessibility labels include name, repetitions and planned maximum.
  - Do not add a UI testing dependency; cover presentation helpers with unit tests and verify the card states manually, consistent with the existing project test setup.
- Manual flows:
  - save a qualifying workout and confirm the card appears between the summary and `Ejercicios`;
  - confirm no card appears when no exercise qualifies;
  - confirm a newer session hides the older workout’s recommendation;
  - confirm multiple exercises render as separate rows in one card;
  - tap `Mantener peso`, confirm the row disappears immediately, restart and confirm it remains hidden;
  - tap `Revisar peso`, confirm Routine Detail opens without data changes;
  - change the planned weight, return and confirm the card disappears;
  - restore the snapshot weight and confirm the card is eligible again;
  - edit a workout below the maximum and confirm the card disappears; edit it back and confirm it returns unless a decision exists;
  - delete the source routine and confirm no recommendation is shown;
  - run without network access;
  - verify Spanish copy, accessibility labels and 44-pixel touch targets.
- Commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm test -- --runInBand`
  - `npx expo export --platform web`

## 5. Completion Criteria

- All acceptance criteria in `specs/003-progression/spec.md` pass.
- The recommendation card appears only in Workout Detail, only for pending recommendations.
- Only the latest session per normalized exercise name can produce a recommendation.
- Eligibility uses the saved workout snapshot and actual repetitions only.
- The current routine must exist, match exactly one exercise by normalized name and preserve the snapshot planned weight with exact numeric equality.
- Only keep-weight decisions are persisted; recommendations are never duplicated in the database.
- `Mantener peso` hides the row immediately and survives restarts.
- `Revisar peso` opens Routine Detail without changing data.
- Decision failures keep the row visible and show the exact Spanish message.
- No automatic weight changes, specific increments, modals, snackbars, badges, Home content or Progress content are introduced.
- No UI component accesses SQLite or repositories directly.
- No backend, authentication, cloud storage, synchronization or new dependency is introduced.
- `npm run typecheck`, `npm run lint`, `npm test -- --runInBand` and `npx expo export --platform web` pass without new errors.
- Native iOS/Android verification is completed when a suitable device or emulator is available; otherwise the blocked status is documented explicitly.

## 6. Dependencies and Risks

- Latest-session evaluation loads all saved workouts in V1, consistent with existing previous-performance candidate reads. This is acceptable for personal local data volume. Add a persisted normalized-name key and index only in a later approved change if volume requires it.
- `findAll` performs per-workout exercise and set reads. Keep it simple for V1; do not introduce a second read model or cache without measured need.
- Weight equality must use exact comparison of stored numeric values, never formatted text. Editing and restoring the same value must restore eligibility.
- Duplicate exercise names inside a routine or workout must hide the recommendation rather than choosing an arbitrary entry.
- The card must be hidden while recommendations refresh to avoid showing stale data after a routine edit.
- A routine can be deleted after the card loads. `Revisar peso` may then open Routine Detail with its existing not-found handling; no special fallback is required.
- The migration must remain append-only and must not modify or reset existing data.
- Native visual and interaction verification remains necessary after automated checks pass and may be blocked when no device or emulator is available.

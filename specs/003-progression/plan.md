# Implementation Plan: Progression

## 1. Technical Approach

- Follow `docs/architecture/overview.md`, `docs/architecture/database.md`, `docs/architecture/frontend.md`, `docs/desing/screens.md` and `docs/desing/design-system.md`.
- Keep recommendation rules in a new Domain module. The Application layer coordinates workout, routine and decision reads. SQLite remains behind repository interfaces.
- Store recommendations as derived data only. Persist only explicit keep-weight decisions, keyed by the stable workout exercise identifier.
- Reuse `normalizeExerciseName` and the existing workout recency ordering from the Workout Records domain. Export the recency helper instead of duplicating date, `savedAt` and identifier tie-breaking rules.
- Keep one SQLite connection for the application lifetime. Add Progression services to the existing application-services composition and provider.
- Present recommendations in Workout Detail through a presentation slot. The Workout Detail feature must not import the Progression feature directly; the route composes both features.
- Do not add recommendations to Home, Workout History, Record Workout, Routine Detail, Progress or Exercise Progress.
- Reuse existing React Native Paper components and design tokens. The approved redesign adds `react-native-svg` for bundled original illustrations and Nunito font files; no gradient, illustration or UI-testing dependency is added.
- Write code, identifiers, comments and tests in English. Every user-facing message is written in Spanish.

## 2. Architecture

### 2.1 Domain

Create `src/domain/progression/` with:

- `models.ts`
  - `ProgressionRecommendation`, containing:
    - `workoutExerciseId: WorkoutExerciseId`;
    - `routineExerciseId: RoutineExerciseId`, the unique current routine entry;
    - `exerciseName: string`;
    - `repetitions: number[]`, in ascending set-number order;
    - `plannedRepsMax: number`;
    - `plannedWeightKg: number`, captured in the workout snapshot.
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

- `ProgressionSection.tsx`
  - One `Tu progresión` block with the shared progress badge and heading, placed between the workout hero and the exercise list.
  - A single recommendation uses the full prototype-style lavender card: sparkles, trophy, exercise-name tag, current planned weight, `¡Superaste tu meta!`, a lime `Objetivo cumplido` indicator with text and a short explanation with the recorded repetitions and target.
  - Multiple recommendations use one compact lavender header with the trophy, `¡Superaste tus metas!`, the number of exercises and one short explanation. Each recommendation is a white expandable row showing the exercise name, `Objetivo cumplido`, recorded repetitions, current weight and an expand control. Expanding reveals the three actions without repeating the long explanation.
  - `Aumentar peso` uses the shared `AppButton` primary variant; `Mantener peso` uses the `outline` variant; `Decidir después` is a text action.
  - No recommendation renders no block at all. Do not implement an empty message or placeholder.
  - Inline `ErrorBanner` for the exact keep-weight failure message; busy state disables actions.
  - No success snackbar or badge.
  - Keep touch targets at least 44 logical pixels.
  - Each card or row exposes its expanded state and a full accessibility label including name, current weight, repetitions, target and objective fulfilment.
- `IncreaseWeightDialog.tsx`
  - In-app Paper dialog with the current weight, an empty `Nuevo peso (kg)` field, `Cancelar` and `Guardar peso`.
  - The app never pre-fills or suggests an increment.
  - Field validation is Spanish and requires a finite value greater than the current weight.
  - Persistence failures stay in the dialog with `No se pudo actualizar el peso. Inténtalo de nuevo.`
- `increase-weight-form.ts`
  - Pure validation helper for the manually entered weight, with unit tests.
- `recommendation-format.ts`
  - Pure helpers for readable repetition lists, objective text, row accessibility labels and action labels.
- `index.ts`
  - Public exports for the Workout Detail route.
- Add tests for formatting, accessibility copy and manual-weight validation.

Modify `src/entities/workout/WorkoutStatsView.tsx` and `WorkoutExerciseView.tsx`:

- Keep one blush statistics strip with rose icons and the exercise, set and repetition totals.
- Render each exercise as a white, rounded card with an original thumbnail, name, planned set count, repetition range and used weight.
- Show a factual completion pill such as `3 de 3 series` or `2 de 3 series`, using the positive lime only when all planned sets are recorded.
- Expand the card to show its snapshot note and one aligned row per recorded set.
- Do not duplicate progression actions or content in exercise cards.

Modify `src/features/workout-detail/WorkoutDetailView.tsx`:

- Compose the celebratory hero, one statistics strip, the progression slot and the exercise cards over the illustrated backdrop.
- Use the original dumbbell illustration, `¡Entrenamiento completado!`, one supportive subtitle and the workout date.
- Keep the final `Finalizar` action in a sticky footer above the bottom safe area, using the `dark` variant and a lime check.
- Accept an optional `progressionSection?: ReactNode`; keep the workout feature independent from progression domain and feature imports.

Add `src/features/workout-detail/WorkoutDetailHeader.tsx`, `WorkoutSummaryIllustrations.tsx` and `src/entities/workout/ExerciseThumbnailIllustration.tsx`, plus `src/shared/ui/CelebrationIllustrations.tsx` and `src/shared/ui/theme.ts` tokens/fonts. Load Nunito in `src/app/_layout.tsx` before rendering the app.

Modify `src/app/workouts/[id]/index.tsx`:

- Hide the native header for this route, render the in-screen header inside a safe-area container and keep the back action behavior unchanged.
- Load Workout Detail and Progression on every focus.
- Omit the progression block while it is refreshing so a routine or workout edit cannot leave stale data visible. Clear the previous decision error when recommendations refresh.
- A progression load failure must leave Workout Detail usable and omit the block. Do not show a separate loading or error state for evaluation.
- `Aumentar peso` closes over the recommendation, opens the dialog and on confirmation loads a fresh routine through `useRoutineServices`, then calls the existing `saveRoutineExercise` with every current field and the user-entered `targetWeightKg`.
- Remove the recommendation immediately after a successful update. Never modify the workout snapshot.
- `Mantener peso` calls `keepCurrentWeight`, removes the affected recommendation immediately on success and clears any previous decision error.
- `Decidir después` only collapses the card or row inside `ProgressionSection`; it persists nothing.
- On keep-weight failure, keep the recommendation visible and show `No se pudo guardar tu decisión. Inténtalo de nuevo.`
- Prevent duplicate submissions while an operation is being saved.
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

- Build the `Tu progresión` block with the single full card, shared multi header and expandable rows, the increase dialog and formatting helpers.
- Redesign the workout summary with the illustrated backdrop, custom header, celebratory hero, blush statistics strip, date and exercise cards.
- Add the original dumbbell, trophy, progress badge, sparkle and exercise-thumbnail illustrations with `react-native-svg`.
- Add the optional progression slot to `WorkoutDetailView`.
- Wire Workout Detail to load, refresh, keep weight, postpone locally and update the routine weight manually.
- Cover the no-recommendation state, single recommendation, multiple recommendations, busy state and persistence errors.
- Verify that exercise cards do not duplicate recommendation actions and that no other screen changes.

### Phase 5 — Documentation and verification

- Update `docs/architecture/database.md` with the decision table, relationship and deletion policy, and clarify that recommendations remain derived.
- Update `docs/desing/screens.md` with the final Workout Detail composition and progression interactions.
- Update `docs/desing/design-system.md` with the palette, Nunito typography, illustrations, card composition and action variants.
- Update `specs/003-progression/tasks.md` statuses as work completes.
- Run type checking, linting, the automated test suite and a web export.
- Verify the main flows interactively at 393×852, including responsive checks at 360×740 and 320×640.
- Verify on an iOS or Android device or emulator when available; otherwise document the blocker.

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
  - readable repetition lists and objective text;
  - accessibility labels include name, current weight, repetitions and planned maximum;
  - manual weight validation accepts increases and rejects empty, invalid or non-increasing values.
  - Do not add a UI testing dependency; cover presentation helpers with unit tests and verify the block states interactively, consistent with the existing project test setup.
- Manual flows:
  - save a qualifying workout and confirm the celebratory hero, statistics strip, date and `Tu progresión` block render between the header and the exercise cards;
  - confirm one pending recommendation uses the full trophy card;
  - confirm no pending recommendation renders no progression block or empty hint;
  - confirm a newer session hides the older workout’s recommendation;
  - confirm multiple recommendations share one header and render separate expandable rows;
  - confirm exercise cards show planned sets/reps, used weight and per-set results, and do not repeat recommendation actions;
  - confirm incomplete exercise data shows the recorded set count, `Sin peso registrado` where applicable and no recommendation;
  - tap `Mantener peso`, confirm the recommendation disappears immediately, restart and confirm it remains hidden;
  - tap `Aumentar peso`, confirm the dialog starts empty and rejects values at or below the current weight;
  - enter a higher weight, confirm the routine changes only in its planned weight and the recommendation disappears;
  - reload Workout Detail and confirm the workout snapshot is unchanged;
  - tap `Decidir después` and confirm the card or row collapses and remains pending on the next visit;
  - restore the snapshot weight and confirm the recommendation is eligible again;
  - edit a workout below the maximum and confirm the block disappears; edit it back and confirm it returns unless a decision exists;
  - delete the source routine and confirm no recommendation is shown;
  - verify the layout at 393×852, 360×740 and 320×640 without horizontal overflow;
  - verify `Finalizar` navigates back and falls back to Workout History;
  - run without network access;
  - verify Spanish copy, accessibility labels and 44-pixel touch targets.
- Commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm test -- --runInBand`
  - `npx expo export --platform web`

## 5. Completion Criteria

- All acceptance criteria in `specs/003-progression/spec.md` pass.
- The `Tu progresión` block appears only in Workout Detail, only for pending recommendations, and is omitted entirely when none exist.
- One pending recommendation renders the full card; multiple pending recommendations share one header and render separate expandable rows.
- Only the latest session per normalized exercise name can produce a recommendation.
- Eligibility uses the saved workout snapshot and actual repetitions only.
- The current routine must exist, match exactly one exercise by normalized name and preserve the snapshot planned weight with exact numeric equality.
- Only keep-weight decisions are persisted; recommendations are never duplicated in the database.
- `Mantener peso` removes the recommendation immediately and survives restarts.
- `Aumentar peso` updates only the matching routine exercise after manual entry and confirmation, and leaves the historical workout unchanged.
- `Decidir después` collapses the card or row and persists nothing.
- Decision and increase failures keep their context visible and show the exact Spanish messages.
- No automatic weight changes, specific increments, success snackbars or badges are introduced. No recommendation content appears on Home or Progress.
- No UI component accesses SQLite or repositories directly.
- No backend, authentication, cloud storage or synchronization is introduced. `react-native-svg` and the bundled Nunito fonts are the only approved presentation dependencies.
- `npm run typecheck`, `npm run lint`, `npm test -- --runInBand` and `npx expo export --platform web` pass without new errors.
- Native iOS/Android verification is completed when a suitable device or emulator is available; otherwise the blocked status is documented explicitly.

## 6. Dependencies and Risks

- Latest-session evaluation loads all saved workouts in V1, consistent with existing previous-performance candidate reads. This is acceptable for personal local data volume. Add a persisted normalized-name key and index only in a later approved change if volume requires it.
- `findAll` performs per-workout exercise and set reads. Keep it simple for V1; do not introduce a second read model or cache without measured need.
- Weight equality must use exact comparison of stored numeric values, never formatted text. Editing and restoring the same value must restore eligibility.
- Duplicate exercise names inside a routine or workout must hide the recommendation rather than choosing an arbitrary entry.
- The progression block must be hidden while recommendations refresh to avoid showing stale data after a routine edit.
- A routine can be deleted after the block loads. The user cannot open it from the block; a stale increase attempt must fail safely with a Spanish message and must not modify data.
- The manual increase reuses `saveRoutineExercise`, so validation, ordering, notes and schedule preservation stay owned by the routine application layer.
- The dialog must never prefill a weight and must reject values that do not increase the current planned weight.
- The migration must remain append-only and must not modify or reset existing data.
- Native visual and interaction verification remains necessary after automated checks pass and may be blocked when no device or emulator is available.

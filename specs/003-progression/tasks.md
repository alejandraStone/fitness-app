# Tasks: Progression

## Preconditions

- `specs/003-progression/spec.md` and `specs/003-progression/plan.md` are the source of truth.
- Workout Records from `specs/002-workout-records/` is implemented.
- Complete tasks in dependency order.
- Work on one task at a time and mark it complete only after its verification criteria pass.

## Phase 1 — Domain

### T001 — Define progression models and decision repository port

- Define `ProgressionRecommendation` with the workout exercise identifier, exercise name, actual repetitions and planned maximum.
- Define the keep-weight decision repository port.
- Add the public progression domain exports.
- Keep the module independent of React Native and SQLite.

**Depends on:** None.

**Verify:** The model contains only fields required by the recommendation card and decision persistence; no recommendation copy is persisted.

**Status:** Completed (2026-11-12). Added `src/domain/progression/models.ts`, `progression-decision-repository.ts` and `index.ts`.

### T002 — Implement recommendation rules

- Qualify exercises with positive planned weight, exactly the planned number of sets and every set at or above the planned maximum.
- Select the latest session per normalized exercise name.
- Use the existing workout recency ordering and duplicate-name tie-breaking.
- Apply routine existence, unique normalized-name matching, exact planned-weight equality and keep-weight decisions.
- Reuse `normalizeExerciseName` and export the workout recency helper.

**Depends on:** T001.

**Verify:** A newer non-qualifying session suppresses an older recommendation; duplicate or missing routine matches hide the recommendation; restoring the snapshot weight restores eligibility.

**Status:** Completed (2026-11-12). Added `src/domain/progression/recommendations.ts` and exported `isMoreRecentWorkout` from the workouts domain.

### T003 — Add domain tests

- Cover qualification boundaries, zero weight, set-count mismatch, latest-session ordering, normalization, duplicate names, routine matching, weight equality, keep-weight suppression and restored eligibility.

**Depends on:** T002.

**Verify:** Domain tests pass without UI or SQLite dependencies.

**Status:** Completed (2026-11-12). `src/domain/progression/recommendations.test.ts` passes 17 tests.

## Phase 2 — Persistence

### T004 — Add keep-weight decision migration

- Add append-only migration version 4 named `add_progression_keep_weight_decisions`.
- Create the decision table keyed by `workout_exercise_id`, with a decision timestamp and cascading foreign key.
- Update migration tests and expected schema.

**Depends on:** T001.

**Verify:** A new database migrates to version 4; the table exists with the expected columns and foreign key.

**Status:** Completed (2026-11-12). Migration v4 added; migration tests cover the schema, version, foreign key and cascade behavior.

### T005 — Add complete workout reads

- Add `WorkoutRepository.findAll`.
- Implement ordered complete workout reads in `SqliteWorkoutRepository`.
- Update existing in-memory repository fakes.
- Add repository tests for ordering and completeness.

**Depends on:** T002.

**Verify:** `findAll` returns every workout with ordered exercises and sets, ordered by date, save timestamp and identifier.

**Status:** Completed (2026-11-12). `findAll` implemented with `date DESC, saved_at DESC, id ASC`; all workout repository fakes updated; ordering and completeness covered by tests.

### T006 — Implement decision persistence

- Implement `SqliteProgressionDecisionRepository`.
- Read decision identifiers scoped to one workout.
- Save decisions idempotently with a timestamp.
- Add persistence tests for scoping, duplicate writes, edit preservation, cascade deletion and restart.

**Depends on:** T004.

**Verify:** A decision survives a restart, is not duplicated and disappears only with its workout.

**Status:** Completed (2026-11-12). Added `SqliteProgressionDecisionRepository` and repository tests for scoping, idempotency, edit preservation, cascade deletion and file-backed restart.

## Phase 3 — Application and composition

### T007 — Implement progression read use case

- Load all saved workouts, the source routine and decision identifiers.
- Delegate eligibility to the domain.
- Return recommendations or a non-blocking load failure.

**Depends on:** T002, T005, T006.

**Verify:** Eligible workouts return recommendations; missing routine, missing matches, weight changes, newer sessions and decisions return no recommendations; read failures are translated.

**Status:** Completed (2026-11-12). Added `get-workout-progression.ts` with eligibility, missing-routine, weight-change, newer-session, decision and read-failure coverage.

### T008 — Implement keep-current-weight use case

- Persist the decision with the current timestamp.
- Return the exact Spanish failure message on persistence failure.
- Add application tests.

**Depends on:** T006.

**Verify:** A successful decision is persisted; a failed decision returns the documented message without exposing storage details.

**Status:** Completed (2026-11-12). Added `keep-current-weight.ts`; tests assert success persistence and the exact Spanish failure message.

### T009 — Compose progression services

- Add `ProgressionServices` and `createProgressionServices`.
- Extend `AppServices` and expose `useProgressionServices`.
- Reuse the single open SQLite connection.

**Depends on:** T007, T008.

**Verify:** Workout Detail can reach progression operations through the provider; no second database connection is opened.

**Status:** Completed (2026-11-12). Added `src/composition/progression-services.ts`, extended `AppServices` and exposed `useProgressionServices` from the existing provider.

## Phase 4 — Presentation

### T010 — Build recommendation card

- Add the recommendation card in `src/features/progression`.
- Render the title, message, recommendation rows, card-level `Revisar peso` and per-row `Mantener peso`.
- Use the sage support surface, existing shared components and 44-pixel touch targets.
- Add busy and error states.
- Add formatting and accessibility helper tests.

**Depends on:** T003.

**Verify:** The card matches the approved copy, hides when empty, exposes accessible row labels and shows the exact persistence error.

**Status:** Completed (2026-11-12). Added the card, formatting helpers and helper tests; actions use shared `AppButton` with 44-pixel content height.

### T011 — Integrate Workout Detail

- Add an optional progression card slot to `WorkoutDetailView`.
- Load recommendations on focus and hide the card while refreshing.
- Open Routine Detail from `Revisar peso`.
- Persist `Mantener peso`, remove the row immediately and prevent duplicate submissions.
- Keep Workout Detail usable when recommendation evaluation fails.

**Depends on:** T009, T010.

**Verify:** The card appears only between the summary and `Ejercicios`; no other screen changes; stale recommendations are not shown after routine or workout edits.

**Status:** Completed (2026-11-12). Added the optional card slot and wired Workout Detail to reload on focus, clear stale state, persist decisions, handle failures and open Routine Detail.

## Phase 5 — Documentation and verification

### T012 — Update documentation

- Update `docs/architecture/database.md` with the decision table and derived-data clarification.
- Update `docs/desing/screens.md` with the Workout Detail recommendation card.
- Update `docs/desing/design-system.md` with the card presentation.

**Depends on:** T011.

**Verify:** Documentation matches the implemented schema and UI behavior; no out-of-scope screens are documented as implemented.

**Status:** Completed (2026-11-12). Updated the database, screens and design-system documents, including the decision table, card placement, actions and advisory styling.

### T013 — Run automated checks

- Run type checking, linting, the test suite and a web export.
- Report actual results and distinguish existing warnings from regressions.

**Depends on:** T011, T012.

**Verify:** The commands complete without new errors.

**Status:** Completed (2026-11-12). `npm run typecheck`, `npm run lint`, `npm test -- --runInBand` (52 suites / 331 tests) and `npx expo export --platform web` all completed successfully. No lint warnings were reported.

### T014 — Verify user flows

- Verify the card placement, hidden state, multiple rows, `Mantener peso` persistence, `Revisar peso` navigation, weight-change resolution, workout-edit recalculation and routine deletion.
- Verify Spanish copy, accessibility labels and offline behavior.
- Run the web verification at 390×844.
- Verify on iOS or Android when a suitable device or emulator is available; otherwise document the blocker.

**Depends on:** T013.

**Verify:** Every acceptance criterion in `specs/003-progression/spec.md` is covered by automated tests and/or executed verification.

**Status:** Blocked (2026-11-12). Automated coverage passes, but interactive verification at 390×844 and on a native device or emulator was not executed. This environment has no browser automation or connected Android/iOS device; installing a UI testing dependency is outside the approved plan. The remaining manual verification must be completed when suitable tooling or a device is available.

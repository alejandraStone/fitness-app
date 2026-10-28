# Implementation Plan: Routines and Scheduling

## 1. Technical Approach

- Follow the architecture defined in `docs/architecture/overview.md`, `docs/architecture/database.md` and `docs/architecture/frontend.md`.
- Keep routine and scheduling business rules outside UI components.
- Use SQLite as the only persistence layer, accessed through repositories.
- Keep routine management and scheduling within the existing module boundaries.
- Use React Native Paper `5.15.3` as the approved UI component library. Integrate it through `PaperProvider`, the centralized theme in `src/shared/ui/theme.ts`, and shared UI wrappers. Build the calendar from Paper primitives and date-only utilities without a separate calendar dependency. This replaces the earlier provisional "no UI library" constraint by explicit product direction.
- Write code, identifiers, comments and automated tests in English. Every user-facing message shown in the application is written in Spanish, as required by `docs/constitution.md` §8 and `AGENTS.md`.

## 2. Implementation Phases

### Phase 1 — Domain and Application

- Define routine, routine exercise entry, recurring weekday and individual-date assignment models.
- Implement validation and business rules.
- Implement use cases for creating, listing, editing, duplicating and deleting routines.
- Implement scheduling operations and effective scheduled-routine resolution.
- Add unit tests for domain rules and use cases.

### Phase 2 — Local Persistence

- Define SQLite migrations and required tables, constraints and indexes.
- Implement repositories and database mapping.
- Ensure routine changes and related exercise entries are saved transactionally.
- Ensure routine deletion removes scheduling assignments without deleting historical workouts.
- Add persistence and integrity tests.

### Phase 3 — Routine Management UI

- Implement routine list and empty state.
- Implement routine creation and details.
- Implement a name-only routine editor and permanent deletion from the routine list.
- Implement adding, editing and removing exercise entries while preserving their creation order. Each entry has a single optional note; there is no separate description field.
- Implement routine duplication with a target-date selection and a copy named `<original name> COPIA`, plus permanent deletion with an in-app confirmation dialog that works on native and web.
- Connect UI to application use cases; do not access SQLite directly from components.

### Phase 4 — Scheduling and Home Calendar

- Implement recurring weekday assignment.
- Implement individual-date assignments.
- Implement monthly calendar navigation and date selection.
- Display the effective scheduled routines for the selected date without duplicates.
- Support starting routine creation from Home without retaining or assigning the selected date; creation collects the name and optional recurring weekdays before the first exercise.
- Ensure cancelling creation does not persist the routine.
- Allow recurring weekdays during creation and later editing; keep one-time date assignments in the date-assignment flow after creation.

### Phase 5 — Verification

- Test routine validation, CRUD operations, duplication and deletion.
- Test recurring and individual-date scheduling, including overlapping assignments.
- Test historical workout preservation when a routine is edited or deleted.
- Test persistence across application restarts and operation without Internet access.
- Run the project's configured tests, type checking and linting.
- Verify the main flows on iOS and Android.

## 3. Completion Criteria

- All acceptance criteria in `spec.md` pass.
- Routine configuration and scheduling persist locally.
- Historical workout data is preserved.
- Business logic is covered by automated tests.
- No UI component accesses SQLite directly.
- No backend, authentication, cloud storage or synchronization is introduced. The approved React Native Paper UI dependency is documented in `docs/desing/design-system.md`.
- Project checks pass without unresolved errors introduced by this feature.

## 4. Dependencies and Risks

- Database schema and deletion policies must agree with `docs/architecture/database.md`.
- Historical workout preservation must be supported by the data model, not only by UI behavior.
- Calendar rendering may evolve, but scheduling rules stay independent of the calendar implementation. The current calendar uses Paper primitives and fixed six-week date grids.
- Do not start workout recording or progress functionality as part of this feature.
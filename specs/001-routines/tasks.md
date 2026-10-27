# Tasks: Routines and Scheduling

## Phase 0 — Project Scaffolding

### T000 — Initialize the Expo project and shared infrastructure
- Initialize the Expo project (SDK 58) with TypeScript strict mode and Expo Router.
- Organize `src/`: presentation segments per `docs/architecture/frontend.md`; layer folders `src/domain`, `src/application` and `src/data` per `docs/architecture/overview.md`.
- Configure testing and quality checks: jest-expo (Jest 30) with `npm test`, `npm run typecheck` and `npm run lint`.
- Provide a provisional `src/app` shell (root layout and Home placeholder) without business logic.

**Verify:** Type checking, tests and linting run successfully and the app configuration resolves with Expo.

**Status:** Completed (2026-10-18).

## Phase 1 — Domain and Application

### T001 — Define routine domain models
- Define the routine and routine exercise entry models.
- Represent recurring weekdays and individual-date assignments.
- Define identifiers, timestamps and required fields.
- Keep domain models independent of React Native and SQLite.

**Verify:** Models represent the requirements in `spec.md` without introducing unrelated features.

**Status:** Completed (2026-10-18).

### T002 — Implement routine validation
- Validate routine names.
- Validate exercise names, planned sets, target rep ranges and planned weights.
- Normalize input where appropriate without silently accepting invalid values.

**Verify:** Unit tests cover valid values, invalid values and boundary cases.

**Status:** Completed (2026-10-19).

### T003 — Implement routine creation use case
- Create a routine with its exercise entries.
- Preserve the order of exercise entries.
- Reject invalid data.

**Verify:** Unit tests cover successful creation and validation failures.

**Status:** Completed (2026-10-19).

### T004 — Implement routine listing and retrieval
- Retrieve all routines.
- Retrieve a routine by its identifier.
- Return exercise entries in the configured order.

**Verify:** Unit tests cover empty results, existing routines and unknown identifiers.

**Status:** Completed (2026-10-19).

### T005 — Implement routine editing use case
- Update routine details and exercise entries.
- Support adding, editing and removing entries while preserving their creation order.
- Keep historical workout data independent of current configuration.

**Verify:** Tests confirm edits affect the current routine without modifying historical records.

**Status:** Completed (2026-10-19).

### T006 — Implement routine duplication use case
- Duplicate a routine with a new identifier and the name `<original name> COPIA`.
- Copy its ordered exercise configuration without inheriting recurring weekdays or one-time assignments.
- Persist the duplicate and its assignment to the date chosen by the user atomically.
- Do not copy individual-date assignments or workout history.

**Verify:** Tests confirm the duplicate is independent of the original.

**Status:** Completed (2026-10-19).

### T007 — Implement routine deletion use case
- Delete a routine and its scheduling assignments.
- Preserve historical workout data and historical exercise information.

**Verify:** Tests confirm deletion does not erase or invalidate historical records.

**Status:** Completed (2026-10-19).

## Phase 2 — Scheduling Rules

### T008 — Implement recurring weekday scheduling
- Assign zero or more weekdays to a routine.
- Update and remove recurring assignments.

**Verify:** Tests cover individual weekdays, multiple weekdays and no assigned weekdays.

**Status:** Completed (2026-10-19).

### T009 — Implement individual-date scheduling
- Assign a routine to a specific calendar date.
- Allow assignments on dates outside its recurring schedule.
- Remove individual-date assignments independently.

**Verify:** Tests confirm individual assignments do not alter recurring weekdays.

**Status:** Completed (2026-10-19).

### T010 — Resolve scheduled routines for a date
- Combine recurring and individual-date assignments.
- Return each routine only once per date.
- Allow different routines to be scheduled on the same date.

**Verify:** Tests cover overlapping assignments, duplicate appearances and multiple routines on one date.

**Status:** Completed (2026-10-19).

### T011 — Test scheduling date boundaries
- Handle month and year changes.
- Ensure date comparisons use calendar dates consistently.
- Avoid timezone-related shifts in individual-date assignments.

**Verify:** Tests cover month ends, year ends and date serialization/deserialization.

**Status:** Completed (2026-10-19).

## Phase 3 — SQLite Persistence

### T012 — Define database migrations
- Define the tables, constraints and indexes required by the feature.
- Represent routines, exercise entries and scheduling assignments.
- Follow the historical data preservation rules in the architecture documents.

**Verify:** A new local database can be created successfully.

**Status:** Completed (2026-10-19).

### T013 — Implement routine repository
- Implement persistence and retrieval through the repository interface.
- Map database records to domain models.
- Keep SQLite details inside the data layer.

**Verify:** Repository tests cover create, read, update and delete operations.

**Status:** Completed (2026-10-19).

### T014 — Implement scheduling repository
- Persist recurring weekday and individual-date assignments.
- Retrieve assignments required to resolve a selected date.

**Verify:** Tests confirm assignments survive application restarts.

**Status:** Completed (2026-10-19).

### T015 — Make routine writes transactional
- Save routine changes and related exercise entries atomically.
- Prevent partially saved routines when an operation fails.
- Apply the agreed deletion policy to scheduling assignments.

**Verify:** Failure tests confirm the database remains consistent.

**Status:** Completed (2026-10-19).

### T016 — Verify historical data preservation
- Ensure routine edits do not rewrite historical workout snapshots.
- Ensure deleting a routine does not cascade into historical workouts.
- Follow the historical relationship rules in `docs/architecture/database.md`.

**Verify:** Integration tests cover editing and deleting routines with existing historical records.

**Status:** Completed (2026-10-19).

## Phase 4 — Routine Management UI

### T017 — Create the routines list screen
- Display existing routines.
- Add an empty state.
- Provide entry points to create or open a routine.

**Verify:** The screen works with an empty database and with multiple routines.

**Status:** Completed (2026-10-19).

### T018 — Create the routine form
- Collect the routine name and recurring weekdays.
- Validate input and display understandable errors.
- Support saving and cancelling.

**Verify:** Invalid routines cannot be saved; cancelling does not create a routine.

**Status:** Completed (2026-10-19).

### T019 — Create exercise entry form
- Collect exercise name, optional note, planned sets, target rep range and planned weight.
- Support adding and editing entries.
- Preserve creation order and allow removing entries.

**Verify:** Form values map correctly to the domain model and validation rules.

**Status:** Completed (2026-10-19).

### T020 — Implement routine details and editing screens
- Display routine configuration and ordered exercise entries.
- Support editing an existing routine.
- Reflect saved changes when returning to the routine list.

**Verify:** Changes persist after navigating away and reopening the routine.

**Status:** Completed (2026-10-19).

### T021 — Add routine duplication and deletion actions
- Provide clear actions for duplicating and deleting a routine.
- Ask the user for a target date when duplicating and name the copy `<original name> COPIA`.
- Request in-app confirmation before permanent deletion.
- Communicate the result to the user.

**Verify:** The UI reflects the updated list and historical data remains intact.

**Status:** Completed (2026-10-19).

## Phase 5 — Home Calendar and Scheduling UI

### T022 — Implement monthly calendar navigation
- Display the current month.
- Allow moving between months.
- Allow selecting a date.

**Verify:** Month navigation and date selection work across month and year boundaries.

**Status:** Completed (2026-10-19).

### T023 — Display scheduled routines on the calendar
- Mark dates that have scheduled routines.
- Show the routines scheduled for the selected date.
- Do not present a scheduled routine as a completed workout.

**Verify:** Calendar indicators and selected-date results match the scheduling use cases.

**Status:** Completed (2026-10-19).

### T024 — Support scheduling changes from the UI
- Allow users to manage recurring weekdays.
- Allow users to assign and remove routines for individual dates.
- Keep the two scheduling mechanisms independent.

**Verify:** Changing one assignment mechanism does not unintentionally modify the other.

**Status:** Completed (2026-10-19).

### T025 — Start routine creation from a selected date
- Open routine creation from the Home calendar.
- Retain the selected date during the creation flow.
- Assign the new routine to that date automatically when it is saved.

**Verify:** Cancelling saves neither the routine nor its assignment; saving from a date creates the assignment.

**Status:** Completed (2026-10-19). Superseded on 2026-10-20 by T050: creation no longer retains the selected date or assigns the new routine.

## Phase 6 — Integration and Final Verification

### T026 — Connect screens to application use cases
- Connect the routines list, forms, routine details and calendar.
- Keep business rules out of UI components.
- Ensure UI components do not access SQLite directly.

**Verify:** All primary flows work through the application layer.

**Status:** Completed (2026-10-20).

### T027 — Verify offline persistence
- Create, edit, duplicate and delete routines without Internet access.
- Close and reopen the application.

**Verify:** Local data remains available and consistent after restarting.

**Status:** Completed (2026-10-20).

### T028 — Run automated checks
- Run unit and integration tests.
- Run TypeScript type checking and linting where configured.
- Resolve errors introduced by the feature.

**Verify:** All relevant checks pass.

**Status:** Completed (2026-10-20).

### T029 — Verify the main flows on iOS and Android
- Create and edit a routine.
- Add exercise entries.
- Configure recurring weekdays and individual-date assignments.
- Navigate the calendar and select dates.
- Duplicate a routine to a chosen date and delete routines.

**Verify:** The flows work on both platforms without blocking defects.

**Status:** Pending native device verification.

### T030 — Review scope and architecture
- Confirm the acceptance criteria in `spec.md` are satisfied.
- Confirm architecture and database documentation are followed.
- Confirm no backend, authentication, synchronization or UI library has been introduced without an explicit decision.
- Document any remaining limitations.

**Verify:** The feature is complete within the agreed V1 scope.

**Status:** Completed (2026-10-20). Native verification (T029) and the deferred occurrence exception remain outstanding. End-to-end verification of historical workout preservation (AC-04) remains blocked until Workout Records is implemented; repository and integration coverage already protects the routine-side guarantee.

## Feedback Revision — User Testing (2026-10-19)

### T031 — Keep a single optional note per exercise
- Remove the exercise description field from the domain, persistence and UI.
- Merge existing descriptions into notes through an append-only migration so no data is lost.

**Verify:** Exercise forms and routine details show only the optional note; existing data is preserved.

**Status:** Completed (2026-10-19).

### T032 — Remove exercise reordering controls
- Keep creation order; remove the move-up and move-down actions from the routine form.

**Verify:** Entries keep their creation order after saving and reloading.

**Status:** Completed (2026-10-19).

### T033 — Remove the empty exercise-list message
- Do not show a message when the routine has no entries yet; the add action remains visible.

**Verify:** The creation form shows no empty-state text for exercises.

**Status:** Completed (2026-10-19).

### T034 — Assign routines created from a date automatically
- Remove the "add to this day" choice.
- Persist the routine and its date assignment atomically when creation starts from Home.

**Verify:** Cancelling saves nothing; saving from a date creates the assignment.

**Status:** Completed (2026-10-19). Superseded on 2026-10-20 by T050: creation no longer assigns a date automatically; scheduling is explicit from Home.

### T035 — Duplicate routines to a chosen date
- Ask for a target date when duplicating.
- Create an independent copy named `<original name> COPIA` with the exercise configuration and assign it to the chosen date.
- Do not inherit recurring weekdays or one-time assignments.

**Verify:** Tests confirm naming, independence and atomic assignment.

**Status:** Completed (2026-10-19).

### T036 — Fix routine deletion on web
- Replace the platform alert with the approved in-app confirmation dialog so deletion works on web and native.

**Verify:** Confirming deletes the routine and returns to the list; cancelling keeps it.

**Status:** Completed (2026-10-19).

### T037 — Present all user-facing copy in Spanish
- Translate screens, forms, dialogs, validation messages, empty, loading and error states, accessibility labels and date formatting.
- Record the language rule in `AGENTS.md` and `docs/constitution.md`.

**Verify:** No user-facing English copy remains; checks pass.

**Status:** Completed (2026-10-19).

## Feedback Revision — Scheduling Clarity (2026-10-20)

### T038 — Clarify one-time assignment removal on Home
- Replace the icon-only remove action with a labeled action that states whether the routine remains scheduled by its recurring weekday.
- Show explicit source chips for recurring and one-time assignments.
- Prevent adding a routine that already repeats on the selected date from the assignment dialog.
- Explain where recurring schedules can be edited.

**Verify:** Home distinguishes both scheduling sources; removing a one-time assignment keeps recurring days intact; the dialog no longer offers duplicate assignments; tests, type checking and linting pass.

**Status:** Completed (2026-10-20). The Home source chips and visible recurrence hints were later superseded by T039; the recurrence semantics and assignment safeguards remain.

## Feedback Revision — Mobile-first Home and Routine Summary (2026-10-20)

### T039 — Simplify Home for mobile use
- Replace the selected-date header, full date and repeated subtitle with a dynamic `Rutinas de hoy` / `Rutinas del día` title below the calendar.
- Show `Añadir rutina` and `Añadir existente` only when the selected date has no routines.
- Remove `Planificada`, recurrence chips and one-time assignment chips from routine cards.
- Show the routine name, exercise count and a `Registrar mi entrenamiento` action on each card; tapping the card opens its summary.
- Move one-time assignment removal to the card overflow menu as `Quitar de este día`, keeping the recurrence explanation in the confirmation.
- Show a `Próximamente` notice from the register action without creating a workout record.

**Verify:** Home no longer repeats the selected date or scheduling-source labels; empty and populated dates show the expected actions; the overflow menu preserves the recurrence behavior; tests, type checking and linting pass.

**Status:** Completed (2026-10-20). The empty-state labels and hidden add action on populated days were later revised by T047.

### T040 — Add the routine summary
- Show exercise count, total planned sets and a single planned repetition total in Routine Detail.
- Calculate the repetition total with the minimum target repetitions of each exercise while keeping each entry's full range visible.
- Show recurring weekdays with a compact edit action.
- Open a prefilled exercise editor when an exercise entry is tapped and provide `Añadir más ejercicios`.
- Keep routine edit, duplicate and delete actions compact and icon-supported.

**Verify:** The summary totals match the configured entries; opening or closing the summary creates no workout record; the planned-repetition definition is documented and tested.

**Status:** Completed (2026-10-20).

### T041 — Add standalone exercise add/edit screens
- Extract the shared exercise fields and validation from the routine form modal.
- Provide standalone screens for adding a new exercise and editing an existing one.
- Use native headers and prefilled values when editing.
- Remove an exercise from the same form with explicit confirmation.
- Keep the routine form modal behavior and styling consistent.

**Verify:** Adding, editing and removing an exercise from Routine Detail updates the current routine and is reflected when returning to the summary.

**Status:** Completed (2026-10-20). Superseded by T055: exercise editing now uses the shared S1 sheet, and the standalone exercise screens are removed from the primary flow.

### T042 — Add exercise save and delete use cases
- Add an application use case to append or replace one exercise while preserving the routine schedule.
- Add an application use case to remove one exercise while preserving the routine schedule.
- Preserve exercise identifiers, order, timestamps and validation ownership in the routine update use case.
- Expose both operations through the composed routine services.

**Verify:** Unit tests cover adding, editing, removing, unknown identifiers, missing routines, validation failures and the last-exercise rule.

**Status:** Completed (2026-10-20).

### T043 — Align design documentation
- Update the Home, Routine Detail and scheduling presentation documentation with the mobile-first interaction.
- Document the planned-repetition calculation and the temporary register action.
- Record this revision and its verification state in the task tracker.

**Verify:** Documentation matches the implemented screens and contains no superseded Home presentation rules.

**Status:** Completed (2026-10-20). The standalone exercise-screen direction was superseded by the approved S1 sheet in T055; the mobile-first Home direction remains authoritative.

### T044 — Verify the mobile-first flows
- Run the relevant unit, type-check and lint commands.
- Exercise the Home empty state, populated cards, routine summary, exercise add/edit/delete flow, one-time assignment removal and register notice on the web build.
- Record any remaining native-only verification.

**Verify:** The flows complete without blocking defects; automated checks pass.

**Status:** Completed (2026-10-20). Verified on the web build at a mobile viewport: dynamic Home title, empty state actions, routine cards without scheduling labels, register notice, routine summary totals, exercise edit/add/delete, and one-time assignment removal with recurrence preservation. Native verification remains T029.

## Feedback Revision — Calendar-first Routine Assignment (2026-10-20)

### T045 — Add schedule-for-date use case with optional recurrence
- Add an application use case that schedules an existing routine for a date either only for that date or weekly.
- Always include the selected date's weekday in a weekly recurrence.
- Add selected weekdays without removing existing recurring weekdays or one-time assignments.
- Treat already scheduled weekdays as a no-op and prevent a one-time assignment when the routine already repeats on that weekday.
- Cover single, recurring, merge, no-op, validation, not-found and persistence-failure cases with unit tests.

**Verify:** Unit tests confirm both modes, preservation of existing scheduling and duplicate prevention.

**Status:** Completed (2026-10-20).

### T046 — Redesign the routine assignment dialog
- Split the flow into choosing a routine and choosing how to schedule it.
- Offer `Solo este día` and `Repetir cada semana`, with the selected weekday always included.
- Show existing recurring weekdays as fixed selections and allow adding other weekdays.
- Allow routines already planned for the date to be reopened to add other weekdays.
- Keep `Crear rutina` available as a secondary action.

**Verify:** The dialog produces the expected one-time or recurring assignment and never creates a duplicate occurrence.

**Status:** Completed (2026-10-20).

### T047 — Prioritize existing routines on Home
- Make `Usar una rutina` the primary empty-state action and `Crear rutina` the secondary action.
- Show a compact `Añadir` action whenever the selected day already has routines.
- Keep multiple different routines addable to the same date.
- Keep all visible copy in Spanish.

**Verify:** A day with one routine can receive a second routine without recreating the first, and creation remains available as a secondary action.

**Status:** Completed (2026-10-20).

### T048 — Align scheduling documentation
- Document the date-and-recurrence assignment flow in the feature specification.
- Update Home and design-system rules for action hierarchy, recurrence selection and multiple routines per date.
- Record this revision in the task tracker.

**Verify:** Documentation matches the implemented behavior and contains no rule that hides the add action on populated days.

**Status:** Completed (2026-10-20).

### T049 — Verify the calendar-first scheduling flows
- Run unit and integration tests, TypeScript type checking and linting.
- Exercise adding an existing routine for one day, adding it with weekly recurrence, adding another routine to the same day, and opening a routine already planned for the day.
- Record native verification separately if it cannot be performed in this environment.

**Verify:** The flows complete without blocking defects and automated checks pass.

**Status:** Completed (2026-10-20) for automated and web verification. `npm test -- --runInBand` passed with 30 suites and 165 tests; `npm run typecheck`, `npm run lint` and `npx expo export --platform web` passed. A mobile-viewport web session created two routines, added an existing routine only for a date, reopened a routine already planned for a date to add Thursday recurrence, and confirmed the calendar showed Tuesday/Thursday recurrence without duplicating the routine on the selected date. Native device verification remains tracked by T029.

### T050 — Create routines without automatic scheduling
- Open routine creation from Home without retaining or assigning the selected date.
- Hide recurring weekday selection during creation so the new routine starts unscheduled.
- Keep scheduling available afterward through `Usar una rutina`, the assignment dialog and routine editing.
- Update tests and documentation for the creation-only flow.

**Verify:** Creating a routine from Home saves only the routine, does not add it to the selected date or any weekday, and the routine can be assigned afterward from the calendar. Cancelling saves nothing. Automated checks pass.

**Status:** Completed (2026-10-20). `npm test -- --runInBand` passed with 30 suites and 160 tests; `npm run typecheck`, `npm run lint` and `npx expo export --platform web` passed. A clean mobile-viewport web session created a routine from Home without a date query or recurring weekday field, confirmed the routine detail showed no recurring days, and confirmed Home still showed `Sin rutinas este mes` with no routine card. Assigning the routine afterward through `Usar una rutina` / `Solo este día` added it to the selected date. Native device verification remains tracked by T029.

## Phase 7 — UX Coherence Revision (2026-10-26)

Approved decisions D1–D8 from the UX review. Implement tasks in order; T051 is complete, so T052 may start.

### T051 — Align UX documentation with the approved interaction model
- Update `docs/desing/screens.md`, `docs/desing/design-system.md` and this task tracker with the approved navigation, sheet inventory, confirmation rules and Home greeting.
- Record S1–S4, the S1 embedded-draft exception, bottom tabs, the Home greeting `Hola` until Profile exists, complete routine scheduling and duplicate feedback.
- Remove superseded rules that conflict with the approved model.

**Verify:** The documentation contains no conflicting navigation, sheet, confirmation or Home presentation rule and matches approved decisions D1–D8.

**Status:** Completed (2026-10-26). Updated `docs/desing/screens.md`, `docs/desing/design-system.md`, `docs/architecture/frontend.md`, `specs/001-routines/spec.md` and this tracker; reviewed the affected documentation for conflicting navigation, sheet, confirmation, scheduling and Home presentation rules. No code changes.

### T052 — Add persistent bottom navigation
- Add four top-level destinations: Inicio, Rutinas, Progreso and Perfil.
- Hide the tab bar on secondary stack screens and preserve their back behavior.
- Show a consistent temporary `Disponible próximamente` state for Progress and Profile until their features are implemented.

**Verify:** All four destinations are reachable, secondary screens keep their context, and the tab bar is hidden on screens that require focus.

**Supersedes:** The earlier deferral of persistent bottom navigation.

**Status:** Completed (2026-10-26). A 390×844 web session confirmed that Inicio, Rutinas, Progreso and Perfil are reachable, both placeholder tabs render `Disponible próximamente`, and Routine Detail hides the tab bar. Native tab-bar and safe-area verification remains part of T029/T060.

### T053 — Replace the marketing hero with a compact greeting
- Show `Hola` until the Profile feature exists; use `Hola, <name>` afterward.
- Remove the marketing tagline, long subtitle and `Rutinas` shortcut.
- Place the monthly calendar immediately below the greeting.
- Preserve the calendar, selected-day actions, routine cards and assignment overflow behavior.
- Reserve the future `Actividad` summary and `Ver historial` entry point for Workout Records; do not add fake activity data.

**Verify:** The calendar is visible directly below a short greeting in the first mobile viewport; no marketing copy, Routines shortcut or fake user name is shown; tests, type checking and linting pass.

**Status:** Completed (2026-10-26). Home shows a compact neutral `Hola` followed immediately by the calendar; the marketing tagline, long subtitle, `Rutinas` shortcut and fake user name are absent. The personalized name remains deferred until Profile exists. Type checking, linting, 31 test suites / 167 tests and the mobile-viewport web flow passed.

### T054 — Implement and migrate the approved sheet infrastructure
- Validate Expo Router `formSheet` options on SDK 58 for iOS, Android and web.
- Add shared sheet configuration and route sheets for S2, S3 and S4.
- Convert the current assignment, duplicate and recurring-day dialogs to the approved sheet presentation.
- Define and document a web fallback only if `formSheet` cannot provide acceptable behavior.

**Verify:** S2–S4 open in one tap, show a grabber, respect detents, dismiss by dragging, keep the keyboard away from inputs, respect the bottom safe area and return to the originating screen after saving.

**Status:** In progress (2026-10-27): implementation and web verification complete; native verification pending. S1 route sheets and S2–S5 use Expo Router `formSheet` on native and the documented centered Paper fallback on web; S2–S5 and route S1 were opened and saved from their originating screens. Native detents, grabber, drag dismissal, keyboard avoidance and bottom safe area could not be exercised in this environment and remain under T060/T029.

### T055 — Unify exercise editing as S1
- Use the same exercise sheet from Routine Detail and routine creation.
- Preserve the unsaved routine draft while the embedded sheet is open.
- Remove the current standalone exercise screens and custom bottom modal from the primary flow.
- Keep exercise removal behind explicit confirmation.

**Verify:** Adding, editing and removing an exercise behaves consistently from both entry points; the routine draft is preserved; no task flow uses a full-screen exercise editor.

**Status:** Completed (2026-10-26; refined 2026-10-27). Embedded S1 during creation preserves the unsaved draft, uses top `Cancelar`/`Guardar`, and chains a new blank entry after each save; route S1 from Routine Detail still adds, prefills/edits and removes an exercise with the shared confirmation. The old full-screen exercise screens and custom bottom modal are no longer in the primary flow. Web E2E and automated checks passed.

### T056 — Show complete routine scheduling
- Add an application query for a routine's one-time date assignments.
- Show `Se repite` and `Fechas puntuales` in Routine Detail.
- Allow removing a one-time date with confirmation without changing recurring weekdays.
- Keep repository access inside the application and data layers.

**Verify:** Routine Detail lists every current scheduling assignment; removing a one-time date preserves weekly recurrence; tests cover the new query and removal behavior.

**Status:** Completed (2026-10-26). `findAssignmentsByRoutine` and `listRoutineAssignments` are exposed through the data, application and service layers. Routine Detail lists one-time dates with confirmation and preserves recurring weekdays; repository, application and copy tests were added and the web flow removed a one-time date with immediate detail and calendar updates.

### T057 — Standardize confirmations and feedback
- Add one shared in-app Paper confirmation dialog for routine deletion, exercise removal and one-time assignment removal.
- Always confirm assignment removal, including when the routine has no weekly recurrence.
- Return to the originating screen after duplication and offer `Abrir copia` in a snackbar.
- Communicate routine deletion, exercise removal, assignment removal and weekday updates with visible feedback.

**Verify:** No destructive action executes without confirmation; the duplicate flow does not replace the originating screen; results are visible and errors remain inline or in an error banner.

**Status:** Completed (2026-10-26; duplicate feedback refined 2026-10-27). Confirmation dialogs cover routine deletion, exercise removal from the draft and route S1, and one-time assignment removal from Home and Routine Detail. Duplication returns to the origin; the snackbar names the copy and its selected target date before offering `Abrir copia`. Visible feedback covers creation, editing, deletion, exercise changes, weekday updates and assignment changes. Verified in the mobile-viewport web flow, including a non-default target date.

### T058 — Polish navigation hierarchy and copy
- Remove duplicate screen headings and normalize navigation labels.
- Move Routine Detail editing to the header and duplicate/delete to the overflow menu.
- Show `Sin programar` for routines without recurring weekdays.
- Replace hardcoded overlay colors with design-system tokens and enforce 44 px touch targets.

**Verify:** The navigation hierarchy matches `screens.md`, the copy is consistent and Spanish, and all new visuals use shared tokens and components.

**Status:** Completed (2026-10-26). Routine Detail now uses compact header editing plus an overflow menu for duplicate/delete, Routines shows `Sin programar` for empty recurrence, new actions expose 44 px targets, and scrim/colors use shared tokens. The web flow confirmed the navigation hierarchy, Spanish copy and formatter behavior.

### T059 — Verify accessibility and interaction
- Check accessible labels, roles, selected states and focus transfer for tabs, dates, chips, sheets and dialogs.
- Verify sheet dismissal, back behavior, keyboard behavior and safe areas.
- Verify loading, empty, error and success states and duplicate-submission prevention.

**Verify:** The approved flows are usable with assistive technologies and without relying on color alone; interaction defects are resolved or documented.

**Status:** Web and static review complete (2026-10-27); native verification pending. Verified tab roles and labels, selected states on tabs/dates/chips, Spanish accessibility labels, calendar date descriptions, confirmation presence and the embedded S1 drag handle contract. Native sheet dismissal, keyboard avoidance, safe areas, screen-reader focus and touch targets still require device testing, including the reported Home displacement after sheet dismissal and the embedded-S1 notch clearance. Paper's web fallback modal does not expose a dialog role or trap focus; this is recorded as a web-only limitation in `screens.md` because V1 targets iOS and Android.

### T060 — Run automated and device verification
- Run unit and integration tests, TypeScript type checking and linting.
- Export the web build and exercise the approved flows at a mobile viewport.
- Verify tab navigation, Home, Routines, Routine Detail, S1–S4, confirmation dialogs and duplicate feedback on iOS and Android.
- Record native-only gaps separately; close T029 only with actual device verification.

**Verify:** Automated checks pass, the web flows complete without blocking defects, and native verification is recorded or explicitly remains open.

**Status:** Automated and web verification complete (2026-10-27); native verification pending. `npm run typecheck`, `npm run lint`, `npm test -- --runInBand` (31 suites, 167 tests) and `npx expo export --platform web` passed. A 390×844 browser session completed the revised flow — S5 from Routines, Home and S2, automatic first S1, chained exercise entry, top actions, routine persistence, S3 with a non-default target date, copy detail and Home refresh — with no browser errors. Native iOS/Android verification remains pending; T029 stays open.

### T061 — Refine routine creation, embedded S1 and Home stability
- Present routine creation as the full-height S5 sheet with no navigation-header back button and top `Cancelar`/`Guardar` actions.
- Open S1 automatically when `Guardar` is pressed with a valid name and no exercises; chain a new blank S1 after each saved exercise and return to S5 on `Cancelar`.
- Show `Cancelar` at the top left and `Guardar` at the top right inside the creation S1 variant; remove the manual `Añadir` action from S5.
- Dock embedded S1 below the top safe area and support drag-to-dismiss without competing with form scrolling.
- Preserve Home data and scroll position while refreshing after a sheet or secondary screen closes.
- Make the S3 target date read from the latest selection synchronously and name the target date in duplicate feedback.
- Update `docs/desing/screens.md`, `docs/desing/design-system.md` and `specs/001-routines/spec.md` for S5 and the revised S1 behavior.

**Verify:** S5 opens from Home, Routines and S2; has no `(tabs)` back label; can be cancelled or dragged down; opens S1 automatically after a valid name; chains exercises until `Cancelar`; persists the routine from the top `Guardar`; S1 stays below the notch and dismisses by dragging; Home remains static after closing sheets; S3 assigns the copy to the selected date and reports that date. Automated checks and the 390×844 web flow pass; native safe-area, drag and keyboard behavior require device verification.

**Status:** In progress (2026-10-27). Implementation and automated/web verification complete: type checking, linting, 31 test suites / 167 tests and the web export pass; a 390×844 Playwright flow covered S5 from Routines, Home and S2, automatic and chained S1, routine persistence, S3 with a non-default target date and copy detail, plus browser-error checks. Native iPhone visual and gesture verification remains pending, including the reported Home displacement and embedded-S1 notch/drag behavior.

## Deferred Work

### Weight unit selection (kg/lb)
- Deferred to the future Profile feature; it is not implemented as part of this feature.
- The current version accepts and displays planned weights in kilograms.
- Planned weights remain stored canonically in kilograms, preserving sufficient precision for a later unit conversion (`docs/PRD.md` §3.1).

### Omit a single occurrence of a recurring routine
- Deferred by product decision. V1 does not support occurrence exceptions.
- Removing a one-time date assignment never changes recurring weekdays. A routine that also repeats on that weekday remains scheduled.

## Execution Rules

- Complete tasks in order unless a dependency clearly requires a different sequence.
- Work on **one task at a time**.
- Before each task, consult the relevant specification and architecture documents.
- Implement only what the current task requires.
- Add or update tests alongside the implementation.
- Run the relevant checks before marking a task complete.
- Mark a task complete only when its verification criteria pass.
- If a task reveals a contradiction or missing requirement, stop and report it instead of silently changing the specification.
- Do not start workout logging, workout history screens or progression suggestions as part of this feature.

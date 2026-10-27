# Feature Specification: Routines and Scheduling

## 1. Purpose

Allow users to create and manage personal workout routines, configure their exercises, and schedule routines on recurring weekdays or specific calendar dates.

The feature also provides the planning functionality required by the Home calendar.

## 2. Scope

### In scope

- Create, view, edit, duplicate and permanently delete routines.
- Configure exercise entries within a routine.
- Schedule routines on recurring weekdays and individual dates.
- Add an existing routine to a date and optionally repeat it on other weekdays.
- View scheduled routines on the Home calendar.
- Start routine creation from the Home calendar without automatic scheduling.
- Preserve historical workout data when routines change or are deleted.
- Store routine configuration and scheduling locally.

### Out of scope

- Recording completed workouts and viewing workout history.
- Personal records, progress charts and progression suggestions.
- A global exercise catalog or independently managed exercise entities.
- Exercise images, videos, muscle classifications or external exercise databases.
- Rest timers, tempo, RIR or additional-set management.
- Backend services, authentication, cloud storage and synchronization.
- Final visual design or selection of a UI component library.

## 3. User Stories

- As a user, I want to create and configure routines so that I can plan my workouts.
- As a user, I want to organize the exercises in each routine, including their planned sets, repetitions and weights.
- As a user, I want to schedule routines on recurring weekdays and additional dates independently.
- As a user, I want to add an existing routine to a date and choose whether it repeats on that weekday or other weekdays.
- As a user, I want to see which routines are scheduled for a selected date.
- As a user, I want to duplicate routines to create independent variations.
- As a user, I want to modify or delete routines without losing historical workout data.

## 4. Functional Requirements

### FR-01: Routine management

Users MUST be able to create, view, edit, duplicate and permanently delete routines.

Each routine MUST have:
- A name.
- An ordered list of exercise entries, which MAY initially be empty.
- Zero or more recurring weekdays.

The routine name MUST contain at least one non-whitespace character after trimming leading and trailing whitespace.

The application MUST provide an appropriate empty state when no routines exist.

Creating or scheduling a routine MUST NOT create a completed workout record.

### FR-02: Exercise configuration

Exercise entries MUST belong to individual routine configurations. The application MUST NOT require a global exercise catalog or independently managed exercise entities.

Each entry MUST support:
- Exercise name.
- Optional notes.
- Display order.
- Planned number of sets.
- Minimum and maximum target repetitions.
- Planned external weight.

Validation rules:

- The exercise name MUST contain at least one non-whitespace character after trimming.
- The planned set count MUST be a positive integer.
- Minimum and maximum repetitions MUST be positive integers, with the minimum less than or equal to the maximum.
- Planned weight MUST be non-negative. Zero represents an exercise performed without external load.

Values MUST be stored canonically in kilograms, preserving sufficient precision. The current version of the feature accepts and displays planned weights in kilograms only. Selection of the preferred weight unit (kg or lb) and unit conversion are deferred to the future Profile feature described in `docs/PRD.md`; this deferral does not change the canonical kilogram storage rule.

Users MUST be able to add, edit and remove entries. The order in which entries were added MUST be preserved when the routine is saved and loaded.

Exercise entries in one routine MUST remain independent of entries in other routines and of historical workout snapshots.

### FR-03: Editing routines

Users MUST be able to modify a routine's name, recurring weekdays and exercise configuration.

Changes MUST affect the current configuration and future planning only. Previously saved workouts and their historical snapshots MUST remain unchanged.

Actual performance recorded in previous workouts MUST NOT automatically modify planned weights.

### FR-04: Duplicating routines

Users MUST be able to duplicate an existing routine.

Duplicating a routine MUST ask the user to choose the date on which the copy will be scheduled.

A duplicate MUST:
- Have a new, stable identifier and an independent configuration.
- Be named `<original name> COPIA`.
- Copy the source routine's ordered exercise entries, including notes, targets and planned weights.
- Start with no recurring weekdays and no individual-date assignments inherited from the source.
- Be assigned to the date chosen by the user.
- Exclude workout history, historical snapshots, progression suggestions and personal records.

Editing either routine MUST NOT modify the other.

### FR-05: Deleting routines

Users MUST be able to permanently delete a routine.

Deletion MUST remove the routine from current routine management and remove its recurring and individual-date scheduling assignments.

Saved workouts, historical snapshots, historical exercise information, personal records and other historical information MUST remain available.

Historical workout records MUST NOT depend on the continued existence of the current routine configuration. Deleting a routine MUST NOT cascade-delete historical workouts.

Deletion MUST be permanent rather than an automatic archival or soft-deletion operation, unless another authoritative specification explicitly requires otherwise.

### FR-06: Recurring scheduling

Users MUST be able to assign zero or more recurring weekdays to a routine. Recurring weekdays MUST be configurable when editing the routine, and the date-assignment flow MAY add weekdays to the routine's recurring schedule.

Recurring scheduling MUST operate independently of individual-date assignments.

Changing recurring weekdays MUST affect calendar planning without modifying historical data.

### FR-07: Individual-date scheduling

Users MUST be able to assign an existing routine to a specific calendar date, including dates outside its recurring schedule.

Users MUST be able to remove an individual-date assignment without changing recurring weekdays.

Different routines MAY be scheduled on the same date. The same routine MUST NOT appear more than once on a date when both recurring and individual-date assignments apply.

Removing an individual-date assignment MUST NOT remove a routine that remains scheduled through its recurring weekday. Similarly, removing a recurring weekday MUST NOT remove individual-date assignments.

When assigning an existing routine to a date, the user MUST be able to choose:

- a one-time assignment for that date only; or
- a weekly repetition that includes the selected date's weekday and MAY include additional weekdays.

Choosing weekly repetition MUST preserve the routine's existing recurring weekdays and individual-date assignments; it only adds weekdays. The routine MUST appear on the selected date. Selecting a weekday that is already scheduled MUST NOT create a duplicate occurrence.

The assignment interface MUST allow multiple different routines to be added to the same date. Starting routine creation from Home MUST remain available as a secondary action to using an existing routine.

Scheduling MUST NOT create a workout record or imply completion.

### FR-08: Home calendar

The Home screen MUST provide a calendar that supports monthly navigation and date selection.

The calendar MUST:
- Visually distinguish dates with scheduled routines from dates without scheduled routines.
- Display the routines effectively scheduled for the selected date.
- Combine recurring and individual-date assignments without duplicates.
- Reflect saved changes to routines and scheduling.
- Allow navigation between months and selection of dates in the displayed month.

Changing the selected date MUST NOT modify scheduling assignments.

A scheduled routine MUST NOT be treated as a completed workout. Completion status MUST come from saved workout records, not from the calendar schedule.

The exact visual treatment is defined by the project's design documentation.

### FR-09: Creating an unscheduled routine from Home

Users MUST be able to start routine creation from the Home calendar.

Creating a routine MUST NOT assign it to the selected date or to any weekday. A new routine MUST start without recurring weekdays and without individual-date assignments.

Routine creation MUST collect the routine name and its exercises. The creation
sheet MUST expose `Cancelar` and `Guardar` without a navigation-header back
button. When the user presses `Guardar` with a valid name and no exercises, the
first exercise form MUST open automatically. Saving an exercise MUST open a blank
exercise form again; cancelling that form MUST return to the routine draft, where
`Guardar` persists the routine. Scheduling options MUST be presented afterward
from the calendar.

If creation is cancelled or its sheet is dismissed, the routine MUST NOT be
saved.

### FR-10: Local persistence and availability

Routine configuration and scheduling MUST be persisted in local SQLite storage and remain available after the application restarts.

The application MUST remain usable for routine management without an Internet connection.

The feature MUST NOT introduce remote persistence, authentication, accounts or synchronization.

### FR-11: User-facing language

Every message shown to the user MUST be written in Spanish: screen titles, labels, buttons, placeholders, hints, empty, loading, error and validation messages, dialogs, confirmations, notifications and accessibility labels.

Code, identifiers, comments, automated tests and technical documentation MUST remain in English.

## 5. Acceptance Criteria

### AC-01: Create and reload a routine

**Given** the user is creating a routine,

**When** they save a valid configuration,

**Then** the routine MUST appear in the routine list and remain available after restarting the application.

### AC-02: Validate configuration

**Given** the user creates or edits a routine,

**When** its name, set count, repetition range or planned weight is invalid,

**Then** the application MUST prevent saving and provide understandable feedback.

### AC-03: Manage exercise entries

**Given** a routine contains exercise entries,

**When** the user adds, edits or removes entries,

**Then** the saved configuration and the order in which entries were added MUST be preserved when the routine is loaded again.

### AC-04: Preserve history

**Given** a routine has associated historical workouts,

**When** the user edits or permanently deletes the routine,

**Then** historical workouts and their snapshots MUST remain unchanged and accessible.

### AC-05: Duplicate independently

**Given** an existing routine has a configuration and workout history,

**When** the user duplicates it and chooses a date,

**Then** the duplicate MUST be an independent routine named `<original name> COPIA` that preserves the source exercise configuration, starts without recurring weekdays or individual-date assignments, is assigned to the chosen date, and inherits no workout history.

### AC-06: Combine scheduling mechanisms

**Given** a routine is scheduled on a recurring weekday,

**When** an individual-date assignment is added for a matching date,

**Then** the routine MUST appear only once.

Removing either assignment MUST leave the other intact.

### AC-07: Schedule additional routines

**Given** a routine has recurring weekdays,

**When** the user assigns it to an additional date,

**Then** it MUST appear on that date without changing its recurring schedule. Other routines MUST also be allowed on the same date.

### AC-08: Display calendar planning

**Given** routines have recurring or individual-date assignments,

**When** the user selects a date on the Home calendar,

**Then** the application MUST display the routines scheduled for that date without duplicates or falsely marking them as completed.

### AC-09: Create from Home without automatic scheduling

**Given** the user has selected a date on Home,

**When** they create a routine from that date,

**Then** the routine MUST be saved without a one-time assignment or recurring weekdays and MUST NOT appear on the selected date until the user assigns it.

If creation is cancelled, the routine MUST NOT be saved.

### AC-10: Work offline

**Given** the device has no Internet connection,

**When** the user creates, edits, duplicates, schedules or deletes a routine,

**Then** the operation MUST work locally and the resulting state MUST persist after restarting the application.

### AC-11: User-facing language

**Given** any screen or interaction,

**When** the application shows messages to the user,

**Then** every visible message MUST be written in Spanish.

### AC-12: Schedule an existing routine with optional recurrence

**Given** an existing routine and a selected date,

**When** the user chooses to add the routine only for that date,

**Then** the routine MUST appear on that date without changing its recurring weekdays.

**When** the user chooses to repeat it weekly,

**Then** the selected date's weekday and any additional selected weekdays MUST be added to the routine's recurring schedule, existing recurring weekdays MUST remain, and the routine MUST appear only once on the selected date.

**And** adding another different routine to the same date MUST remain possible.

## 6. Error Handling

The application MUST provide understandable feedback when a routine cannot be validated, loaded, saved, updated, deleted or scheduled.

Failed operations MUST NOT leave related data inconsistent.

The application MUST NOT report an operation as successful before its persistence operation succeeds.

## 7. References and Constraints

The following documents are authoritative for their respective concerns:

- `docs/PRD.md` — product scope and shared business requirements.
- `docs/constitution.md` — global development constraints.
- `docs/architecture/overview.md` — architectural layers and module boundaries.
- `docs/architecture/database.md` — database relationships and integrity rules.
- `docs/architecture/frontend.md` — frontend organization and dependency rules.
- `docs/desing/screens.md` — screen content and navigation.
- `docs/desing/design-system.md` — visual tokens and component conventions.

Implementation MUST follow these documents. UI components MUST NOT access SQLite directly.

Final visual styling and UI component library selection are outside the scope of this specification.



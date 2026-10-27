# Screens

Screen responsibilities, content and navigation for V1. Business rules live in `docs/PRD.md`.

## Global Rules

These rules apply to every screen and are not repeated below.

1. **Scheduling, recording and history are separate concepts.**
   - A recurring weekday schedules a routine automatically.
   - A one-time assignment schedules a routine for one date without changing its recurring schedule.
   - A saved workout is an actual training record associated with a date.
2. Scheduling never creates a saved workout and never implies that a workout was completed or recorded. Opening Routine Detail, selecting a scheduled routine, or opening Record Workout without saving never creates a saved workout.
3. A routine scheduled for a date through both a recurring weekday and a one-time assignment appears once. Different routines may share a date.
4. History is shown from saved workouts and their snapshots, never reconstructed from the current routine configuration.
5. Editing a routine, renaming or removing an exercise entry, or permanently deleting a routine never modifies saved workouts.
6. Recorded weight never updates a routine's planned weight. The app may suggest an increase; the user changes the planned weight manually in the routine.
7. A saved workout cannot be deleted in V1. Editing one updates every derived metric, personal record and progression suggestion that depends on it.

---

## 1. Home

Overview of the selected date and access to training activity.

Contains:
- a single short greeting to the user: `Hola` until Profile is implemented, then `Hola, <name>`;
- monthly calendar with date selection immediately below the greeting;
- selected-date section titled `Rutinas de hoy` when the selected date is today and `Rutinas del día` otherwise;
- routines scheduled for the selected date (the selected date determines which routines are shown);
- when the date has no routines: primary action `Usar una rutina` and secondary action `Crear rutina`;
- when the date already has routines: compact `Añadir` action in the section header;
- compact training activity summary with access to Workout History through `Ver historial`;
- relevant progression suggestions, when available.

The greeting must not occupy most of the first viewport; the calendar follows it directly. It contains no marketing tagline, long subtitle or `Rutinas` shortcut; the bottom tab owns navigation to Routines. Until the Profile feature exists, the application must not fake or hardcode a user name.

The training activity summary and progression suggestions are reserved for their approved features. Until Workout Records and Progression exist, do not render fake or empty activity data on Home.

Creating a routine from Home produces an unscheduled routine; the selected date is not retained or assigned. Using an existing routine takes priority over creating one; `Crear rutina` remains available in the empty state and in the assignment sheet (S2).

### Assigning an existing routine (sheet S2)

Two steps:
1. Choose one of the user's routines.
2. Choose how to schedule it:
   - `Solo este día`: one-time assignment for the selected date.
   - `Repetir cada semana`: adds the selected date's weekday and any additional selected weekdays to the routine's recurring schedule.

Rules:
- The selected weekday is always included in a weekly repetition.
- Existing recurring weekdays are shown as already scheduled and preserved; the flow only adds days.
- If the routine is already planned for the selected date, the user can still open it to add other weekdays, but it must not appear twice on that date.
- The sheet handles one routine at a time, returns the user to the day's routines after a successful save, and shows a visible confirmation through a snackbar.

### Routine cards

Each card shows the routine name, its exercise count and a `Registrar mi entrenamiento` action.
- Tapping the card opens Routine Detail.
- No scheduling-source chips or `Planificada` labels; scheduling details live in Routine Detail.
- A one-time assignment can be removed from the card's overflow menu (`Quitar de este día`). The action always requires confirmation. If the routine also repeats on that weekday, the confirmation explains that the weekly recurrence remains. After removal, the card updates immediately and a snackbar explains the result.
- Until Workout Records is implemented, `Registrar mi entrenamiento` shows a short `Próximamente` notice and creates no record.

## 2. Routines

Main screen for creating and managing routines.

Contains:
- a single native screen title `Rutinas`;
- a primary `Nueva` action in the header and `Crear rutina` in the empty state;
- access to the user's routines;
- recurring weekday assignments;
- access to routine details and editing;
- access to each routine's exercise configuration.

Routine cards show the routine name, its exercise count and its recurring weekdays. A routine without recurring weekdays shows `Sin programar`; this label describes weekly recurrence, while any one-time dates appear in Routine Detail.

A routine has a name, zero or more recurring weekdays and an ordered list of exercise entries.

Each exercise entry belongs to one routine, is configured independently there, and has: exercise name, optional note, planned number of sets, target repetition range and planned external weight. Users create their own entries and name their own variations.

A new routine starts with no recurring weekdays and no one-time assignments. The `Nueva` header action and every `Crear rutina` entry point open the routine creation sheet (S5). It collects the routine name and the draft exercise list, has no navigation-header back button, and places `Cancelar` and `Guardar` at the top. It can be dismissed by dragging down. If `Guardar` is pressed with a valid name and no exercises, S1 opens automatically; each saved exercise opens a blank S1 again. `Cancelar` in S1 stops the chain and returns to the routine draft, where `Guardar` persists the routine. The user schedules the routine afterward from the Home calendar. Editing a routine can still change its recurring weekdays.

**Duplicate (sheet S3):** asks for a target date and creates an independent routine named `<original name> COPIA` with the same exercise configuration. The copy has no recurring weekdays; its only scheduling is a one-time assignment for the chosen date. Workout history is not copied. After a successful duplication, the sheet closes, the user returns to the originating screen and a snackbar confirms the copy and offers `Abrir copia`.

**Delete:** requires explicit confirmation and permanently removes the routine's active configuration and its scheduling assignments. Saved workouts remain available. The result is announced with a snackbar on the Routines screen.

## 3. Routine Detail

Current configuration of a routine. It is a planning and configuration screen, not a historical record. Recording starts from the scheduled routine card on Home, not from here.

Contains:
- routine name;
- planned summary: exercise count, total planned sets and total planned repetitions;
- a scheduling section with two independent blocks:
  - `Se repite`: recurring weekdays with a compact edit action (sheet S4);
  - `Fechas puntuales`: one-time dates with a `Quitar` action per date; removal requires confirmation and never changes recurring weekdays;
- ordered exercise entries, each with planned sets, target repetition range and planned external weight;
- `Añadir más ejercicios` action;
- compact header actions: edit, plus an overflow menu with duplicate and delete.

The total planned repetitions is calculated conservatively as planned sets multiplied by the minimum target repetitions of each exercise. Individual entries show their full repetition range. Removing a one-time date updates Routine Detail immediately and announces the result with a snackbar.

**Exercise entries (sheet S1):**
- `Añadir más ejercicios` opens S1 to add an entry.
- Tapping an entry opens S1 prefilled to edit its name, optional note, planned sets, target repetition range and planned weight.
- The edit mode offers removal, with explicit confirmation.
- During routine creation, the same S1 sheet is embedded in the draft form so unsaved entries are preserved until the routine is saved. In that context it shows `Cancelar` at the top left and `Guardar` at the top right. Saving an entry opens another blank S1; `Cancelar` returns to the routine creation sheet. The embedded sheet is docked below the top safe area and can be closed by dragging its handle down.

## 4. Record Workout

Records actual performance for an existing routine on a selected date.

- The user selects the date before recording begins; it cannot be changed after the workout is saved.
- All of the routine's exercise entries are shown in configured order. Each shows: name and optional note, planned sets, target repetition range, planned weight, and one recording row per planned set.
- At the start of recording, the app captures a snapshot of the routine and exercise configuration. Later routine changes do not modify it.
- For every planned set, weight is prefilled from the planned weight and repetitions start blank. Both are editable independently.
- Repetitions must be entered for every planned set before saving.
- Not supported in V1: partial saves, skipping sets or exercises, adding or removing sets, recording without an existing routine.
- Saving persists the workout and its historical exercise configuration together as one operation. If saving fails, nothing is left partially saved.
- If the selected routine is permanently deleted before saving, the pending recording is cancelled and cannot be saved.

## 5. Workout Detail

A saved workout's historical record. It is the destination right after a successful save and is also reachable from Workout History.

Contains:
- workout date;
- routine name as recorded in the snapshot;
- recorded exercises in their historical order;
- recorded sets, weights and repetitions;
- relevant performance summary;
- progression result or suggestion, when applicable;
- action to edit the workout.

The user can edit the recorded performance of a saved workout.

## 6. Workout History

Saved workouts in chronological order. It is a secondary stack screen, not a bottom-tab destination. Its entry point is the `Actividad` section on Home through `Ver historial`.

Each item shows:
- workout date;
- routine name as preserved in the historical record;
- concise workout summary.

Selecting an item opens Workout Detail, where the user can review and edit it. Only saved workouts appear here; scheduled routines that have not been recorded never appear as completed workouts.

## 7. Progress

Main screen for reviewing training progression over time.

Metrics, charts, summaries and layout are pending product decisions (see Pending Decisions). It uses saved workouts as its only source of performance; scheduled routines and planned targets are never counted as performance. Detailed requirements must be defined before full implementation, but this does not block unrelated features.

## 8. Exercise Progress

Historical performance of an exercise identified by its saved historical information. Its name and results stay meaningful if the entry is later renamed or removed, or its routine is deleted.

May display:
- exercise name;
- historical performance;
- weight progression;
- repetition progression;
- external workload volume, when applicable;
- personal records and achievement dates;
- progression status and suggestions, when applicable.

Presentation and metrics follow the progression rules in the PRD. Progression is calculated from saved performance and the applicable historical target configuration. Missing or unrecorded sets are never treated as completed.

## 9. Profile and Settings

V1 includes:
- user name;
- body weight;
- preferred weight unit: kilograms or pounds;
- relevant application settings.

Changing the preferred unit changes only how weights are displayed and entered, not stored values or historical performance. Training analytics belong in Progress, not in Profile. Account registration, login and account management are outside V1.

The profile name is used for the Home greeting once Profile is implemented: `Hola, <name>`. Until then, Home shows the neutral greeting `Hola`.

## 10. Navigation

Persistent bottom navigation with four destinations: Inicio, Rutinas, Progreso and Perfil. The tab bar is visible on these top-level screens and hidden on secondary stack screens so back behavior and focus remain clear.

Until Progress and Profile are implemented, their tabs show a consistent temporary `Disponible próximamente` state. This placeholder must be replaced by the real screen when each feature is delivered.

**Inicio**
- See a short greeting above the calendar.
- Select a date.
- Create a routine.
- Assign a routine to a date (S2).
- Open a scheduled routine's details.
- Record a workout.
- View the saved workout detail.
- Open recent training activity and Workout History through `Ver historial`.

**Rutinas**
- Create or edit a routine.
- Open routine details.
- Add, edit or remove exercise entries (S1).
- Duplicate a routine to a chosen date (S3).

**Workout History**
- Secondary stack screen opened from Home `Actividad`.
- Open a saved workout.
- Review or edit it.

**Progreso**
- Review overall progression once its requirements are defined.
- Open exercise progression when applicable.

**Perfil**
- View or edit profile information.
- Open application settings.

Shared screens (Routine Detail, Record Workout, Workout Detail, Workout History, Exercise Progress, Profile edit) must be reusable regardless of the path used to reach them. Navigation must preserve the context the destination needs: selected date, routine or saved workout.

## 11. Bottom Sheets

Bottom sheets are used only where this section lists them.

### Usage rule

A task uses a sheet only if all three hold:
- **Short:** one decision, or a short form of at most six fields. A two-step flow with one decision per step is allowed only where the inventory says so (S2).
- **Contextual:** the user stays "inside" the originating screen.
- **Dismissible:** closing it loses nothing important.

Routine creation (S5) is an explicitly approved exception: it is a full-height sheet because it coordinates a short draft and the embedded S1 exercise flow. Everything else is a full screen. Destructive confirmations (delete routine, remove exercise entry, `Quitar de este día`) use the shared in-app Paper confirmation dialog, never a sheet and never a platform alert. The same dialog works on native and web.

Only the sheets in the inventory exist. If the implementer believes another one is needed, it records the proposal in its report and does not implement it.

### Technical contract

- Independent sheets (S2, S3, S4) are Expo Router routes with `presentation: 'formSheet'`. S5 uses the same presentation with a full-height detent.
- S1 is a route sheet when opened from Routine Detail. During routine creation it uses the same content embedded in S5 so unsaved input is preserved; this is the only approved embedded-sheet exception.
- Do not install `@gorhom/bottom-sheet` or any other bottom-sheet library. The only manual drag gesture is the embedded S1 handle, approved so the draft form can be dismissed like a native sheet. It is limited to the handle area and must not compete with the form's scroll gesture.
- Before coding, check the Expo Router documentation for the installed SDK and confirm the options used: `sheetAllowedDetents`, `sheetGrabberVisible`, `sheetCornerRadius`.
- The grabber is visible. Corner radius, colors, spacing and typography come from design-system tokens; nothing is hardcoded in the screen.
- Dragging down dismisses route sheets and the embedded S1. No sheet has a navigation-header back button.
- Multi-step sheets use an in-content `Volver` action; this is not a navigation back button.
- Dismissing by dragging discards unsaved changes without confirmation; only the sheet's primary action saves.
- After a successful save, the sheet closes and the user returns to the originating screen. S3 shows a snackbar with the copy name, its target date and `Abrir copia`; it never opens the copy automatically.
- Do not use a centered dialog for a task flow. If `formSheet` cannot provide acceptable web behavior, the implementation may document a web-only fallback that reuses the same content and actions; it must be recorded before implementation.
- **Recorded web fallback (2026-10-26):** Expo Router's native stack does not implement `formSheet` on web, where it would replace the origin with a full screen. Sheet routes therefore use `presentation: 'transparentModal'` on web and render the same sheet content and actions in a centered Paper dialog. iOS and Android continue to use `formSheet`.
- **Web-only accessibility limitation (2026-10-26):** Paper's web dialog fallback does not expose a dialog role (`role="dialog"` or `role="alertdialog"`) or trap keyboard focus. This limitation is recorded for the web fallback only; V1 targets iOS and Android, where Paper's modal marks its content as modal for assistive technologies.

### Inventory

| ID | Origin | Trigger | Content | Detents |
|----|--------|---------|---------|---------|
| S1 | Routine Detail (route sheet); routine creation (embedded sheet) | `Añadir más ejercicios` (create) or tapping an entry (edit, prefilled) | Exercise name, optional note, planned sets, target repetition range, planned weight. In edit mode, a remove action confirmed with the in-app dialog. Creation uses top `Cancelar`/`Guardar` actions and chains new blank entries until cancelled. | `[0.6, 1]` |
| S2 | Home | `Usar una rutina` (date without routines) or `Añadir` (date with routines) | Step 1: choose a routine, with `Crear rutina` available. Step 2: `Solo este día` or `Repetir cada semana` with weekday selection. Rules are defined in Home. | `[0.6, 1]` |
| S3 | Routine Detail | Duplicate action | Target date. Creates `<original name> COPIA` as defined in Routines. The target-date content scrolls on small screens. After saving, returns to the originating screen and shows the copy name, its target date and `Abrir copia` in a snackbar. | `fitToContents` |
| S4 | Routine Detail | Edit recurring weekdays | Seven weekday selections. Saves only the routine's recurring weekdays and never changes one-time dates. A snackbar confirms the update. | `fitToContents` |
| S5 | Home, Routines and `Crear rutina` in S2 | `Nueva` or `Crear rutina` | Routine name and draft exercise list with top `Cancelar`/`Guardar`. Saving without exercises opens S1 automatically. Creating a routine never assigns a date or weekday. | `[1]` |

### Acceptance criteria (all sheets)

- Dragging down closes route sheets and the embedded S1.
- The keyboard never covers an input, on iOS and Android.
- Content respects the top and bottom safe areas. Embedded S1 stays below the top safe area and does not reach the notch.
- Opens in one tap from its trigger.
- Uses only design-system tokens and shared components.
- A successful save closes the sheet and returns to the originating screen.
- S1 uses the same fields and validation from Routine Detail and routine creation; creation uses top actions and chains new entries, while Routine Detail uses footer actions.
- S5 has no navigation-header back button, keeps `Guardar` at the top right and dismisses to the originating screen by dragging down.
- Saving S5 with no exercises opens S1. Saving an exercise opens another blank S1. `Cancelar` in S1 returns to S5 without discarding the draft.
- Task flows never use a centered page dialog, except for a documented web-only fallback after technical validation; Paper dialogs are otherwise reserved for confirmations and brief acknowledgements.
- TypeScript compiles without errors.

## 12. Scope and Design Constraints

- Outside V1: live workout logging, rest timers, exercise videos, challenges, social features, nutrition tracking, AI coaching. Users may enter results after training.
- There is no separate exercise library or global exercise catalog; exercises are configured within individual routines.
- The app is for personal routine planning, workout recording and progression tracking.
- Visual references must not introduce functionality outside V1.
- Any UI component library introduced during implementation must be compatible with React Native, Expo, iOS and Android.
- The approved visual direction, palette, typography and UI component library are defined in `docs/desing/design-system.md`. Treat them as the current baseline and use shared tokens and components instead of screen-specific styling.

Reference documents:
- Product behavior and business rules: `docs/PRD.md`
- Architecture and technical decisions: `docs/architecture/overview.md`
- Database structure, relationships and integrity constraints: `docs/architecture/database.md`
- Frontend organization and dependency rules: `docs/architecture/frontend.md`

## 13. Pending Decisions

These are open and must not be treated as finalized requirements. They must not block features whose requirements are already defined.

- Define the metrics, charts, summaries and detailed behavior of Progress.
- Finalize the presentation of progression suggestions across relevant screens.

Resolved decisions:

- Navigation uses four persistent bottom tabs: Inicio, Rutinas, Progreso and Perfil; secondary screens live in the stack above them.
- Workout History opens from the Home `Actividad` section through `Ver historial`; it is not a bottom-tab destination.
- S1–S5 are the only sheets. S1 is shared with routine creation through the approved embedded-draft exception; S5 is the approved full-height routine creation sheet.
- S5 has no navigation-header back button, uses top `Cancelar`/`Guardar`, opens the first S1 automatically when saving a valid name without exercises, and chains a new blank S1 after each saved exercise. `Cancelar` in S1 returns to the S5 draft.
- Embedded S1 is the only manually draggable sheet because it must preserve the S5 draft; it stays below the top safe area and dismisses from its handle.
- Home keeps its current plan and scroll position while refreshing after a sheet or secondary screen closes.
- Routine Detail shows both recurring weekdays and one-time dates, and one-time dates can be removed without changing recurrence.
- Duplicating a routine returns to the originating screen; the snackbar names the target date and offers `Abrir copia` instead of opening the copy.
- Destructive confirmations use the in-app Paper dialog on native and web.
- The Home greeting is `Hola` until Profile is implemented, then `Hola, <name>`.
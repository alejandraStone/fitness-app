# Design System — Fitness App

## 1. Status

The initial visual system was approved on 2026-10-19 by explicit product
direction. It is the baseline for the routines and scheduling feature and for
future screens unless a later decision updates this document.

- **UI component library:** `react-native-paper` `5.15.3` (MIT).
- **Platform support:** React Native, Expo SDK 58, iOS, Android and web.
- **Icons:** Material Community Icons through `@expo/vector-icons`, using
  Paper's icon adapter.
- **Calendar:** built from Paper primitives and the app's date-only utilities.
  No separate calendar dependency is used.
- **Theme entry point:** `src/shared/ui/theme.ts` exports the Paper theme and
  semantic design tokens.
- **Provider:** `PaperProvider` wraps the app in `src/app/_layout.tsx`.

This decision supersedes the earlier provisional guidance that no UI component
library should be selected as part of the feature. The approved library must be
used consistently; a competing component library must not be added without a
new explicit decision.

## 2. Visual Direction

The app should feel calm, warm, editorial and inclusive. It is a personal
training tool, not a performance-intimidation interface and not a stereotyped
"feminine" theme.

- Warm ivory background and clean white surfaces.
- Deep plum text rather than pure black.
- Rosewood / coral accent for primary actions and selected dates.
- Sage and warm sand as restrained support tones.
- Rounded but not overly playful surfaces, with subtle borders instead of heavy
  shadows.
- Generous spacing and a clear type hierarchy.
- Home opens with a single short greeting: `Hola` until Profile is implemented, then `Hola, <name>`. The calendar follows immediately. Do not use a marketing hero, long motivational subtitle or a `Rutinas` shortcut in the greeting.
- Direct, respectful language. Do not imply that a scheduled routine has been
  completed.
- All user-facing copy is written in Spanish, following the product tone. Code,
  identifiers, comments, tests and technical documentation remain in English
  (`docs/constitution.md` §8).

Color is never the only carrier of meaning. Scheduled dates also have text in
their accessibility labels, source chips carry labels, and action results are
announced through visible feedback.

## 3. Tokens

### Color

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#FAF6F3` | Screen background |
| `surface` | `#FFFFFF` | Cards, dialogs, inputs |
| `surfaceMuted` | `#F7EFEA` | Source chips, quiet groupings |
| `text` | `#2C2029` | Primary text |
| `textMuted` | `#6A5A65` | Supporting text |
| `border` | `#E5D7D1` | Card and input outlines |
| `primary` | `#B4475B` | Primary actions, selected date |
| `primaryPressed` | `#943647` | Pressed primary |
| `primarySoft` | `#F8DDE1` | Greeting and today highlight |
| `onPrimary` | `#FFFFFF` | Text on primary |
| `sage` | `#66795F` | Support tone |
| `sageSoft` | `#E8EEE2` | Support surfaces |
| `sand` | `#A87343` | Support tone |
| `sandSoft` | `#F7E5D4` | Support surfaces |
| `danger` | `#A13A34` | Destructive actions |
| `scrim` | `#000000` | Sheet and dialog scrims |
| `errorBackground` | `#FFEDEC` | Error banners |
| `errorText` | `#6D211D` | Error text |

The same values are mapped into the Material 3 `MD3LightTheme` in
`src/shared/ui/theme.ts`, so Paper components inherit the brand rather than
stock Material colors.

Overlays use the Paper theme `scrim` plus `surface` and `border` tokens. The
sheet grabber uses `border`; the scrim uses `scrim`. The shared scrim opacity is
the `scrimOpacity` token. Do not hardcode overlay RGBA values in screens, sheets
or dialogs.

### Spacing

`4 / 8 / 12 / 16 / 24 / 32` logical pixels, exposed as
`xs / sm / md / lg / xl / xxl`. Use the tokens instead of hard-coded gaps and
padding.

### Radius

- `sm`: 10
- `md`: 14
- `lg`: 20
- `xl`: 28
- `pill`: fully rounded

Cards generally use `lg`; dialogs use `xl`; primary buttons use `pill`.

### Typography

The system platform font is used to avoid an additional font dependency and to
respect native rendering, Dynamic Type and accessibility settings. Typography
uses Paper variants with weights adjusted to `600`, `700` or `800` for emphasis.

| Role | Approximate size |
| --- | --- |
| Display / greeting | 32–34 |
| Screen title | 28 |
| Section heading | 22 |
| Subheading | 17 |
| Body | 16 |
| Small / metadata | 14 |
| Tiny / overline | 12 |

## 4. Component Conventions

- Use `PaperProvider` once at the application root.
- Shared wrappers in `src/shared/ui` own the app's default appearance:
  - `AppButton` for primary, secondary and destructive actions.
  - `SheetTopActions` for the approved top `Cancelar`/`Guardar` rows in sheet forms.
  - `AppTextInput` for outlined fields with field-level error text.
  - `Card` for grouped content.
  - `LoadingState`, `EmptyState`, `ErrorState` and `ErrorBanner` for state
    communication.
- Touchable surfaces use Paper feedback (`Button`, `TouchableRipple`,
  `IconButton`, `Card onPress`, `Chip`).
- Use a persistent four-destination bottom tab bar for top-level navigation:
  Inicio, Rutinas, Progreso and Perfil. Hide it on secondary stack screens.
- Use the approved container hierarchy:
  - bottom tabs for top-level destinations;
  - full-screen stack screens for focused work, except the approved routine creation sheet;
  - Expo Router `formSheet` routes for approved sheets (S2–S5, plus S1 when opened from Routine Detail);
  - in-app Paper dialogs only for destructive confirmations and brief
    acknowledgements;
  - snackbars for operation results.
- S5 is the full-height routine creation sheet. It has no navigation-header back
  button and places `Cancelar` and `Guardar` at the top.
- S1 is a route sheet from Routine Detail and the same embedded sheet during
  routine creation so an unsaved draft is preserved. This is the only approved
  embedded-sheet exception. Embedded S1 shows top `Cancelar`/`Guardar` actions,
  chains a new blank entry after each save, and can be dragged down by its handle.
- Do not use a centered Paper dialog for a multi-step task flow. If a web-only fallback is documented after technical validation, it reuses the same sheet content and actions and is recorded before implementation.
- Dialogs use `Portal` + `Dialog`; operation results use `Snackbar`.
- Confirmation dialogs use the in-app Paper `Dialog` instead of platform
  alerts so the same interaction works on native and web.
- Icons are Material Community Icons with text or accessibility labels nearby
  for meaningful actions.
- Buttons used for primary flows have a minimum content height of 44.

## 5. Scheduling Presentation

- Home opens with a single short greeting (`Hola` until Profile is implemented,
  then `Hola, <name>`) followed immediately by the calendar. Do not use a
  marketing tagline, long subtitle or `Rutinas` shortcut in the greeting.
- The training activity summary and progression suggestions are reserved for
  their approved features. Until Workout Records and Progression exist, do not
  render fake or empty activity data on Home.
- The Home calendar is a fixed six-week, Monday-first grid. A fixed grid avoids
  layout jumps when changing months.
- Dates with scheduled routines show a dot and include the count in the
  accessibility label.
- The selected date is filled with the primary color. Today has a subtle
  outline when it is not selected.
- The selected-date section below the calendar uses a dynamic title:
  `Rutinas de hoy` for today and `Rutinas del día` for another date. It does not
  repeat the selected date or add a generic subtitle.
- Scheduled routine cards show the name, exercise count and a full-width
  `Registrar mi entrenamiento` action with an icon. Tapping the card opens the
  routine summary.
- Do not show `Planificada`, recurrence chips or one-time assignment chips on
  Home. Recurrence and date assignments are summarized in Routine Detail.
- A one-time assignment is removed from the card's overflow menu
  (`Quitar de este día`). The action always asks for confirmation. When the
  routine also repeats on that weekday, the confirmation explains that the
  weekly recurrence remains. The result is announced with a snackbar.
- An empty selected date offers `Usar una rutina` as the primary action and
  `Crear rutina` as the secondary action, both with icons.
- When routines are present, the section header keeps a compact `Añadir` action
  so the user can add another routine to the same date. The add action is not
  shown while the day is loading or in an error state.
- Creating a routine starts it unscheduled. The creation sheet (S5) collects its
  name and draft exercises and explains that it can be assigned later from Home;
  it does not show recurring weekday selection or assign the selected date.
  Saving without exercises opens S1 automatically, and saved exercises chain
  until `Cancelar` returns to the draft.
- The assignment sheet lists existing routines and then asks how to schedule
  the chosen routine:
  - `Solo este día` for a one-time assignment.
  - `Repetir cada semana` for a weekly repetition that always includes the
    selected weekday.
- In the weekly option, the selected weekday and the routine's existing
  recurring weekdays are shown as already scheduled and cannot be removed from
  this flow. The user can add other weekdays. Existing one-time assignments are
  preserved.
- A routine already planned for the selected date remains available in the
  sheet so the user can add other weekdays. The same routine must never appear
  twice on a date.
- `Crear rutina` remains available as a secondary action in the assignment
  sheet, including when the user has no routines yet.
- Routine Detail separates `Se repite` from `Fechas puntuales`. One-time dates
  can be removed there with confirmation and never change weekly recurrence.
  The result is announced with a snackbar.
- Routine Detail actions are compact and live in the header: edit, plus an
  overflow menu with duplicate and delete.
- S1 is the only exercise editor. It opens as a sheet from Routine Detail and as
  the same embedded sheet during routine creation; exercise editing is never a
  full-screen flow. The creation variant keeps `Cancelar`/`Guardar` at the top.
- S4 edits recurring weekdays only. It is a bottom sheet and never changes
  one-time dates. A snackbar confirms the update.
- After duplicating a routine, the sheet closes, the user returns to the
  originating screen and a snackbar names the target date and offers `Abrir
  copia`. The copy is not opened automatically.
- Never use completed-workout visual language, such as checkmarks, completion
  counts or "done" labels, for scheduled routines.
- Removing a one-time date never changes recurring weekdays. The UI explains
  this distinction before the action and in the result message.

## 6. Accessibility and Inclusivity

- Use accessible roles, labels and selected states for dates, chips and actions.
- Keep primary touch targets at least 44 logical pixels where practical.
- Do not rely on color alone to communicate selected or scheduled state.
- Support Dynamic Type and avoid fixed-height body text containers where
  content can grow.
- Use inclusive, non-stereotyped language and imagery. The visual direction is
  warm and expressive without assigning gender roles to training.
- Move focus to the title of an opened sheet or dialog and restore focus to its
  trigger when it closes.
- Announce operation results through visible snackbars or error banners; never
  rely on color alone.
- Destructive actions require confirmation and clear labels.

## 7. Boundaries

- UI components must not access SQLite or repositories directly.
- Business rules remain in the Domain and Application layers.
- Feature-specific scheduling logic lives in `src/features/scheduling`; shared
  presentation lives in `src/shared/ui`; reusable routine presentation lives in
  `src/entities/routine`.
- Do not add a second UI or state-management library without an explicit,
  documented decision.

# Design System — Fitness App

## 1. Status

The initial visual system was approved on 2026-10-19 by explicit product
direction. It is the baseline for the routines and scheduling feature and for
future screens unless a later decision updates this document.

The 2026-11-16 saved-workout summary redesign updated the global palette to a
violet, ivory and lime identity and introduced Nunito and bundled vector
illustrations. The tokens below are the current baseline for every screen; the
previous rose-primary palette is superseded.

- **UI component library:** `react-native-paper` `5.15.3` (MIT).
- **Platform support:** React Native, Expo SDK 58, iOS, Android and web.
- **Icons:** Material Community Icons through `@expo/vector-icons`, using
  Paper's icon adapter. Icons are used for functional actions, never as a
  substitute for illustration.
- **Illustrations:** original vector artwork rendered with `react-native-svg`
  `15.16.0` (MIT) and bundled in the application. No remote images, stock
  photography, emoji substitutes or gradient/illustration libraries are used.
- **Typography:** Nunito static weights 400, 600, 700 and 800, bundled under
  the SIL Open Font License 1.1 in `assets/fonts`. Shared buttons and inputs and
  the redesigned workout summary use Nunito explicitly.
- **Calendar:** built from Paper primitives and the app's date-only utilities.
  No separate calendar dependency is used.
- **Theme entry point:** `src/shared/ui/theme.ts` exports the Paper theme and
  semantic design tokens.
- **Provider:** `PaperProvider` wraps the app in `src/app/_layout.tsx`; fonts are
  loaded there before the app renders.

This decision supersedes the earlier provisional guidance that no UI component
library should be selected as part of the feature. The approved library must be
used consistently; a competing component library must not be added without a
new explicit decision.

## 2. Visual Direction

The app should feel warm, optimistic, modern and inclusive. It is a personal
training tool, not a performance-intimidation interface and not a stereotyped
"feminine" theme.

- Sun-washed ivory background with clean white cards and soft lavender or blush
  surfaces.
- Deep plum text rather than pure black.
- Vivid violet for primary actions and selected dates.
- Soft lime for positive and completed states, supported by restrained rose,
  coral, peach, sage and sand accents.
- Generously rounded surfaces, pill actions and subtle, diffuse shadows instead
  of hard borders everywhere.
- Generous spacing and a clear type hierarchy.
- Original bundled vector illustrations carry the celebratory moments. Do not
  substitute emojis or stock photography, and do not introduce remote images.
- Home opens with a single short greeting: `Hola` until Profile is implemented, then `Hola, <name>`. The calendar follows immediately. Do not use a marketing hero, long motivational subtitle or a `Rutinas` shortcut in the greeting.
- Direct, respectful language. Do not imply that a scheduled routine has been
  completed.
- All user-facing copy is written in Spanish, following the product tone. Code,
  identifiers, comments, tests and technical documentation remain in English
  (`docs/constitution.md` §8).

Color is never the only carrier of meaning. Scheduled dates also have text in
their accessibility labels, source chips carry labels, and errors are presented
with clear text.

## 3. Tokens

### Color

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#FBF6F2` | Screen background |
| `surface` | `#FFFFFF` | Cards, dialogs, inputs |
| `surfaceMuted` | `#F9F0EB` | Source chips, quiet groupings |
| `surfaceLavender` | `#F5EFFC` | Progression and celebratory surfaces |
| `surfaceSet` | `#F4EEFB` | Set rows and inline pills |
| `text` | `#2D1B36` | Primary text |
| `textMuted` | `#7A6A77` | Supporting text |
| `border` | `#EEE0DB` | Card and input outlines |
| `primary` | `#6C2BD9` | Primary actions, selected date |
| `primaryPressed` | `#571FB3` | Pressed primary |
| `primarySoft` | `#EFE4FC` | Greeting and selected highlight |
| `primarySoftStrong` | `#E2D2F7` | Stronger primary tint |
| `onPrimary` | `#FFFFFF` | Text on primary |
| `secondary` | `#F1ECF8` | Tonal secondary surfaces |
| `secondaryPressed` | `#E6DEEE` | Pressed tonal secondary |
| `onSecondary` | `#4E2D72` | Text on tonal secondary |
| `sage` | `#71893F` | Support and progression tone |
| `sageSoft` | `#F0F6D9` | Support surfaces |
| `positive` | `#DDF28C` | Completed and achievement states |
| `positivePressed` | `#CCE874` | Pressed positive |
| `positiveSoft` | `#F4F9DF` | Small achievement chips |
| `onPositive` | `#39480F` | Text and icons on positive |
| `sand` | `#A87343` | Support tone |
| `sandSoft` | `#F8E9D8` | Support surfaces |
| `rose` | `#B05168` | Statistic icons and warm accent |
| `roseSoft` | `#FBE7E9` | Softer rose surface |
| `blush` | `#FBE8E7` | Statistics strip |
| `lavender` | `#F1E7FB` | Badges and icon circles |
| `lavenderStrong` | `#E4D4F7` | Stronger lavender surface |
| `ink` | `#301A45` | Final summary action |
| `onInk` | `#FFFFFF` | Text on ink |
| `peach` | `#FBE3CC` | Illustration backdrop |
| `gold` | `#E4A62F` | Trophy accent |
| `coral` | `#ED8C82` | Illustration accent |
| `danger` | `#A13A34` | Destructive actions |
| `dangerPressed` | `#822D28` | Pressed destructive action |
| `onDanger` | `#FFFFFF` | Text on destructive action |
| `disabled` | `#B9ACB2` | Disabled controls |
| `inputBackground` | `#FFFFFF` | Text input surface |
| `scrim` | `#000000` | Sheet and dialog scrims |
| `scrimOpacity` | `0.45` | Shared scrim opacity |
| `errorBackground` | `#FFEDEC` | Error banners |
| `errorBorder` | `#E5B5B1` | Error input outlines |
| `errorText` | `#6D211D` | Error text |

Core values are mapped into the Material 3 `MD3LightTheme` in
`src/shared/ui/theme.ts`, so Paper components inherit the brand rather than
stock Material colors. The additional semantic surfaces and accents are used
through the exported `colors` object.

Overlays use the Paper theme `scrim` plus `surface` and `border` tokens. The
sheet grabber uses `border`; the scrim uses `scrim`. The shared scrim opacity is
the `scrimOpacity` token. Do not hardcode overlay RGBA values in screens, sheets
or dialogs.

### Spacing

`4 / 8 / 12 / 16 / 24 / 32` logical pixels, exposed as
`xs / sm / md / lg / xl / xxl`. Use the tokens instead of hard-coded gaps and
padding.

### Sheet Header Spacing

- `SheetScaffold` owns the outer spacing for every sheet header, body and footer.
  Screens that compose a sheet must not add their own header margins.
- Header and body content align to `spacing.lg` (16) horizontally. Header
  actions inherit that margin from the scaffold; `SheetHeaderAction` keeps its
  compact internal padding at zero.
- The title and an action row use the same vertical padding. On iOS form sheets,
  the header reserves `spacing.xxl` (32) above its content so the native grabber
  does not crowd the title. Embedded sheets already reserve space with their
  handle area; the web dialog uses the Paper dialog spacing.

### Radius

- `sm`: 10
- `md`: 14
- `lg`: 20
- `xl`: 28
- `pill`: fully rounded

Cards generally use `lg`; dialogs use `xl`; primary buttons use `pill`.

### Typography

Nunito is bundled with the application in four static weights and used
explicitly by the redesigned workout summary, `AppButton` and `AppTextInput`.
Text in screens that have not been migrated yet keeps the platform font, so
Dynamic Type and native text rendering remain available. Do not use Nunito
weights that are not bundled; the family is referenced through the `fonts`
tokens in `src/shared/ui/theme.ts`.

| Role | Family | Approximate size |
| --- | --- | --- |
| Display / greeting | Nunito ExtraBold | 34 |
| Hero | Nunito ExtraBold | 32 |
| Screen / section title | Nunito ExtraBold | 28 / 22 |
| Subheading | Nunito Bold | 17 |
| Body | Nunito Regular | 16 |
| Button label | Nunito Bold | 14 |
| Small / metadata | Nunito SemiBold | 12–14 |
| Tiny / overline | Nunito Bold | 10–12 |

Nunito is distributed under the SIL Open Font License 1.1. The license text is
kept with the font files in `assets/fonts/Nunito-OFL.txt`.

## 4. Component Conventions

- Use `PaperProvider` once at the application root.
- Shared wrappers in `src/shared/ui` own the app's default appearance:
  - `AppButton` for primary, secondary, outline, progress/acceptance, dark and
    destructive actions. `progress` uses `colors.sage`; `dark` uses `colors.ink`
    and is reserved for the final workout-summary action. All variants are
    pill-shaped with a minimum content height of 44.
  - `SheetHeaderAction` for compact actions in a navigation header or on either
    side of a sheet title, such as `Cancelar`/`Guardar` or
    `Cancelar`/`Continuar`.
  - `AppTextInput` for outlined fields with field-level error text.
  - `Card` for grouped content.
  - `LoadingState`, `EmptyState`, `ErrorState` and `ErrorBanner` for state
    communication.
- Celebratory surfaces use the original illustrations in
  `src/features/workout-detail/WorkoutSummaryIllustrations.tsx`,
  `src/shared/ui/CelebrationIllustrations.tsx` and
  `src/entities/workout/ExerciseThumbnailIllustration.tsx`. Illustrations are
  decorative: their containers are marked non-interactive, and adjacent text
  carries the meaning.
- A screen may replace the native navigation header with an in-screen header
  when the composition requires it, as Workout Detail does. The in-screen header
  still exposes a clear back action, a centered title, 44-pixel touch targets
  and safe-area support.
- Touchable surfaces use Paper feedback (`Button`, `TouchableRipple`,
  `IconButton`, `Card onPress`, `Chip`).
- Use a persistent four-destination bottom tab bar for top-level navigation:
  Inicio, Rutinas, Progreso and Perfil. Hide it on secondary stack screens.
- Use the approved container hierarchy:
  - bottom tabs for top-level destinations;
  - full-screen stack screens for focused work, except the approved routine creation sheet;
  - Expo Router `formSheet` routes for approved sheets (S2–S5, plus S1 when opened from Routine Detail);
  - in-app Paper dialogs only for destructive confirmations, brief
    acknowledgements and the single-field `Aumentar peso` confirmation in
    Workout Detail.
- S5 is the full-height routine creation sheet. It has no navigation-header back
  button and places `Cancelar` and `Continuar` on either side of its title. It
  collects the routine name and optional planning; it never renders an exercise
  section or exercise list.
- S1 is a route sheet from Routine Detail and the same embedded sheet during
  routine creation so the unsaved name and planning are preserved. This is the
  only approved embedded-sheet exception. S1 places `Cancelar` and `Guardar` on
  either side of its title. Saving the embedded first exercise creates the
  routine and opens Routine Detail; `Cancelar` returns to S5. It never opens
  another exercise form automatically. Embedded S1 covers S5 below the top safe
  area and can be dragged down by its handle.
- Do not use a centered Paper dialog for a multi-step task flow. If a web-only fallback is documented after technical validation, it reuses the same sheet content and actions and is recorded before implementation.
- Dialogs use `Portal` + `Dialog`. When a dialog is opened from a native `formSheet`, host the portal inside that route so the dialog renders above the sheet.
- Confirmation dialogs use the in-app Paper `Dialog` instead of platform
  alerts so the same interaction works on native and web.
- Icons are Material Community Icons with text or accessibility labels nearby
  for meaningful actions.
- Buttons used for primary flows have a minimum content height of 44.

## 5. Scheduling and Workout Presentation

- Home opens with a single short greeting (`Hola` until Profile is implemented,
  then `Hola, <name>`) followed immediately by the calendar. Do not use a
  marketing tagline, long subtitle or `Rutinas` shortcut in the greeting.
- The `Actividad` section appears below the selected-date section. It shows the
  number of saved workouts in the visible month, uses a Spanish empty message
  when the month has none, and keeps `Ver historial` available in both states.
  Only saved workouts count; scheduled routines, planned sessions and planned
  targets never count as completed training. Progression suggestions remain
  reserved for the Progression feature and are not rendered as placeholders.
- The Home calendar is a fixed six-week, Monday-first grid. A fixed grid avoids
  layout jumps when changing months.
- Dates with scheduled routines show a small primary-color dot. Dates with
  saved workouts show a small sage-colored bar. A date with both states shows
  both markers side by side, so the distinction does not rely on color alone.
  The selected date renders both markers in the on-primary color.
- A legend below the calendar labels the dot as `Rutina programada` and the bar
  as `Entrenamiento guardado`. Calendar accessibility labels include both the
  scheduled-routine count and the saved-workout count for the date. Saved
  workouts keep their marker even when their source routine is no longer
  scheduled or has been deleted.
- The selected date is filled with the primary color. Today has a subtle
  outline when it is not selected.
- The selected-date section below the calendar uses a dynamic title:
  `Rutinas de hoy` for today and `Rutinas del día` for another date. It does not
  repeat the selected date or add a generic subtitle.
- Scheduled routine cards show the name, exercise count and one full-width
  workout action with an icon: `Registrar mi entrenamiento` for a today or past
  date without a saved workout, or `Ver entrenamiento` when a saved workout
  exists. A future date shows no recording action. Tapping the card still opens
  the routine summary.
- Do not show `Planificada`, recurrence chips or one-time assignment chips on
  Home. Recurrence and date assignments are summarized in Routine Detail.
- A one-time assignment is removed from the card's overflow menu
  (`Quitar de este día`). The action always asks for confirmation. When the
  routine also repeats on that weekday, the confirmation explains that the
  weekly recurrence remains. The card and calendar update immediately.
- An empty selected date offers `Usar una rutina` as the primary action and
  `Crear rutina` as the secondary action, both with icons.
- When routines are present, the section header keeps a compact `Añadir` action
  so the user can add another routine to the same date. The add action is not
  shown while the day is loading or in an error state.
- Creating a routine collects its name and optional recurring weekdays
  (Monday–Sunday) in S5. It does not show an exercise section or assign the
  selected date. `Continuar` opens S1 for the first exercise; saving that
  exercise creates the routine and opens Routine Detail. If no weekdays are
  selected, the routine is saved as `Sin programar` and can be assigned later
  from Home. Additional exercises are added from Routine Detail.
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
  The detail updates immediately after removal.
- Routine-level actions live on each Routines-list card: a copy icon opens S3
  and a pencil icon opens the name editor. Tapping the rest of the card opens
  Routine Detail. The name editor places `Guardar` in the navigation header,
  has no Cancel action, and exposes deletion as a borderless destructive text
  action at the bottom; planning remains in S4 and exercise editing in S1.
  Routine Detail has no routine-level header actions.
- S1 is the only exercise editor. It opens as a sheet from Routine Detail and as
  the same embedded sheet during routine creation; exercise editing is never a
  full-screen flow. Both variants place `Cancelar`/`Guardar` on either side of
  the title. Saving the embedded first exercise creates the routine and opens
  Routine Detail; `Cancelar` returns to the S5 name and planning draft.
- S4 edits recurring weekdays only. It is a bottom sheet and never changes
  one-time dates.
- After duplicating a routine, the sheet closes and the user returns to the
  Routines list. The copy is not opened automatically.
- Never use completed-workout visual language, such as checkmarks, completion
  counts or "done" labels, for scheduled routines.
- Removing a one-time date never changes recurring weekdays. The UI explains
  this distinction before the action.
- Record Workout and Edit Workout reuse the same exercise cards, one
  weight/repetition row per planned set, inline field errors and previous
  performance presentation. Inputs are prefilled with the planned weight when
  recording and with the saved actual values when editing. Neither flow can add,
  remove or skip exercises or sets.
- Workout Detail uses a full-screen celebration composition. The native
  navigation header is hidden; the route renders a custom in-screen header over
  a warm illustrated backdrop with botanical corners. The header keeps a
  44-pixel translucent back circle, a centered `Resumen` title, safe-area support
  and an optional compact pencil action. It never shows a routine-level
  destructive action.
- The hero contains the original dumbbell illustration, the centered
  `¡Entrenamiento completado!` heading, one short supportive subtitle and the
  workout date. The exercise, set and repetition totals share one blush
  statistics strip with rose icons and `${value}` / label pairs. There are no
  three competing statistic cards.
- Exercises render as white, generously rounded cards below the
  `Ejercicios realizados` heading and its lavender count badge. Each collapsed
  card shows an original thumbnail, the exercise name, planned sets and
  repetition range, a `Peso usado` pill and a factual completion pill such as
  `3 de 3 series` or `2 de 3 series`. The completion pill uses the positive
  lime when complete and the soft sand tone when incomplete; it never repeats a
  recommendation. Expanding the card reveals the snapshot note and one aligned
  row per recorded set with actual weight, repetitions and any surplus
  repetitions. Exercise cards expose no progression actions.
- A sticky footer above the bottom safe area holds one dark `Finalizar` action
  with a lime check. It reuses the screen's existing leave behavior and does not
  introduce a new destination.
- Pending progression recommendations appear in one `Tu progresión` block
  between the hero and `Ejercicios realizados`. The block starts with the
  progress badge and section heading. A single recommendation keeps the full
  prototype-style card: a lavender surface with sparkles, a trophy, the
  exercise-name tag, the current planned weight, `¡Superaste tu meta!`, a lime
  `Objetivo cumplido` tag, a short explanation with the recorded repetitions and
  the target, and the actions. Multiple recommendations share one compact
  lavender header (`¡Superaste tus metas!`, the number of exercises and one short
  explanation) followed by white expandable rows. Each row shows the exercise
  name, goal indicator, repetitions, current weight and an expand control.
  Expanding it reveals `Aumentar peso`, `Mantener peso` and `Decidir después`
  without repeating the long explanation. No recommendation renders no block at
  all.
- `Aumentar peso` opens the single-field in-app dialog with an empty
  `Nuevo peso (kg)` field. The application never suggests, pre-fills or
  auto-applies an increment. `Mantener peso` persists the keep-weight decision
  and removes the affected recommendation immediately. `Decidir después`
  collapses the card or row without persisting anything. The block is omitted
  while recommendations load or refresh and when evaluation fails. Persistence
  failures stay inline. No success snackbar, badge or confirmation is used.
- Workout History groups saved workouts by month, newest first, and shows the
  date, historical routine name and `N ejercicios · N series`. It never includes
  scheduled routines that have not been saved.
- Saving or editing a workout shows no success snackbar; Workout Detail is the
  confirmation.

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
- Present operation failures through inline error messages or error banners;
  never rely on color alone.
- Destructive actions require confirmation and clear labels.

## 7. Boundaries

- UI components must not access SQLite or repositories directly.
- Business rules remain in the Domain and Application layers.
- Feature-specific scheduling logic lives in `src/features/scheduling`; shared
  presentation lives in `src/shared/ui`; reusable routine presentation lives in
  `src/entities/routine`.
- Do not add a second UI or state-management library without an explicit,
  documented decision.

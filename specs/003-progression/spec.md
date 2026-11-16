# Feature Specification: Progression

## 1. Purpose

Present advisory progression recommendations derived from saved workout performance. When every set of an exercise reaches its recorded maximum repetition target, Workout Detail presents the recommendation inside the saved-workout summary: a single pending recommendation uses one full recommendation card, while multiple recommendations share a compact header and expand as separate rows. The user decides whether to enter and confirm a new planned weight, keep the current one or decide later; the application never calculates or applies an increment automatically.

This specification covers progression recommendations only. Progression charts and personal records are not included.

## 2. Scope

### In scope

- Evaluate saved workouts for progression recommendations.
- Show pending recommendations in Workout Detail inside the saved-workout summary.
- Let the user enter and confirm a new planned weight from the recommendation.
- Let the user keep the current planned weight without changing the routine.
- Let the user postpone the decision without changing the routine.
- Persist the keep-weight decision locally.
- Recalculate recommendations when a workout or routine changes.
- Store all data in SQLite and work offline.

### Out of scope

- Progression charts and personal records.
- Recommendations on Home, Workout History, Record Workout, Routine Detail, Progress tab, or Exercise Progress.
- Automatic changes to the planned weight.
- Specific weight increments or weight suggestions.
- Recommendations for exercises with zero planned external weight.
- Direct navigation to a specific exercise edit sheet.
- Notifications, badges, popups, success snackbars, and History markers.
- Weight unit selection or conversion.
- Backend services, accounts, cloud storage, or synchronization.

## 3. User Stories

- As a user, I want to know when I completed every set at or above the maximum target so that I can decide whether to increase the planned weight.
- As a user, I want to enter and confirm the weight I choose without the app deciding the increment for me.
- As a user, I want the recommendation to stay visible near the workout result without interrupting me with repeated popups.
- As a user, I want to keep the current weight or leave the decision for later without the routine changing automatically.
- As a user, I want the recommendation to remain accurate after I edit a workout or a routine.

## 4. Definitions

- **Saved workout**: A workout persisted by the Workout Records feature. Drafts and scheduled routines never qualify.
- **Planned maximum**: `WorkoutExercise.plannedRepsMax` captured in the saved workout snapshot.
- **Qualifying exercise**: A workout exercise with `plannedWeightKg > 0`, exactly `plannedSets` recorded sets, and every set with `reps >= plannedRepsMax`.
- **Normalized exercise name**: The historical exercise name after trimming whitespace, applying Unicode NFC normalization, and lowercasing. This is the same identity rule used for previous performance.
- **Latest session**: The saved workout that is newest for a normalized exercise name. Ordering is `date DESC`, then `savedAt DESC`, then workout identifier ascending. When one workout contains multiple exercises with the same normalized name, the exercise with the lowest display order is used; ties use the lowest exercise identifier.
- **Keep-weight decision**: A persisted user decision to keep the current planned weight for one workout exercise.
- **Manual weight increase**: A user-entered and confirmed planned weight, strictly greater than the current planned weight, applied only to the matching current routine exercise.
- **Postponed recommendation**: A pending recommendation whose row the user collapsed with `Decidir después`. It has no persisted state and remains pending on the next visit.
- **Pending recommendation**: A qualifying exercise in its latest session whose source routine and current exercise configuration still make the recommendation actionable, and that has no keep-weight decision.

## 5. Functional Requirements

### FR-01: Recommendation eligibility

The application MUST evaluate each exercise in a saved workout.

An exercise qualifies only when:

- `plannedWeightKg > 0`.
- The workout exercise contains exactly `plannedSets` sets.
- Every set has `reps >= plannedRepsMax`.

Exceeding the planned maximum is valid and MUST NOT invalidate the recommendation.

Eligibility MUST use the planned values stored in the workout snapshot and the actual recorded sets. It MUST NOT use the current routine targets as performance data.

An exercise with `plannedWeightKg === 0` MUST NOT produce a recommendation.

### FR-02: Latest-session scope

Exercise identity MUST use the normalized exercise name across all saved workouts, matching the existing previous-performance rule.

Only the latest session for a normalized exercise name can produce a pending recommendation.

A newer saved workout for the same normalized exercise name MUST make all older recommendations for that name non-pending, even when the newer workout does not qualify.

When a workout contains multiple exercises with the same normalized name, only the exercise selected by the latest-session rule in Section 4 is evaluated. The other duplicates MUST NOT produce recommendations.

### FR-03: Pending conditions and resolution

A recommendation is pending only when all of the following are true:

- The workout exercise qualifies under FR-01.
- The workout is the latest session for the normalized exercise name.
- The source routine still exists.
- The current routine contains exactly one exercise with the same normalized name.
- The current planned weight of that routine exercise equals the snapshot `plannedWeightKg`.
- No keep-weight decision exists for the workout exercise identifier.

A recommendation is resolved and MUST NOT be shown when:

- The current planned weight differs from the snapshot `plannedWeightKg`.
- A keep-weight decision exists.
- The source routine no longer exists.
- The current routine contains zero or more than one matching exercise.
- A newer saved workout exists for the same normalized exercise name.

If the current planned weight is restored to the snapshot value and no keep-weight decision exists, the recommendation becomes eligible again.

Changing the routine's planned weight MUST NOT modify any saved workout or snapshot.

A new qualifying workout for the same normalized exercise name creates a new pending recommendation. Keep-weight decisions from older workout exercises MUST NOT suppress it.

### FR-04: Presentation in Workout Detail

Workout Detail MUST present pending recommendations in one `Tu progresión` block placed after the celebratory summary and before `Ejercicios realizados`.

A single pending recommendation MUST use one full recommendation card on a lavender surface. The card MUST show:

- the exercise name and the current planned weight;
- a celebratory `¡Superaste tu meta!` heading;
- an `Objetivo cumplido` indicator that combines a positive icon with text, so color is not the only signal;
- a short explanation with the recorded repetitions and the maximum target per set;
- the actions `Aumentar peso`, `Mantener peso` and `Decidir después`.

When multiple recommendations are pending, they MUST share one compact lavender header with the trophy artwork, `¡Superaste tus metas!`, the number of exercises and one short explanation. Each recommendation MUST render as a white expandable row. A collapsed row MUST show the exercise name, the `Objetivo cumplido` indicator, the recorded repetitions, the current planned weight and an expand control. Expanding the row MUST reveal the three actions without repeating the long explanation.

Exercise result cards MUST show only the recorded exercise information and MUST NOT duplicate recommendation actions or content.

The application MUST NOT suggest, calculate, prefill or prescribe a specific weight increment.

When no pending recommendation exists, the block MUST NOT render at all. No empty card, placeholder, hint or protagonist section is allowed.

Recommendation evaluation MUST NOT introduce a separate blocking loading state. The block MUST be omitted while recommendations load or refresh and when evaluation fails, and Workout Detail MUST remain usable.

The feature MUST NOT add recommendation content to Record Workout, Home, Workout History, Routine Detail, Progress or Exercise Progress.

### FR-05: Recommendation actions

`Aumentar peso` MUST open an in-app dialog that shows the current planned weight and an empty `Nuevo peso (kg)` field. The dialog MUST validate that the entered value is a finite number greater than the current planned weight and MUST show Spanish feedback otherwise. It MUST NOT prefill or suggest a value.

Confirming the dialog MUST update only the matching current routine exercise's planned weight through the existing routine update rules, preserving its name, sets, target repetitions, notes, order and schedule. It MUST NOT modify saved workouts, historical snapshots or keep-weight decisions. After a successful update, the recommendation MUST disappear immediately because the current planned weight no longer matches the snapshot.

If the increase cannot be saved, the dialog MUST remain open and show `No se pudo actualizar el peso. Inténtalo de nuevo.` Retry MUST be available.

`Mantener peso` MUST persist a keep-weight decision and remove the affected recommendation from the section immediately. It MUST NOT change the routine or any workout snapshot.

`Decidir después` MUST collapse the single recommendation card or the affected row and leave the recommendation pending. It MUST NOT persist anything or change the routine or any workout snapshot.

The application MUST prevent duplicate submissions and show a busy state while persistence is in progress.

If a keep-weight decision cannot be saved, the recommendation MUST remain visible and the section MUST show the Spanish error message `No se pudo guardar tu decisión. Inténtalo de nuevo.` Retry MUST be available.

No success snackbar is shown when a decision or a manual weight increase is saved.

### FR-06: Persistence

Recommendations MUST be derived from saved workouts and MUST NOT be stored as duplicated recommendation records.

The application MUST persist keep-weight decisions in SQLite, keyed by the stable workout exercise identifier, with the decision and timestamp. Decisions MUST survive application restarts.

Editing a workout MUST NOT delete its keep-weight decision. Deleting a workout through an authorized internal operation MAY cascade-delete its decisions.

Changing a routine's planned weight MUST NOT create a keep-weight decision; resolution by weight change is derived. This also applies to a weight confirmed through `Aumentar peso`.

The feature MUST work offline and persist across restarts.

### FR-07: Recalculation

Workout Detail MUST evaluate recommendations when it loads and when it regains focus after an edit or secondary screen closes.

If a workout is edited so that any set falls below the planned maximum, its recommendations MUST disappear.

If the workout is edited back to qualify, recommendations MUST reappear unless a keep-weight decision exists or another pending condition fails.

Routine weight changes MUST be reflected when the user returns to Workout Detail.

The application MUST NOT display stale recommendations after a successful workout edit, routine edit, or keep-weight decision.

### FR-08: Language and accessibility

Every user-facing message MUST be written in Spanish.

The `Tu progresión` heading and each recommendation card or row MUST expose accessibility labels that include the exercise name, current planned weight, actual repetitions, planned maximum and the fact that the objective was met where applicable. The expand or collapse control MUST expose its expanded or collapsed state.

The `Aumentar peso`, `Mantener peso` and `Decidir después` controls MUST have clear accessibility labels and touch targets of at least 44 logical pixels.

The recommendation status MUST NOT rely on color alone.

Workout completion may use celebratory imagery and copy. Recommendation actions MUST remain calm and advisory, MUST NOT use warning styling and MUST NOT prescribe an increment.

## 6. Acceptance Criteria

### AC-01: Show a qualifying recommendation

**Given** a saved workout has an exercise with planned external weight and every set at or above the planned maximum,

**When** the user opens that workout's detail,

**Then** the `Tu progresión` block MUST show one full recommendation card with the exercise name, the current planned weight, the `Objetivo cumplido` indicator, the recorded repetitions, the maximum target per set, `Aumentar peso`, `Mantener peso` and `Decidir después`.

**And** no modal, dialog or snackbar MUST be shown before the user opens the increase dialog.

### AC-02: Hide non-qualifying exercises

**Given** an exercise has any set below the planned maximum, or has zero planned external weight,

**When** Workout Detail is shown,

**Then** that exercise MUST NOT appear in the `Tu progresión` block.

### AC-03: Show only the latest session

**Given** two saved workouts contain the same normalized exercise name,

**When** the user opens the older workout's detail,

**Then** its recommendation MUST NOT appear.

**When** the user opens the newer workout's detail,

**Then** its recommendation MUST appear only if the newer workout qualifies.

### AC-04: Group multiple exercises in one block

**Given** one workout has multiple qualifying exercises,

**When** Workout Detail is shown,

**Then** one `Tu progresión` block MUST render one shared header and all pending recommendations as separate expandable rows, each expandable independently.

### AC-05: Resolve through a routine weight change

**Given** a pending recommendation exists,

**When** the user changes the matching routine exercise's planned weight and returns to Workout Detail,

**Then** the recommendation MUST disappear.

**When** the user restores the planned weight to the snapshot value and no keep-weight decision exists,

**Then** the recommendation MAY become eligible again.

### AC-06: Hide when the routine or exercise is unavailable

**Given** the source routine is deleted, or the current routine has zero or multiple exercises with the normalized name,

**When** Workout Detail is shown,

**Then** no recommendation for that exercise MUST appear.

### AC-07: Increase the weight manually

**Given** a pending recommendation is visible,

**When** the user taps `Aumentar peso`,

**Then** an in-app dialog MUST open with the current planned weight, an empty weight field and a confirmation action.

**And** the application MUST NOT prefill or suggest a new weight.

**When** the user enters a valid value greater than the current weight and confirms,

**Then** only the matching current routine exercise's planned weight MUST change, its other fields and schedule MUST be preserved, the saved workout MUST remain unchanged, and the recommendation MUST disappear.

**When** the user enters an empty, invalid or non-increasing value,

**Then** the dialog MUST show Spanish validation feedback and MUST NOT save.

### AC-08: Keep the current weight

**Given** a pending recommendation is visible,

**When** the user taps `Mantener peso`,

**Then** the decision MUST persist and the recommendation MUST disappear immediately.

**And** the routine and workout snapshots MUST remain unchanged.

**When** the application restarts and the user reopens the same Workout Detail,

**Then** the recommendation MUST remain hidden.

### AC-09: Recalculate after workout edits

**Given** a saved workout has a pending recommendation,

**When** the user edits any set below the planned maximum and returns to Workout Detail,

**Then** the recommendation MUST disappear.

**When** the workout is edited back to qualify and no keep-weight decision exists,

**Then** the recommendation MUST reappear.

### AC-10: Preserve user control

**Given** a recommendation is displayed,

**When** the user does not act,

**Then** no planned weight or routine configuration MUST change.

**And** the application MUST NOT propose a specific increment.

### AC-11: Spanish and offline behavior

**Given** the application has no Internet connection,

**When** the user views a recommendation, keeps the current weight or confirms a manual new weight,

**Then** the operation MUST complete locally and any persisted decision MUST survive a restart.

**And** every visible message and accessibility label MUST be in Spanish.

### AC-12: Decide later without changing data

**Given** an expanded pending recommendation,

**When** the user taps `Decidir después`,

**Then** the card or row MUST collapse and the recommendation MUST remain pending.

**And** no routine, workout snapshot or decision MUST change.

### AC-13: No recommendations

**Given** the workout has no pending recommendation,

**When** Workout Detail is shown,

**Then** no empty progression block, card or placeholder MUST render.

**And** no recommendation hint or empty-state section is shown.

## 7. Dependencies and Assumptions

- `specs/002-workout-records/spec.md` defines saved workouts, historical snapshots, actual sets, and editing.
- `specs/001-routines/spec.md` defines routines, exercise configuration, and Routine Detail.
- `docs/PRD.md` Section 3.7 defines the recommendation rule and advisory behavior.
- `docs/architecture/database.md` Section 6 defines progression data as derived from saved workouts.
- `docs/desing/screens.md` defines Workout Detail, Routine Detail, and future Progress screens.
- `docs/desing/design-system.md` defines visual and accessibility conventions.
- Workout Records guarantees that every saved workout contains all planned sets with positive repetitions.
- Workout dates and saved timestamps are immutable after saving.
- Weight unit selection remains deferred; planned and actual weights are stored and displayed in kilograms.
- The Progress tab, Exercise Progress, Home recommendations, charts, and personal records remain future work.

## 8. Resolved Decisions

- Recommendations are presented only in Workout Detail for this feature. A single recommendation uses one full card; multiple recommendations share a compact header and separate expandable rows.
- Pending scope is the latest saved session per normalized exercise name.
- Recommendations are hidden when the source routine is deleted or the current exercise cannot be matched uniquely.
- `Aumentar peso` opens a manual-entry dialog and updates the matching current routine exercise through the existing routine update use case. No new persistence or recommendation record is introduced.
- `Mantener peso` persists the keep-weight decision. `Decidir después` only collapses the card or row and persists nothing.
- Exercises with zero planned external weight are excluded from recommendations in this feature.
- The application never suggests a specific increment or pre-fills the new weight.

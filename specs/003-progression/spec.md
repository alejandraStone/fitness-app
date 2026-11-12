# Feature Specification: Progression

## 1. Purpose

Present advisory progression recommendations derived from saved workout performance. When every set of an exercise reaches its recorded maximum repetition target, Workout Detail presents a compact recommendation to consider increasing the planned weight. The user decides whether to act; the application never changes the routine automatically.

This specification covers progression recommendations only. Progression charts and personal records are not included.

## 2. Scope

### In scope

- Evaluate saved workouts for progression recommendations.
- Show pending recommendations in Workout Detail.
- Let the user open Routine Detail to review and change the planned weight.
- Let the user keep the current planned weight without changing the routine.
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
- As a user, I want the recommendation to stay visible near the workout result without interrupting me with repeated popups.
- As a user, I want to keep the current weight without the routine changing automatically.
- As a user, I want the recommendation to remain accurate after I edit a workout or a routine.

## 4. Definitions

- **Saved workout**: A workout persisted by the Workout Records feature. Drafts and scheduled routines never qualify.
- **Planned maximum**: `WorkoutExercise.plannedRepsMax` captured in the saved workout snapshot.
- **Qualifying exercise**: A workout exercise with `plannedWeightKg > 0`, exactly `plannedSets` recorded sets, and every set with `reps >= plannedRepsMax`.
- **Normalized exercise name**: The historical exercise name after trimming whitespace, applying Unicode NFC normalization, and lowercasing. This is the same identity rule used for previous performance.
- **Latest session**: The saved workout that is newest for a normalized exercise name. Ordering is `date DESC`, then `savedAt DESC`, then workout identifier ascending. When one workout contains multiple exercises with the same normalized name, the exercise with the lowest display order is used; ties use the lowest exercise identifier.
- **Keep-weight decision**: A persisted user decision to keep the current planned weight for one workout exercise.
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

Workout Detail MUST render one compact recommendation card when at least one pending recommendation exists for the displayed workout.

The card MUST be placed after the workout summary card and before the `Ejercicios` section.

The card MUST contain:

- The title `Progresión`.
- The message `Has alcanzado el máximo en estas series. Puedes considerar subir el peso.`
- One row per pending recommendation, formatted as `{exercise name} · {reps joined with " / "} (objetivo {plannedRepsMax})`.
- A `Revisar peso` action.
- A `Mantener peso` action.

Example row: `Sentadilla · 8 / 8 / 9 / 10 (objetivo 8)`.

The card MUST NOT be rendered when no pending recommendation exists. No empty state or placeholder is allowed.

The feature MUST NOT add a modal, dialog, snackbar, popup, badge, or recommendation content to Record Workout, Home, Workout History, Routine Detail, Progress, or Exercise Progress.

Recommendation evaluation MUST NOT introduce a separate blocking loading state. If evaluation fails, Workout Detail MUST remain usable and the recommendation card MUST be omitted.

### FR-05: Recommendation actions

`Revisar peso` MUST open Routine Detail for the displayed workout's source routine. It MUST NOT change the routine, resolve the recommendation, or open a specific exercise automatically.

`Mantener peso` MUST persist a keep-weight decision and remove the affected recommendation from the card immediately. It MUST NOT change the routine or any workout snapshot.

The application MUST prevent duplicate decision submissions and show a busy state while persistence is in progress.

If persistence fails, the recommendation MUST remain visible and the card MUST show the Spanish error message `No se pudo guardar tu decisión. Inténtalo de nuevo.` Retry MUST be available.

The application MUST NOT calculate, prefill, or prescribe a specific weight increment.

No success snackbar is shown when a decision is saved.

### FR-06: Persistence

Recommendations MUST be derived from saved workouts and MUST NOT be stored as duplicated recommendation records.

The application MUST persist keep-weight decisions in SQLite, keyed by the stable workout exercise identifier, with the decision and timestamp. Decisions MUST survive application restarts.

Editing a workout MUST NOT delete its keep-weight decision. Deleting a workout through an authorized internal operation MAY cascade-delete its decisions.

Changing a routine's planned weight MUST NOT create a keep-weight decision; resolution by weight change is derived.

The feature MUST work offline and persist across restarts.

### FR-07: Recalculation

Workout Detail MUST evaluate recommendations when it loads and when it regains focus after an edit or secondary screen closes.

If a workout is edited so that any set falls below the planned maximum, its recommendations MUST disappear.

If the workout is edited back to qualify, recommendations MUST reappear unless a keep-weight decision exists or another pending condition fails.

Routine weight changes MUST be reflected when the user returns to Workout Detail.

The application MUST NOT display stale recommendations after a successful workout edit, routine edit, or keep-weight decision.

### FR-08: Language and accessibility

Every user-facing message MUST be written in Spanish.

The recommendation card and each recommendation row MUST expose accessibility labels that include the exercise name, actual repetitions, and planned maximum.

The `Revisar peso` and `Mantener peso` controls MUST have clear accessibility labels and touch targets of at least 44 logical pixels.

The recommendation MUST NOT rely on color alone.

The tone MUST remain calm and advisory. The UI MUST NOT use gamification, celebration language, or warning styling.

## 6. Acceptance Criteria

### AC-01: Show a qualifying recommendation

**Given** a saved workout has an exercise with planned external weight and every set at or above the planned maximum,

**When** the user opens that workout's detail,

**Then** the `Progresión` card MUST show the exercise, its actual repetitions, the planned maximum, `Revisar peso`, and `Mantener peso`.

**And** no modal or snackbar MUST be shown.

### AC-02: Hide non-qualifying exercises

**Given** an exercise has any set below the planned maximum, or has zero planned external weight,

**When** Workout Detail is shown,

**Then** that exercise MUST NOT appear in the recommendation card.

### AC-03: Show only the latest session

**Given** two saved workouts contain the same normalized exercise name,

**When** the user opens the older workout's detail,

**Then** its recommendation MUST NOT appear.

**When** the user opens the newer workout's detail,

**Then** its recommendation MUST appear only if the newer workout qualifies.

### AC-04: Group multiple exercises in one card

**Given** one workout has multiple qualifying exercises,

**When** Workout Detail is shown,

**Then** one `Progresión` card MUST render all pending recommendations as separate rows.

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

### AC-07: Open Routine Detail without changing data

**Given** a pending recommendation is visible,

**When** the user taps `Revisar peso`,

**Then** Routine Detail MUST open for the source routine.

**And** no planned weight, routine configuration, or saved workout MUST change automatically.

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

**When** the user views a recommendation or records a keep-weight decision,

**Then** the operation MUST complete locally and the decision MUST persist after restarting.

**And** every visible message and accessibility label MUST be in Spanish.

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

- Recommendations are presented only in Workout Detail for this feature.
- Pending scope is the latest saved session per normalized exercise name.
- Recommendations are hidden when the source routine is deleted or the current exercise cannot be matched uniquely.
- `Mantener peso` is the only secondary action; there is no separate dismiss control.
- Exercises with zero planned external weight are excluded from recommendations in this feature.

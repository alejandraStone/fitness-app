# Database Architecture — Fitness App

## 1. Purpose and Scope

Defines the V1 local data model, relationships, integrity constraints, and deletion policies.

V1 uses **SQLite as its only persistence layer**. There is no backend, authentication, remote database, or synchronization.

Related documentation:
- Product requirements: `docs/PRD.md`
- Architecture overview: `docs/architecture/overview.md`
- Local persistence: `docs/architecture/database.md`
- Feature specifications: `specs/`

## 2. Common Conventions

- Persisted entities use stable UUIDs.
- Calendar and workout dates use a date-only representation that cannot shift across time zones.
- Timestamps use a consistent documented format.
- SQLite constraints and domain validation protect data integrity.
- All persisted weights use kilograms, regardless of the selected input and display unit.
- Weight storage must retain sufficient precision for reliable unit conversion. Display and input use one decimal place in the selected unit.
- Conversions must not accumulate rounding errors.

Conversion factor: `1 lb = 0.45359237 kg`.

The profile's preferred unit is used for input and display. Changing it must not alter stored values or historical records.

## 3. Data Model

### 3.1 Profile

Stores the single local user's profile.

```text
Profile
├── id
├── name
├── body_weight_kg
└── weight_unit
```

- `name`: required.
- `body_weight_kg`: current body weight in kilograms.
- `weight_unit`: `kg` or `lb`.

The profile is created during initial setup and can be edited later. It does not require an account or `user_id`.

### 3.2 Routine

Represents a reusable training template.

```text
Routine
├── id
└── name
```

A routine has an ordered list of routine exercises and may be assigned to weekdays or specific dates.

- Routine names do not need to be unique.
- A routine must contain at least one exercise to be saved.
- Editing a routine updates its current configuration.
- Duplicating a routine creates an independent routine named `<original name> COPIA` with the same exercise configuration, without copying recurring weekdays, one-time assignments or workout history.
- Deleting a routine permanently removes it from active planning.

A routine's deletion must not delete saved workouts or their historical snapshots.

### 3.3 RoutineExercise

Represents an exercise configured within one routine. There is no independent `Exercise` entity or reusable exercise catalog in V1.

```text
RoutineExercise
├── id
├── routine_id
├── name
├── order
├── target_sets
├── target_reps_min
├── target_reps_max
├── target_weight_kg
└── notes?
```

- `routine_id`: required reference to `Routine`.
- `name`: required exercise name.
- `order`: position within the routine.
- `target_sets`: planned number of sets.
- `target_reps_min` and `target_reps_max`: target repetition range.
- `target_weight_kg`: planned external load, defaulting to `0`.
- `notes`: optional exercise-specific notes.

Each exercise configuration belongs to exactly one routine. The same exercise name may appear in different routines with different targets.

Validation:
- `target_sets` must be positive.
- `target_reps_min` must be positive.
- `target_reps_max` must be greater than or equal to `target_reps_min`.
- `target_weight_kg` must be non-negative.
- Exercise order must be deterministic.
- Exercise names are not global identifiers.

The application must prevent saving a routine with no exercises.

### 3.4 RoutineSchedule

Represents recurring weekday assignments.

```text
RoutineSchedule
├── id
├── routine_id
└── day_of_week
```

Use ISO weekdays: Monday = `1`, Sunday = `7`.

Constraint:

```sql
UNIQUE (routine_id, day_of_week)
```

A routine may be assigned to multiple weekdays. Multiple routines may share a weekday.

### 3.5 RoutineAssignment

Represents a one-time assignment to a calendar date.

```text
RoutineAssignment
├── id
├── routine_id
└── date
```

Constraint:

```sql
UNIQUE (routine_id, date)
```

A one-time assignment does not modify recurring schedules or create a workout.

If recurring scheduling and a one-time assignment place the same routine on the same date, the calendar displays it only once.

### 3.6 Workout

Represents a saved workout created from an existing routine.

```text
Workout
├── id
├── routine_id
├── date
└── routine_name_snapshot
```

- `routine_id`: original source routine ID, retained as historical metadata.
- `date`: selected workout date; immutable after saving.
- `routine_name_snapshot`: routine name captured when recording began.

**`Workout.routine_id` must not have a foreign key to `Routine`.** The source routine may be permanently deleted while its saved workouts remain available.

A workout must originate from a routine that exists when recording begins. Free workouts are outside V1.

When recording begins, the application captures the routine configuration in a local draft. The first successful save persists the workout and its historical snapshot. Unfinished drafts do not count towards history, progression, charts, or personal records.

A recording started from a routine that is subsequently deleted cannot be saved. The user must cancel that recording.

### 3.7 WorkoutExercise

Represents an exercise in a saved workout and preserves its original planned configuration.

```text
WorkoutExercise
├── id
├── workout_id
├── name_snapshot
├── order
├── planned_sets
├── planned_reps_min
├── planned_reps_max
├── planned_weight_kg
└── notes_snapshot?
```

- `workout_id`: required reference to `Workout`.
- Snapshot fields preserve the exercise configuration captured when recording began.

These values must not be reconstructed from the current routine.

Changing or deleting a routine must not change historical workout names, exercise order, planned targets, notes, or actual performance. The snapshot must remain complete independently of the source routine.

### 3.8 Set

Represents an actual performed set within a workout exercise.

```text
Set
├── id
├── workout_exercise_id
├── set_number
├── weight_kg
└── reps
```

- `workout_exercise_id`: required reference to `WorkoutExercise`.
- `set_number`: positive and unique within its workout exercise.
- `weight_kg`: actual external load in kilograms.
- `reps`: actual repetitions performed.

Validation:
- `weight_kg` must be non-negative.
- `reps` must be present and valid before saving.
- `0 kg` represents a set without external load, not missing data.
- Actual values must never be inferred from planned targets.

The recording flow creates one set entry per planned set, preloads its planned weight, and leaves repetitions empty until entered.

Every planned set must have valid repetitions before saving. V1 does not support saving skipped sets, incomplete workouts, or a different number of sets from the planned configuration.

Each set's actual weight is editable independently. Changing an actual weight must not update the routine's planned weight.

Constraint:

```sql
UNIQUE (workout_exercise_id, set_number)
```

## 4. Relationships and Integrity

```text
Profile

Routine
├── 1:N RoutineExercise
├── 1:N RoutineSchedule
└── 1:N RoutineAssignment

Workout
└── 1:N WorkoutExercise
      └── 1:N Set
```

`Workout.routine_id` stores the source routine ID as historical metadata without a foreign key to `Routine`.

Required invariants:

1. Routine configuration, scheduling, and workout history remain separate.
2. Scheduled routines do not create workout records.
3. Routine edits do not rewrite saved workouts.
4. Historical snapshots do not depend on the current routine.
5. Planned targets and actual performance remain separate.
6. All persisted weights use kilograms.
7. Saved workouts contain valid repetitions for every planned set.
8. Exercise and workout ordering is deterministic.
9. Derived metrics are consistent with saved workout data.
10. Local persistence preserves data across application restarts.

Use SQLite foreign keys and domain validation for the relationships and constraints they can enforce. Multi-record operations, including saving a workout and its child records, must use transactions to prevent partially persisted records.

The non-empty routine invariant must be validated by the application when saving a routine, since a simple row-level constraint cannot ensure that a parent has at least one child record.

## 5. Deletion Policies

| Entity | Policy |
|---|---|
| Profile | Update in place. |
| Routine | Permanently delete from active planning. |
| RoutineExercise | Cascade-delete with its routine. |
| RoutineSchedule | Cascade-delete with its routine. |
| RoutineAssignment | Cascade-delete with its routine. |
| Workout | No user-facing deletion in V1. |
| WorkoutExercise | Cascade-delete only if its parent workout is deleted through an authorized internal operation or future approved feature. |
| Set | Cascade-delete with its workout exercise. |

### Routine deletion

Deleting a routine must permanently remove:
- The `Routine` record.
- Its `RoutineExercise` records.
- Its `RoutineSchedule` records.
- Its `RoutineAssignment` records.

The operation must never delete saved workouts, workout exercises, sets, or historical snapshots.

**Foreign-key policy:**
- `RoutineExercise.routine_id` references `Routine(id) ON DELETE CASCADE`.
- `RoutineSchedule.routine_id` references `Routine(id) ON DELETE CASCADE`.
- `RoutineAssignment.routine_id` references `Routine(id) ON DELETE CASCADE`.
- `Workout.routine_id` has no foreign key to `Routine(id)`.

The routine deletion must execute in a transaction. Historical workout data must remain readable after deletion.

### Workout history

V1 does not expose a user-facing option to delete saved workouts. Editing a saved workout updates its actual set values while preserving its original planned snapshot and date.

The schema may use cascading relationships from `Workout` to `WorkoutExercise` and from `WorkoutExercise` to `Set` to maintain referential integrity if a workout is deleted through an authorized internal operation or a future approved feature. Such deletion is not part of V1's user-facing functionality.

Editing saved workout data must update affected charts, progression recommendations, and personal records.

## 6. Progression and Derived Data

V1 does not require persisted tables for progression charts, recommendations, or personal records. These are derived from saved workout data unless a future requirement justifies persistence.

Source data:
- `Workout.date`: session date.
- `WorkoutExercise`: exercise identity and historical planned targets.
- `Set`: actual repetitions and external load.

Derived metrics:
- **Weight progression:** recorded weight by session.
- **Repetition progression:** repetitions by session, alongside the weight used.
- **Training volume:** sum of `weight_kg × reps` across sets for the exercise in each session.
- **Personal records:** maximum external weight and highest repetitions at a given external weight, with achievement dates.
- **Progression recommendations:** comparison of actual repetitions against the maximum target captured for each planned set.

Only saved workouts contribute to these calculations. Saved workouts contain all planned sets with valid repetitions.

For exercises without external load, repetition records may be established at `0 kg`. A maximum external-load record of `0 kg` must not be presented as a meaningful maximum-load achievement.

When a saved workout is edited, affected derived values must be recalculated from the saved data.

Training volume is calculated per set and then summed:

```text
Session volume = Σ (weight_kg × reps)
```

For exercises without external load, external-load volume is unavailable as a meaningful measure and must not be displayed as zero in a way that implies no training occurred.

The progression specification defines exact comparison, tie-breaking, and edge-case rules.

## 7. Future Cloud Support

Cloud storage and synchronization are outside V1.

Stable identifiers, explicit relationships, and repository-based persistence allow future architectural evolution without coupling presentation or domain logic directly to SQLite.

Future cloud support requires separate decisions about accounts, ownership, migrations, synchronization, conflicts, and backups. Do not add remote-specific fields, deletion tombstones, sync queues, or backend constraints to the V1 model without an approved requirement.

## 8. Implementation Boundaries

- This document defines the logical data model, relationships, integrity constraints, and deletion policies.
- `docs/architecture/overview.md` defines the overall architectural boundaries.
- `docs/architecture/frontend.md` defines frontend organization and data-access boundaries.
- The PRD and feature specifications define user-visible behavior and acceptance criteria.
- SQLite migrations define the concrete local schema.

Implementation must follow this model without introducing backend or synchronization infrastructure into V1.
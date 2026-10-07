# Database Architecture

## 1. Purpose

The database provides persistent storage for the application's remote data and its relationships.

It stores the core entities required by the V1 features, including users, exercises, routines and workout records.

The data model must preserve the distinction between planned training configuration and actual workout performance, support historical records, and enforce ownership and data integrity.

---

## 2. Data Model

The V1 data model is organized around three distinct concepts:

* **Planning:** reusable routines and their configuration.
* **Calendar:** recurring weekly schedules and one-off routine assignments to specific dates.
* **History:** workouts and the actual performance recorded by the user.

This separation prevents changes to a routine or its schedule from modifying historical workout data.

### 2.1 Exercise

Represents an exercise created by a user.

```text
Exercise
├── id
├── user_id
├── name
├── description?
└── deleted_at?
```

Fields:

* `id`: unique identifier.
* `user_id`: owner of the exercise.
* `name`: exercise name. Required.
* `description`: optional short description.
* `deleted_at`: timestamp indicating that the exercise has been logically deleted. `NULL` while active.

V1 does not include:

* a global exercise catalog;
* muscle group classification;
* images or videos;
* shared exercises between users.

Each exercise belongs to exactly one user.

Exercises use logical deletion when they have historical references. A deleted exercise is no longer available for new routines but remains available for interpreting historical workouts.

---

### 2.2 Routine

Represents a reusable workout template created by a user.

```text
Routine
├── id
├── user_id
├── name
└── deleted_at?
```

Fields:

* `id`: unique identifier.
* `user_id`: owner of the routine.
* `name`: routine name. Required.
* `deleted_at`: timestamp indicating that the routine has been logically deleted. `NULL` while active.

A routine does not contain a specific calendar date.

Its recurring weekly schedule is represented by `RoutineSchedule`.

Its exercises and planned training configuration are represented by `RoutineExercise`.

A deleted routine is no longer available for new calendar assignments or workouts, but its historical workouts remain accessible.

---

### 2.3 RoutineSchedule

Represents the recurring weekdays on which a routine is normally scheduled.

```text
RoutineSchedule
├── id
├── routine_id
└── day_of_week
```

A routine can be assigned to one or multiple weekdays.

For example:

```text
Glúteos
├── Monday
└── Wednesday
```

Multiple routines can be scheduled on the same weekday.

For example:

```text
Monday
├── Glúteos
├── Tren superior
└── Abdomen
```

`RoutineSchedule` represents the user's recurring weekly configuration. It does not represent a workout that has actually been performed.

A routine cannot have the same weekday assigned more than once.

```text
UNIQUE(routine_id, day_of_week)
```

---

### 2.4 RoutineExercise

Represents an exercise included in a routine and its planned training configuration.

```text
RoutineExercise
├── id
├── routine_id
├── exercise_id
├── order
├── target_sets
├── target_reps
└── target_weight
```

Fields:

* `id`: unique identifier.
* `routine_id`: routine containing the exercise.
* `exercise_id`: exercise included in the routine.
* `order`: position of the exercise within the routine.
* `target_sets`: planned number of sets.
* `target_reps`: planned number of repetitions per set.
* `target_weight`: planned target weight.

V1 does not include:

* RIR;
* rest periods;
* tempo.

An exercise cannot appear more than once in the same routine.

This is enforced with:

```text
UNIQUE(routine_id, exercise_id)
```

`RoutineExercise` represents the current plan, not historical performance.

When an exercise is removed from a routine, the corresponding `RoutineExercise` can be physically deleted. This does not affect historical workouts because historical exercises are represented independently through `WorkoutExercise`.

---

### 2.5 RoutineAssignment

Represents a one-off assignment of a routine to a specific calendar date.

```text
RoutineAssignment
├── id
├── routine_id
└── date
```

A `RoutineAssignment` is used when the user wants to add a routine to a specific date without changing the routine's recurring weekly schedule.

For example:

```text
Routine:
Tren superior

Regular schedule:
Tuesday + Thursday

Specific date:
Friday, October 9
```

Adding the routine to October 9 creates a `RoutineAssignment` but does not add Friday to the routine's recurring schedule.

Multiple routines can be assigned to the same date.

For example:

```text
October 9
├── Glúteos
├── Tren superior
└── Abdomen
```

The same routine cannot be assigned more than once to the same date.

This is enforced with:

```text
UNIQUE(routine_id, date)
```

A `RoutineAssignment` represents a planned calendar assignment. It does not mean that the workout was performed.

A one-off assignment can be physically deleted without affecting historical workouts.

---

### 2.6 Workout

Represents a workout that the user actually performed and recorded.

```text
Workout
├── id
├── user_id
├── routine_id
└── date
```

Fields:

* `id`: unique identifier.
* `user_id`: user who performed the workout.
* `routine_id`: routine used as the basis for the workout.
* `date`: date of the performed workout.

A scheduled routine does not automatically create a `Workout`.

A `Workout` exists only when the user records an actual workout.

The application does not require the user to keep the app open during the workout. The workout may be recorded:

* during the workout;
* immediately afterwards;
* later.

A workout may also be partial. The user can:

* skip exercises;
* perform fewer sets than planned;
* perform more sets than planned;
* record only some exercises or sets;
* edit the workout later.

`Workout` represents historical performance and must remain independent from later changes to the routine.

A workout may be physically deleted by the user. When this occurs, its dependent `WorkoutExercise` and `Set` records are deleted through cascading relationships.

Deleting a routine must never automatically delete its historical workouts.

---

### 2.7 WorkoutExercise

Represents an exercise within a recorded workout.

```text
WorkoutExercise
├── id
├── workout_id
├── exercise_id
├── routine_exercise_id?
├── order
├── planned_sets
├── planned_reps
└── planned_weight
```

Fields:

* `id`: unique identifier.
* `workout_id`: workout containing the exercise.
* `exercise_id`: exercise performed.
* `order`: position of the exercise within the workout.
* `planned_sets`: number of sets planned when the workout was created.
* `planned_reps`: repetitions planned when the workout was created.
* `planned_weight`: target weight planned when the workout was created.

The planned values are stored as a snapshot of the routine configuration at the time the workout is created.

This is required to preserve historical integrity.

For example:

```text
Original routine:

Hip Thrust
4 × 8 @ 70 kg
```

A workout is recorded using that configuration.

Later, the routine is changed to:

```text
Hip Thrust
3 × 10 @ 75 kg
```

The previous workout must continue to show:

```text
4 × 8 @ 70 kg
```

Therefore historical workout data must not depend on the current values of `RoutineExercise`.

`WorkoutExercise` belongs to a historical `Workout` and is deleted when its parent workout is deleted.

---

### 2.8 Set

Represents an individual set actually recorded within a workout.

```text
Set
├── id
├── workout_exercise_id
├── set_number
├── weight
├── reps
└── status
```

Fields:

* `id`: unique identifier.
* `workout_exercise_id`: workout exercise containing the set.
* `set_number`: position of the set within the exercise.
* `weight`: actual weight used.
* `reps`: actual repetitions performed.
* `status`: state of the recorded set.

Supported states in V1:

```text
completed
skipped
```

A set that was planned but never recorded does not require a database row.

For example, if four sets were planned:

```text
Set 1 → 70 kg × 8 → completed
Set 2 → 70 kg × 8 → completed
Set 3 → 70 kg × 7 → completed
Set 4 → not recorded
```

Only the first three sets need to exist in the database.

If the user explicitly indicates that the fourth set was skipped, it can be stored as:

```text
Set 4 → skipped
```

Therefore V1 does not use a `not_recorded` status. The absence of a row represents a set that has not been registered.

Each set number must be unique within its workout exercise:

```text
UNIQUE(workout_exercise_id, set_number)
```

A set is deleted when its parent `WorkoutExercise` is deleted.

---

## 3. Relationships

### 3.1 User → Exercise

One user can create many exercises.

Each exercise belongs to exactly one user.

```text
User 1 ─────────── N Exercise
```

---

### 3.2 User → Routine

One user can create many routines.

Each routine belongs to exactly one user.

```text
User 1 ─────────── N Routine
```

---

### 3.3 Routine → RoutineSchedule

One routine can have multiple recurring weekday assignments.

Each `RoutineSchedule` belongs to exactly one routine.

```text
Routine 1 ─────────── N RoutineSchedule
```

A routine cannot have the same weekday assigned more than once:

```text
UNIQUE(routine_id, day_of_week)
```

---

### 3.4 Routine ↔ Exercise

A routine can contain multiple exercises.

An exercise can be used in multiple routines.

Therefore, `Routine` and `Exercise` have a many-to-many relationship implemented through `RoutineExercise`.

```text
Routine 1 ───── N RoutineExercise N ───── 1 Exercise
```

Conceptually:

```text
Routine N ─────────── M Exercise
```

An exercise cannot appear more than once within the same routine:

```text
UNIQUE(routine_id, exercise_id)
```

---

### 3.5 Routine → RoutineAssignment

One routine can have many one-off calendar assignments.

Each `RoutineAssignment` belongs to exactly one routine.

```text
Routine 1 ─────────── N RoutineAssignment
```

The same routine cannot be assigned more than once to the same date:

```text
UNIQUE(routine_id, date)
```

Different routines can be assigned to the same date.

---

### 3.6 Routine → Workout

One routine can be used as the basis for many historical workouts.

Each workout references one routine.

```text
Routine 1 ─────────── N Workout
```

The relationship represents which routine was used as the basis for the recorded workout.

A `Workout` is not automatically created from a `RoutineSchedule` or `RoutineAssignment`.

Deleting a routine must not delete its historical workouts.

---

### 3.7 Workout → WorkoutExercise

One workout can contain multiple workout exercises.

Each `WorkoutExercise` belongs to exactly one workout.

```text
Workout 1 ─────────── N WorkoutExercise
```

Deleting a workout deletes its `WorkoutExercise` records.

---

### 3.8 Exercise → WorkoutExercise

An exercise can appear in many historical workout exercises.

Each `WorkoutExercise` references one exercise.

```text
Exercise 1 ─────────── N WorkoutExercise
```

Deleting an exercise must not delete its historical `WorkoutExercise` records.

Exercises that have historical references are therefore logically deleted rather than physically deleted.

---

### 3.9 WorkoutExercise → Set

One workout exercise can contain multiple recorded sets.

Each set belongs to exactly one workout exercise.

```text
WorkoutExercise 1 ─────────── N Set
```

A set number cannot be repeated within the same workout exercise:

```text
UNIQUE(workout_exercise_id, set_number)
```

---

## 4. Calendar and Workout Flow

The calendar combines recurring schedules with one-off assignments.

```text
Routine
   │
   └── RoutineSchedule
          │
          └── recurring weekday
```

For a specific calendar date, the application can display:

```text
Recurring routines
        +
One-off RoutineAssignments
        ↓
Routines available for that date
```

The user can then choose a routine and record a workout.

The resulting historical data is represented separately:

```text
Calendar
   ↓
Selected Routine
   ↓
Workout
   ↓
WorkoutExercise
   ↓
Set
```

The existence of a scheduled routine or calendar assignment does not imply that a workout occurred.

---

## 5. Data Integrity Rules

The database must enforce the following rules.

### 5.1 Ownership

User-owned entities must belong to the authenticated user.

At minimum:

* `Exercise`
* `Routine`
* `Workout`

Related entities inherit ownership through their parent relationships.

Access control is enforced through the backend security model and Row Level Security.

---

### 5.2 Routine Schedule Integrity

A routine cannot have the same weekday assigned more than once.

```text
UNIQUE(routine_id, day_of_week)
```

Multiple different routines may share the same weekday.

---

### 5.3 Routine Exercise Integrity

An exercise cannot appear more than once in the same routine.

```text
UNIQUE(routine_id, exercise_id)
```

The `order` field determines the exercise's position within the routine.

---

### 5.4 Calendar Assignment Integrity

A routine cannot be assigned more than once to the same specific date.

```text
UNIQUE(routine_id, date)
```

Multiple different routines may exist on the same date.

A one-off assignment does not modify the routine's recurring weekly schedule.

---

### 5.5 Historical Integrity

Historical workout data must not change when the current routine configuration changes.

`WorkoutExercise` stores the planned configuration used when the workout was created:

* planned sets;
* planned repetitions;
* planned weight.

Actual performance is stored separately in `Set`.

---

### 5.6 Set Integrity

A set number must be unique within a workout exercise.

```text
UNIQUE(workout_exercise_id, set_number)
```

Only sets that have been recorded or explicitly marked as skipped need to exist as database rows.

An unrecorded set does not require a placeholder row.

---

### 5.7 Plan vs Performance

The database must preserve a clear distinction between planned and actual data.

```text
PLANNING
Routine
├── RoutineSchedule
└── RoutineExercise
      ├── target_sets
      ├── target_reps_min
      ├── target_reps_max
      └── target_weight


CALENDAR
RoutineSchedule
+
RoutineAssignment


HISTORY
Workout
└── WorkoutExercise
      ├── planned_sets
      ├── planned_reps_min
      ├── planned_reps_max
      ├── planned_weight
      └── Set
            ├── weight
            ├── reps
            └── status
```

Changes to the current planning configuration must not rewrite historical performance.

### 5.8 Progression Data

The database does not store a separate `Progression` entity in V1.

Progression is derived from persisted training data.

The database stores the facts required to evaluate progression:

* `RoutineExercise` stores the current target configuration for an exercise:

  * target sets;
  * target repetition range;
  * target weight.
* `WorkoutExercise` stores a snapshot of the planned configuration used for a historical workout:

  * planned sets;
  * planned repetition range;
  * planned weight.
* `Set` stores the actual performance recorded by the user:

  * weight;
  * repetitions;
  * status.

The application/domain layer evaluates progression by comparing the user's actual performance with the relevant target configuration.

For example, if an exercise is configured as `4 × 6–8 @ 70 kg` and the user records four completed sets at 8 repetitions and 70 kg, the domain logic determines that the progression condition has been met and generates a suggestion to increase the weight.

The application does not automatically change the target weight. The user decides whether to apply the suggested increase by updating the routine configuration.

The database therefore stores the underlying facts, while the progression result is calculated when required.

This follows the principle:

> Store facts; calculate derived results.

Progression evaluation is business logic and belongs to the Domain / Application layer. It must remain independent of SQLite, Supabase and other persistence implementations.

A separate `Progression` table may be introduced in a future version only if a concrete requirement justifies persisting derived progression data, such as historical progression snapshots or optimized analytics.

---

## 6. Deletion and Update Rules

The database must distinguish between deleting current configuration and deleting historical records.

The main rule is:

> Historical workout data must not be destroyed as a side effect of deleting or modifying current exercises or routines.

### 6.1 Exercise Deletion

Exercises use logical deletion when they have historical references.

The `deleted_at` field is set to the deletion timestamp:

```text
deleted_at = timestamp
```

A logically deleted exercise:

* no longer appears as an available exercise for new routines;
* cannot be used for new training configuration;
* remains available for interpreting historical workouts.

The exercise must not be physically deleted if it is referenced by historical `WorkoutExercise` records.

Therefore:

```text
Exercise
→ logical deletion
→ no physical DELETE when historical references exist
```

The historical relationship remains intact:

```text
Exercise
   ↓
WorkoutExercise
   ↓
Set
```

This ensures that an old workout can continue to display the exercise that was performed.

---

### 6.2 Routine Deletion

Routines also use logical deletion when they have historical references.

The `deleted_at` field is set to the deletion timestamp:

```text
deleted_at = timestamp
```

A logically deleted routine:

* no longer appears among active routines;
* cannot be used for new calendar assignments;
* does not participate in future recurring scheduling;
* remains available as the referenced routine for historical workouts.

Deleting a routine must never delete its historical `Workout` records.

Therefore:

```text
Routine
→ logical deletion
→ historical Workout records remain
```

---

### 6.3 RoutineSchedule Deletion

`RoutineSchedule` represents current recurring configuration and has no independent historical meaning.

A schedule entry can therefore be physically deleted when the user removes a routine from a weekday.

```text
RoutineSchedule
→ physical DELETE allowed
```

A logically deleted routine should no longer be considered active in calendar calculations.

No historical workout depends on the existence of a `RoutineSchedule`.

---

### 6.4 RoutineExercise Deletion

`RoutineExercise` represents the current configuration of a routine.

If the user removes an exercise from a routine, the corresponding `RoutineExercise` can be physically deleted.

```text
RoutineExercise
→ physical DELETE allowed
```

This does not affect historical workouts because historical workout exercises are stored independently as `WorkoutExercise`.

---

### 6.5 RoutineAssignment Deletion

`RoutineAssignment` represents a one-off calendar planning entry.

It can be physically deleted when the user removes the assignment from a specific date.

```text
RoutineAssignment
→ physical DELETE allowed
```

Deleting an assignment does not affect any workout that may already have been recorded.

---

### 6.6 Workout Deletion

`Workout` is historical user data.

A user may delete a workout explicitly.

When a workout is deleted, its dependent records should also be deleted:

```text
Workout
   └── WorkoutExercise
          └── Set
```

Therefore:

```text
Workout
→ ON DELETE CASCADE
→ WorkoutExercise
→ ON DELETE CASCADE
→ Set
```

Deleting a workout removes only that workout and its dependent performance records.

---

### 6.7 WorkoutExercise Deletion

`WorkoutExercise` belongs to a specific historical workout.

It should normally be removed as part of deleting its parent workout.

```text
Workout
   └── ON DELETE CASCADE
          ↓
    WorkoutExercise
```

Its associated `Set` records are also removed through cascade.

---

### 6.8 Set Deletion

`Set` belongs to a `WorkoutExercise`.

It should be deleted when its parent `WorkoutExercise` is deleted.

```text
WorkoutExercise
   └── ON DELETE CASCADE
          ↓
         Set
```

---

### 6.9 Preventing Destructive Cascades

The following relationships must not use cascading deletion because they could destroy historical information:

```text
Routine ──X──> Workout
Exercise ──X──> WorkoutExercise
```

Deleting or logically deleting a routine must not delete workouts.

Deleting or logically deleting an exercise must not delete historical workout exercises or sets.

---

### 6.10 Deletion Policy Summary

| Entity              | Logical deletion | Physical deletion                | Cascade behavior              |
| ------------------- | ---------------- | -------------------------------- | ----------------------------- |
| `Exercise`          | Yes              | Only if no historical references | No cascade to historical data |
| `Routine`           | Yes              | Only if no historical references | No cascade to historical data |
| `RoutineSchedule`   | No               | Yes                              | No historical impact          |
| `RoutineExercise`   | No               | Yes                              | No historical impact          |
| `RoutineAssignment` | No               | Yes                              | No historical impact          |
| `Workout`           | No               | Yes                              | Cascades to `WorkoutExercise` |
| `WorkoutExercise`   | No               | Yes                              | Cascades to `Set`             |
| `Set`               | No               | Yes                              | Child of `WorkoutExercise`    |

---

## 7. V1 Model Summary

The V1 database model separates current planning, calendar planning and historical performance.

```text
User
│
├── 1:N → Exercise
│
└── 1:N → Routine
             │
             ├── 1:N → RoutineSchedule
             │
             ├── 1:N → RoutineExercise
             │             │
             │             └── N:1 → Exercise
             │
             ├── 1:N → RoutineAssignment
             │
             └── 1:N → Workout
                           │
                           └── 1:N → WorkoutExercise
                                         │
                                         ├── N:1 → Exercise
                                         │
                                         └── 1:N → Set
```

The model intentionally separates:

1. **Reusable training configuration** — `Routine` and `RoutineExercise`.
2. **Recurring calendar configuration** — `RoutineSchedule`.
3. **One-off calendar planning** — `RoutineAssignment`.
4. **Historical training records** — `Workout`, `WorkoutExercise` and `Set`.

This separation provides a clear foundation for offline operation, synchronization, progression calculations and future product evolution without mixing planned configuration with historical performance.

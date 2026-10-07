# Offline-first Architecture

## 1. Purpose

The application must remain usable when the device has no network connection.

Core V1 functionality must work offline, including:

* viewing and managing exercises;
* viewing and managing routines;
* viewing the calendar and scheduled routines;
* recording and editing workouts;
* viewing workout history;
* evaluating progression from locally available data.

The application uses local persistence as the primary data source for the user interface during normal operation.

Remote persistence is used for synchronization and backup of user data when network connectivity is available.

Offline functionality must not require a network connection for core user actions.

---

## 2. Offline-first Principles

* Core V1 functionality must work without network connectivity.
* SQLite is the local persistence layer.
* The application reads and writes through repositories; Presentation and Domain layers do not access SQLite or Supabase directly.
* Local data is used by the application regardless of connectivity state.
* Local changes are persisted immediately and synchronized with Supabase when connectivity is available.
* Failed synchronization must not lose locally persisted changes.
* Domain and business rules are identical online and offline.
* Local and remote data must converge to a consistent state after successful synchronization.
* Synchronization must not block normal application use.
* Offline support is required for exercises, routines, schedules, assignments, workouts, history and progression.

---

## 3. Local Data

SQLite stores all V1 data required for offline operation:

* `Exercise`
* `Routine`
* `RoutineSchedule`
* `RoutineExercise`
* `RoutineAssignment`
* `Workout`
* `WorkoutExercise`
* `Set`

Local records must contain the data required to:

* display and edit current application state;
* record workouts offline;
* evaluate progression offline;
* synchronize changes with Supabase.

### 3.1 Synchronization Metadata

Local entities that can be created, updated or deleted offline must include synchronization metadata:

* `id` — stable identifier generated locally;
* `created_at`;
* `updated_at`;
* `deleted_at` — nullable, for logical deletion where applicable;
* `sync_status` — identifies whether the local record is synchronized or pending synchronization.

Synchronization metadata is local infrastructure and is not part of the Domain model.

### 3.2 Local Deletion

Entities using logical deletion in the remote model must also use logical deletion locally.

Records marked as deleted must remain locally available until the deletion has been successfully synchronized.

---

## 3. Local Data

SQLite stores all V1 data required for offline operation:

* `Exercise`
* `Routine`
* `RoutineSchedule`
* `RoutineExercise`
* `RoutineAssignment`
* `Workout`
* `WorkoutExercise`
* `Set`

Local records must contain the data required to:

* display and edit current application state;
* record workouts offline;
* evaluate progression offline;
* synchronize changes with Supabase.

### 3.1 Synchronization Metadata

Local entities that can be created, updated or deleted offline must include synchronization metadata:

* `id` — stable identifier generated locally;
* `created_at`;
* `updated_at`;
* `deleted_at` — nullable, for logical deletion where applicable;
* `sync_status` — identifies whether the local record is synchronized or pending synchronization.

Synchronization metadata is local infrastructure and is not part of the Domain model.

### 3.2 Local Deletion

Entities using logical deletion in the remote model must also use logical deletion locally.

Records marked as deleted must remain locally available until the deletion has been successfully synchronized.

---

## 4. Remote Data

Supabase stores the remote persistent representation of all V1 user data.

The remote model follows the entities and relationships defined in `database.md`.

Supabase is responsible for:

* persistent remote storage;
* authentication and user ownership;
* Row Level Security;
* receiving synchronized local changes.

The remote database does not store local synchronization metadata unless explicitly required by the synchronization design.

Local synchronization state is managed by the Data layer.

---

## 5. Synchronization

Local changes are persisted in SQLite first and synchronized with Supabase asynchronously.

### 5.1 Local Changes

When the user creates, updates or deletes data:

1. The change is applied to SQLite.
2. A synchronization operation is added to the local `SyncQueue`.
3. The application continues working without waiting for the network.

```text
User Action
    ↓
Domain
    ↓
Repository
    ↓
SQLite + SyncQueue
```

### 5.2 Upload

When connectivity is available:

1. Pending operations are read from `SyncQueue`.
2. Operations are sent to Supabase.
3. Successful operations are marked as synchronized and removed from the queue.
4. Failed operations remain pending and are retried later.

```text
SyncQueue
    ↓
Supabase
    ↓
Success → remove operation
Failure → keep pending
```

### 5.3 Download

The application must also retrieve remote changes that are not present locally.

After synchronization, local SQLite data must be updated with the latest valid remote state.

### 5.4 Synchronization Requirements

* Synchronization must be retryable.
* Failed synchronization must not lose local changes.
* Synchronization must be idempotent where possible.
* Local changes must not require the user to repeat the original action.
* Conflict resolution is defined separately in `7. Conflict Resolution`.

---

## 6. Connectivity States

The application supports two connectivity states:

### 6.1 Online

* SQLite remains the primary data source for the application.
* Pending local changes are synchronized with Supabase.
* Remote changes are retrieved and applied locally.
* Synchronization runs asynchronously and must not block normal use.

### 6.2 Offline

* All core V1 functionality remains available.
* Reads and writes use SQLite.
* Changes are added to the `SyncQueue`.
* No operation fails solely because the network is unavailable.

When connectivity is restored, synchronization resumes automatically.

---

## 7. Conflict Resolution

V1 uses **last-write-wins** for conflicting updates to the same mutable record.

* Each synchronized record uses `updated_at` to determine the latest version.
* The version with the latest `updated_at` becomes the active state.
* Local changes are not discarded before synchronization succeeds.
* Deletes follow the logical deletion rules defined in `database.md`.
* Synchronization operations must be idempotent to prevent duplicate records or actions.

Workout performance records use stable IDs, allowing independently created records to be synchronized without being treated as conflicting updates.

A more advanced conflict resolution strategy may be introduced if future requirements justify it.

---

## 8. V1 Scope

Offline-first support in V1 includes:

* exercises;
* routines;
* recurring schedules;
* one-off calendar assignments;
* workouts;
* workout history;
* progression evaluation;
* local creation, editing and deletion of supported data;
* synchronization with Supabase when connectivity is available.

The following are outside the V1 offline scope:

* social features;
* media and content synchronization;
* external integrations;
* marketplace or product data;
* AI-generated content.

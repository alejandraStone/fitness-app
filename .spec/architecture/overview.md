# Architecture Overview — Summary

## 1. Purpose

The Fitness App is designed around these product requirements:

- Offline-first operation.
- Reliable workout recording.
- Separation between UI and business logic.
- Local persistence.
- Synchronization with a remote backend.
- Maintainability as the product grows.

---

## 2. Architectural Approach

The application uses a **modular monolithic architecture organized into layers**: it is developed and deployed as a single mobile application, but internally divided into modules and layers with clearly defined responsibilities.

**Monolith:** all functionality lives in one deployable app. No microservices, since the current scope does not justify distributed-system complexity.

**Modules:** the app is split by business responsibility. Initial modules are Exercises, Routines, Workouts, Progression, and Synchronization. New modules should be addable with minimal impact on existing modules and without unnecessary architectural restructuring.

**Layers:**

| Layer | Responsibility |
|---|---|
| **Presentation** | Screens, components, navigation and user interaction. Displays state and collects user actions. Contains no business rules and no direct access to persistence. |
| **Domain / Application** | Business rules and application behavior (routines, workouts, progression). Independent of UI and persistence technologies. |
| **Data** | Obtaining, storing and synchronizing data. Contains repository implementations and encapsulates technologies such as SQLite and Supabase. |

**Dependency direction** is controlled and one-way:

```text
Presentation
    ↓
Domain / Application
    ↓
Repository abstractions
    ↓
Data implementations
    ↓
Local / Remote data sources

```
---

## 3. High-Level Data Flow

Application data flows through the architectural layers according to the responsibility of each layer.

The general flow is:

```text
User interaction
       ↓
Presentation
       ↓
Domain / Application
       ↓
Repository abstraction
       ↓
Data layer
   ↙        ↘
SQLite    Supabase
```

### 3.1 User Interaction

The Presentation layer translates actions (selecting a date or routine, recording a workout, editing a set, viewing progression) into application actions.

### 3.2 Domain / Application

Processes those actions and applies business rules, independently of where data is stored.

### 3.3 Repository

The Domain / Application layer interacts with persistent data only through repository abstractions (e.g. WorkoutRepository), never knowing whether data comes from SQLite, Supabase or a future implementation.

### 3.4 Data Layer

Provides the concrete implementations. Main sources are SQLite (local persistence, offline operation) and Supabase (remote persistence and sync backend).

### 3.5 Local-First Operation
ONLINE

Presentation
     ↓
Domain
     ↓
Repository
     ↓
SQLite
     ↓
Synchronization
     ↓
Supabase

OFFLINE

Presentation
     ↓
Domain
     ↓
Repository
     ↓
SQLite

Core operations (viewing routines, recording workouts, reviewing locally available progression data) must work without a network connection. Local changes sync to the backend when connectivity is available, following the strategy in offline-first.md

---

## 4. Main Modules

The application is organized into functional modules based on the main business responsibilities defined for the product.

Each module should have a clear responsibility and should avoid directly implementing responsibilities that belong to other modules.

### 4.1 Exercises

The exercise catalog and user-created custom exercise variants: providing available exercises, managing exercise information and custom variants.

### 4.2 Routines

Creating and managing reusable workout templates: editing routines, the exercises they include, their configuration, and target sets, rep ranges and target weight. A routine is not itself a completed workout.

### 4.3 Workouts

Recording what the user actually performed: creating workout records for a calendar date, recording actual sets/reps/weight, allowing incomplete or partial records, editing past workouts, and retrieving history.

### 4.4 Progression

Evaluating performance against routine targets: comparing planned targets with actual performance, determining whether a progression target was achieved, and providing progression information from historical data. Progression rules are business logic and must not depend on Presentation or persistence.

### 4.5 Synchronization

Keeping local and remote data consistent: detecting local changes, pushing them to the backend, retrieving remote changes, and handling synchronization states and conflicts per the defined strategy (see offline-first.md).

---

## 5. Architectural Principles

The following principles define the architectural rules that must be followed throughout the application.

### 5.1 Separation of Responsibilities

Each layer and module must have a clearly defined responsibility.

Presentation, Domain / Application and Data must not unnecessarily assume responsibilities belonging to another layer.

### 5.2 Controlled Dependencies

Dependencies follow the defined direction; Data and infrastructure details never leak into Presentation or Domain.

### 5.3 Business Logic Independence

Rules such as workout validation and progression evaluation are testable without a UI, database or network.

### 5.4 Repository Abstraction

Persistent data is always accessed through repositories; the Domain layer never touches SQLite or Supabase directly, so persistence can evolve without changing business logic.

### 5.5 Offline-First Core Functionality

Essential operations never require an Internet connection.

### 5.6 Modular Evolution

New capabilities are added as independent modules, without unnecessary changes to existing ones and without prematurely implementing future functionality.

### 5.7 Technology Encapsulation

Technologies such as SQLite and Supabase stay confined to the Data layer and can be replaced with limited impact.

### 5.8 Testability

Business-critical behavior, especially domain rules, is testable in isolation from UI and external infrastructure.

### 5.9 Simplicity Before Complexity

Complexity, patterns and abstractions are introduced only to solve real requirements, not hypothetical ones.

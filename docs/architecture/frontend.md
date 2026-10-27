# Frontend Architecture — Fitness App

## 1. Purpose and Scope

This document defines the organization of the frontend, the responsibilities of its components, and the dependency rules governing Presentation-layer code.

It complements:

- `docs/architecture/overview.md` — overall architecture and layer boundaries.
- `docs/architecture/database.md` — data model and persistence constraints.
- `docs/PRD.md` — product scope and functional requirements.

This document defines frontend architecture, not detailed product behavior, database design, or visual specifications.

## 2. Responsibilities and Boundaries

The Presentation layer is responsible for:

- Rendering screens and reusable UI components.
- Managing navigation and user interactions.
- Collecting user input and providing immediate validation feedback.
- Managing transient UI state.
- Presenting application data and operation results.
- Displaying loading, empty, success and error states.
- Coordinating user-facing workflows through application interfaces.

The Presentation layer must not:

- Implement authoritative business rules or progression calculations.
- Access SQLite or database APIs directly.
- Implement persistence or database transaction management.
- Duplicate domain models or business logic.
- Treat transient UI state as authoritative persisted data.
- Introduce product behavior that contradicts `docs/PRD.md`.

The Application layer coordinates use cases and workflows. The Domain layer owns business rules. The Data / Infrastructure layer implements persistence and repository interfaces. Their responsibilities and dependency constraints are defined in `docs/architecture/overview.md`.

UI validation may provide immediate feedback, but it does not replace application, domain or database-level validation.

## 3. Directory Structure

The frontend follows a feature-oriented organization inspired by Feature-Sliced Design (FSD), adopting its useful separation and dependency principles without requiring strict compliance with the complete methodology.

```text
src/
├── app/
├── entities/
├── features/
├── widgets/
└── shared/
```

This structure applies to Presentation-layer code. Application use cases, domain models and rules, repository interfaces, and persistence implementations belong in their designated architectural locations, as defined in `docs/architecture/overview.md`.

The structure must reflect actual responsibilities. Do not create directories, layers or abstractions solely to conform to a theoretical pattern.

### 3.1. App

Contains application composition and navigation infrastructure.

Responsibilities include:

- Expo Router layouts and route entry points.
- Application-level providers and frontend initialization.
- Global navigation configuration.
- Screen composition and top-level workflow coordination.
- Frontend configuration and integration of application interfaces.

Route files should remain thin. They should connect navigation to screens or composition components rather than contain business logic, persistence operations or complex workflows.

Application-level providers and composition modules that are not route entry points live outside `app/` (for example, `src/providers/` and `src/composition/`) so Expo Router does not register them as screens.

### 3.2. Entities

Contains reusable presentation components associated with core business concepts.

Examples include:

- Routine summaries and display components.
- Exercise-entry presentation components.
- Workout summaries and historical performance displays.
- Reusable presentation components for recorded sets.

Entities contain UI-specific representations of application or domain data. They must not become a second implementation of the domain model.

Entity components must not implement complete user workflows, access repositories directly or own authoritative business rules.

### 3.3. Features

Contains user-facing capabilities and their interaction logic.

Examples include:

- Creating and editing routines.
- Configuring exercises within a routine.
- Managing routine schedules and date assignments.
- Recording and editing workouts.
- Editing profile information.
- Displaying and interacting with progression information.

A feature owns the transient UI state and interaction logic specific to its capability. It delegates business operations to application use cases or services.

Features must not:

- Access SQLite or repositories directly.
- Reimplement domain validation or business calculations.
- Depend on another feature's internal implementation.
- Assume that a UI interaction succeeded before the application confirms its outcome.
- Modify historical data outside the approved application workflow.

Operations spanning multiple domain concepts must be coordinated by the Application layer. The frontend coordinates the interaction and presents the result.

### 3.4. Widgets

Contains larger UI compositions that combine entities, features and shared components into meaningful interface sections.

Examples include:

- Calendar and scheduled-routine sections.
- Routine detail compositions.
- Workout summaries.
- Exercise history sections.
- Progression charts and personal-record summaries.

Widgets are responsible for presentation composition, not authoritative business rules or direct data access.

Avoid placing entire workflows in large widgets. Extract a feature when an interaction represents a distinct user capability, and extract reusable presentation components when reuse is justified.

### 3.5. Shared

Contains generic frontend building blocks that are independent of specific business features.

Examples include:

- Design-system components.
- Generic form controls.
- Layout primitives.
- Shared UI hooks.
- Formatting and presentation utilities.
- Generic loading, error and empty-state components.

Code belongs in `shared` only when it is genuinely generic and independent of business-specific functionality.

`shared` must not import from `entities`, `features` or `widgets`, and must not contain application-specific business rules or persistence logic.

Do not move a component into `shared` merely because multiple parts of the application use it. Its responsibility must also be sufficiently generic.

## 4. Dependency Rules

Dependencies between frontend segments must follow this direction:

```text
app
 ├──> widgets
 ├──> features
 ├──> entities
 └──> shared

widgets
 ├──> features
 ├──> entities
 └──> shared

features
 ├──> entities
 └──> shared

entities
 └──> shared

shared
 └──> no business-specific frontend segments
```

The diagram defines permitted dependency directions; it does not require every segment to depend on every segment below it.

Rules:

- `app` may compose any lower frontend segment.
- `widgets` may compose features, entities and shared components.
- `features` may use entities and shared components.
- `entities` may use shared components.
- `shared` must remain independent of business-specific frontend segments.
- Features must not import another feature's internal implementation directly.
- Avoid circular dependencies.
- Use public interfaces when importing from another segment rather than coupling to its internal file structure.
- Presentation code must access application functionality through the interfaces established by the overall architecture.
- Presentation code must not import database clients or infrastructure-specific persistence implementations.

The Application, Domain and Data / Infrastructure layers follow the dependency rules in `docs/architecture/overview.md`. Frontend dependency rules do not replace or weaken those boundaries.

If a workflow cannot be expressed cleanly within these rules, review its ownership and boundaries before introducing an exception.

## 5. Application Interaction and State

### 5.1. Interaction Flow

The general interaction flow is:

```text
User interaction
       |
       v
Screen / Feature
       |
       v
Application use case or service
       |
       v
Domain rules and repository interfaces
       |
       v
Data / Infrastructure
       |
       v
SQLite
```

The result flows back through the application interfaces to the Presentation layer.

Presentation code may transform application results into UI-specific representations, but these transformations must not change business meaning or duplicate authoritative business rules.

### 5.2. UI State and Persisted Data

Keep transient UI state separate from persisted application data.

Transient UI state includes:

- Selected calendar date.
- Open sheets, dialogs and expanded sections.
- Form input before saving.
- Temporary selections.
- Navigation and presentation state.

Persisted application data includes profile information, routine configuration, scheduling, saved workouts and recorded performance.

The frontend must not maintain an independent authoritative copy of persisted data that can diverge from the repository-backed application state.

Use established application interfaces and state-management conventions to read and update data. After a successful operation, update the UI from the authoritative result or refresh the relevant query.

Do not introduce a state-management library or additional abstraction without a concrete requirement.

### 5.3. State Ownership

Each piece of state must have a clear owner.

- Components own local presentation state when it does not need to be shared.
- Features own interaction state specific to their capabilities.
- Screen composition coordinates state shared across parts of a screen when appropriate.
- Application and Domain layers own use-case execution and business decisions.
- Repositories and the Data / Infrastructure layer own persistence access.

Avoid duplicated state, unnecessary global state and competing sources of truth.

## 6. Forms and Validation

Forms may validate input for immediate feedback, including required fields, numeric formats and basic field constraints.

The Application and Domain layers remain responsible for enforcing business rules. The Data / Infrastructure layer must enforce applicable persistence constraints.

The frontend must:

- Present validation errors clearly and near the relevant input.
- Preserve user input when an operation fails, where safe and appropriate.
- Avoid reporting success before the application confirms the operation.
- Distinguish validation failures from persistence failures.
- Avoid relying on UI validation alone to guarantee data integrity.

Reusable validation logic should have a clear owner. Do not duplicate authoritative rules across multiple components.

## 7. Loading, Empty and Error States

User-facing operations must provide appropriate feedback for relevant states, including:

- Loading or processing.
- Successful completion, where confirmation is useful.
- Validation errors.
- Persistence or application-operation failures.
- Empty states when no data is available.

The frontend must not expose raw technical errors or sensitive implementation details.

Error messages should explain what happened and, where useful, what the user can do next. Failed persistence must not be presented as successful merely because the UI accepted the input.

Error handling and recovery must follow the relevant application interfaces and established project conventions.

## 8. Implementation Guidelines

- Use TypeScript strict mode and follow established project conventions.
- Prefer small, focused components with clear responsibilities.
- Inspect existing code and reuse suitable components before creating new ones.
- Follow the existing design system and established UI patterns.
- Keep business rules out of components, hooks and UI-specific adapters.
- Avoid unnecessary global state, duplicated state and speculative abstractions.
- Do not introduce dependencies or architectural patterns without a concrete requirement.
- Consider accessibility, usability and performance when implementing interactions.
- Add tests for important UI behavior and interaction flows where appropriate.
- Test relevant loading, empty and error states, not only successful interactions.
- Keep Presentation code within the documented architectural boundaries.
- Update this document only when frontend responsibilities, dependency rules or established implementation conventions change.

## 9. Evolution

The frontend structure should evolve in response to actual application needs.

Do not introduce new directories, layers, state-management patterns or additional FSD conventions solely to achieve theoretical architectural completeness.

Changes to product behavior remain governed by `docs/PRD.md` and the relevant feature specifications. Changes to the overall architecture must be reflected in `docs/architecture/overview.md` and any other affected architecture documents.

This document must remain focused on frontend organization and boundaries rather than duplicating product requirements, database rules or general development instructions.
# Architecture Overview

## Stack

- React Native, Expo and TypeScript.
- SQLite for local persistence.

## Architecture

- Use a modular monolith with four layers: Presentation, Application, Domain and Data/Infrastructure.
- Presentation handles screens, components and user interaction. It must not implement business rules or access SQLite directly.
- Application coordinates use cases and application workflows.
- Domain contains business rules and domain concepts that must remain independent of UI and storage details.
- Data/Infrastructure implements repository interfaces and handles persistence through SQLite.
- Place Application, Domain and Data/Infrastructure code under `src/application`, `src/domain` and `src/data`, organized by module. Define repository interfaces in the Domain layer of their module and implement them in Data/Infrastructure.
- UI components and frontend features must use application-level interfaces rather than accessing SQLite or concrete persistence implementations directly.
- Use stable identifiers and database transactions for operations that modify related records atomically.

## Modules

- Profile
- Routines and Scheduling
- Workout Records
- Progression

Modules should have clear responsibilities and avoid unnecessary coupling. These are functional boundaries, not a requirement to create a separate package, folder or abstraction for every module in every layer. Introduce additional structure only when justified by concrete needs.

## Frontend Organization

- Follow the frontend structure and dependency rules defined in `docs/architecture/frontend.md`.
- Frontend organization and architectural layers describe different concerns: frontend folders organize UI code, while layers define responsibilities and dependency boundaries.
- Keep dependencies directed towards the appropriate application and domain interfaces. Avoid circular dependencies and imports that bypass architectural boundaries.

## Persistence

- SQLite is the only data store in V1.
- No backend, authentication, cloud storage or synchronization in V1.
- Keep persistence implementation behind repository interfaces so application and presentation code do not depend directly on SQLite.
- Do not introduce additional storage abstractions or infrastructure without a concrete requirement.

## Historical Data

- Saved workouts preserve snapshots of the routine and exercise configuration used when recording began.
- Changes to routine configuration must not alter historical workout records.

## Scope

This document defines architectural boundaries and technical decisions. Product behavior and requirements belong in `docs/PRD.md`; database structure, relationships and integrity constraints belong in `docs/architecture/database.md`; frontend organization and dependency rules belong in `docs/architecture/frontend.md`.
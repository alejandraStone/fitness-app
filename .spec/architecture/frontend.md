# Frontend Architecture

## 1. Purpose

This document defines the architecture of the frontend (Presentation layer), including how its screens, components, navigation and feature-specific UI logic are organized.

---

## 2. Responsibilities

The Presentation layer is responsible for providing the user interface and handling user interaction.

It is responsible for:

* displaying application features and state;
* providing navigation and user flows;
* displaying workout history, progression and charts;
* providing the calendar and routine selection interface;
* collecting user input and sending user actions to the application layer;
* displaying loading, success and error feedback;
* providing a responsive and performant user experience.

The Presentation layer must not:

* contain business rules;
* directly access SQLite, Supabase or other persistence systems;
* decide how data is stored or synchronized;
* implement domain logic such as progression evaluation.

Data required by the UI is obtained through the application/domain layer and presented by the Presentation layer.

---

## 2. Responsibilities

The Presentation layer is responsible for providing the user interface and handling user interaction.

It is responsible for:

* displaying application features and state;
* providing navigation and user flows;
* displaying workout history, progression and charts;
* providing the calendar and routine selection interface;
* collecting user input and sending user actions to the application layer;
* displaying loading, success and error feedback;
* providing a responsive and performant user experience.

The Presentation layer must not:

* contain business rules;
* directly access SQLite, Supabase or other persistence systems;
* decide how data is stored or synchronized;
* implement domain logic such as progression evaluation.

Data required by the UI is obtained through the application/domain layer and presented by the Presentation layer.

---

## 3. Structure

The Presentation layer is organized by application responsibility rather than by technical type.

```text
src/
├── app/
├── entities/
├── features/
├── widgets/
└── shared/
```

### 3.1 App

Contains application-level composition, including navigation, providers and global configuration.

### 3.2 Entities

Contains UI-related representations of core business entities such as exercises, routines and workouts.

### 3.3 Features

Contains user-facing actions and capabilities, such as creating a routine, recording a workout or editing a workout.

### 3.4 Widgets

Contains larger reusable UI blocks that combine multiple components or features, such as the calendar, routine selector, workout summary or progression chart.

### 3.5 Shared

Contains generic reusable UI components, hooks and utilities that are not specific to a particular business entity or feature.

This structure is inspired by Feature-Sliced Design principles without adopting the methodology strictly. The organization should remain simple and evolve only when the application requires additional structure.

---

## 4. Rules

The following rules govern dependencies and responsibilities within the Presentation layer:

* UI components must not access SQLite, Supabase or other persistence systems directly.
* Business rules must not be implemented in screens or UI components.
* Features must use domain/application services or repository abstractions rather than accessing data sources directly.
* Shared code must remain independent of specific business features.
* Entities represent business concepts and must not contain feature-specific behavior.
* Widgets may compose entities, features and shared components, but must not contain core business rules.
* Dependencies should follow the defined architectural direction and avoid unnecessary coupling between features.
* New code should be placed in the smallest appropriate scope: shared, entity, feature or widget.
* The frontend should not introduce abstractions or structure unless they solve an actual requirement.

The Presentation layer communicates with the application/domain layer through defined interfaces and displays the resulting state to the user.

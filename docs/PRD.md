# Product Requirements Document (PRD)

**Product:** Fitness App  
**Version:** V1  
**Status:** Draft

## 1. Product Objective

Fitness App is a mobile application for women who train strength and want to organize their routines, record their performance, and track their progression.

V1 focuses on routine planning, workout recording, and progress tracking.

**Platforms:** iOS and Android.

## 2. V1 Scope

### Included

- Create, edit, duplicate, and permanently delete routines.
- Add exercises and configure their goals within each routine.
- Schedule routines by weekdays and specific dates.
- View scheduled routines in a calendar.
- Record workouts from existing routines, during or after training.
- View and edit saved workouts.
- View exercise history, progression charts, and personal records.
- Receive progression recommendations based on recorded performance.
- Store all data locally using SQLite.
- Use core functionalities without an internet connection.

### Out of scope

- User registration, login, and accounts.
- Backend, remote database, and synchronization between devices.
- Global exercise catalog or independent exercise library.
- AI-generated routines.
- Workouts created independently of existing routines.
- Rest timers, tempo tracking, or mandatory real-time recording.
- Videos, social content, community, and tracking other users.
- Products, sportswear, supplements, and marketplace.
- Nutrition and food tracking.
- Cloud backups and data export, unless incorporated through an explicit scope decision.

## 3. Functional Requirements

### 3.1. Initial Setup and Profile

On first launch, the application requests:
- User's name.
- Current body weight.
- Preferred weight unit: kg or lb.

Requirements:
- Profile data is stored locally; no account or internet connection is required.
- The user can view and edit their profile later.
- Body weight is stored internally in kg.
- Changing the preferred unit must not change the underlying stored values or alter historical records.
- Weights are displayed and entered to one decimal place in the selected unit. Internal storage must retain sufficient precision for reliable unit conversion; it must not be restricted to one decimal place in kg.
- Conversion between kg and lb must not accumulate rounding errors. Use 1 lb = 0.45359237 kg.

### 3.2. Routine

A routine is a reusable workout template containing:
- Name.
- Zero or more recurring weekdays.
- Ordered exercise entries.
- Planned configuration for each exercise.

Each routine exercise contains:
- Name.
- Optional notes.
- Planned number of sets.
- Minimum and maximum target repetitions.
- Optional planned external weight.

Requirements:
- A routine must contain at least one exercise to be saved.
- There is no independent exercise library. Each exercise entry belongs to a routine and can be configured differently in another routine.
- Routine names do not need to be unique.
- If no weight is specified for an exercise, it is treated as an exercise without external load.
- Exercises without external load use zero as their external weight for calculations.

### 3.3. Editing, Duplication, and Deletion

**Editing**
- Editing a routine modifies its current configuration without creating a new routine.
- Changes apply to all future scheduled occurrences of that routine, including weekly and one-time assignments.
- Editing a routine does not modify existing saved workouts or their historical snapshots.

**Duplication**
- Duplicating a routine asks the user which date the copy should be scheduled on.
- The copy is created as an independent routine named `<original name> COPIA`.
- The copy keeps the exercise configuration of the original but starts without recurring weekdays and without one-time assignments.
- The copy is assigned to the date selected by the user.
- Historical workouts are not copied.
- Changes to either routine do not affect the other.

**Deletion**
- Deleting a routine is permanent from the user's perspective. There is no recycle bin or recovery option.
- A deleted routine is removed from planning and cannot be edited, duplicated, or scheduled again.
- Its exercises are removed from the active routine configuration.
- Saved workouts and their historical snapshots must remain intact, even after their source routine and its exercises are deleted.
- The application must preserve enough historical data to continue displaying workout details, charts, and personal records.

### 3.4. Scheduling

Scheduling has two independent mechanisms:
- **Weekly scheduling:** assigns a routine to one or more weekdays.
- **One-time assignment:** schedules a routine for a specific date without changing its weekly schedule.

Requirements:
- A routine appears only once on a date, even if both scheduling mechanisms coincide.
- Multiple different routines can be scheduled on the same date.
- Creating a routine does not assign a specific date. The user can select zero or more recurring weekdays during creation; one-time assignments and additional weekdays can be added later from the calendar.
- Scheduling a routine does not create a workout or imply that it was performed.
- The calendar displays scheduled routines separately from saved workout history.
- A workout is recorded against the date selected by the user when starting the recording process.
- The workout date cannot be changed after the workout is saved.
- Workouts can be recorded for any past date.

### 3.5. Workout Recording

Recording starts from an existing routine and does not require a real-time session.

For each exercise:
- All planned sets appear on a single screen.
- Each set's weight is prefilled with the planned weight. If no external weight was planned, it defaults to zero.
- Repetition inputs start empty.
- Weight and repetitions can be edited independently for each set.
- Repetitions must be entered for every planned set before the workout can be saved.
- The user cannot save a partial workout, skip planned sets, or record a different number of sets from the routine.
- Recording actual performance does not automatically change the routine's planned configuration.

**Configuration snapshot**
- When workout recording begins, the application captures the routine and exercise configuration used for that recording.
- Changes to the routine while recording is in progress do not automatically alter the captured configuration.
- The captured configuration becomes the workout's historical snapshot when the workout is first successfully saved.

**Previous performance**
- When available, the recording screen shows the previous saved result for the same exercise, including its date, weight, and repetitions per set.
- If no previous result exists, no previous result is shown.

**After saving**
- The application opens the saved workout detail screen.
- The user can view and edit the saved workout's actual recorded values.
- The user cannot delete a saved workout.
- The saved workout's date cannot be edited.

### 3.6. History and Data Integrity

Each saved workout preserves a snapshot of:
- Routine name.
- Exercise names and order.
- Planned sets, repetition range, and planned weight.
- Relevant exercise notes.
- Actual weight and repetitions recorded for every set.

Requirements:
- Historical views must use the saved snapshot rather than the routine's current configuration.
- Editing a routine must not rewrite historical workouts.
- Permanently deleting a routine must not delete its saved workouts or historical snapshots.
- Editing a saved workout changes its actual performance data, not its original planned configuration.
- Changes to saved performance must update the affected progression charts and personal records.
- Historical data must remain available independently of the continued existence of its source routine.

### 3.7. Progression Recommendations

Recommendations are based on actual recorded repetitions compared with the maximum target repetitions captured for that workout.

Example: a routine specifies 4 sets of 6–8 repetitions at 75 kg.

| Recorded repetitions | Recommendation |
|---|---|
| 8 / 8 / 8 / 8 | Consider increasing the weight |
| 8 / 8 / 9 / 10 | Consider increasing the weight |
| 8 / 8 / 7 / 6 | Do not recommend an increase |

Requirements:
- A recommendation is generated when every planned set has valid recorded data and reaches at least the maximum target repetitions.
- Exceeding the maximum target is valid and does not invalidate the recommendation.
- Recommendations are advisory. The application never increases the planned weight automatically.
- The application does not prescribe a specific weight increment.
- A qualifying recommendation is presented after saving the workout.
- A pending recommendation remains accessible alongside the latest session result until resolved or no longer applicable.
- The recommendation is not repeatedly displayed as a new popup every time the recording screen opens.
- The user can open routine editing to enter and confirm a new planned weight.
- Changing the planned weight affects the current routine and its future scheduled occurrences, not historical workouts.
- Dismissing the recommendation or deciding to keep the weight does not change the routine.
- If the saved workout is edited and no longer meets the recommendation criteria, the pending recommendation is withdrawn.

### 3.8. Progression Charts

V1 includes one chart per exercise, with a selector for three metrics:

1. **Weight used:** evolution of the external weight recorded in each session.
2. **Repetitions:** evolution of repetitions performed, with the corresponding weight shown for context.
3. **Training volume:** sum of external weight multiplied by repetitions across the exercise's sets in each session.

Requirements:
- Charts are calculated from saved workouts and their recorded sets, not planned targets.
- Each point represents a session and preserves its date and historical values.
- The interface displays one metric at a time.
- Editing a routine does not change historical chart values.
- Editing a saved workout updates affected chart data.
- Exercises without external load have no meaningful external-load volume. Their volume chart must be shown as unavailable rather than implying that no training occurred.
- Volume is an indicator of external workload, not a direct measurement of muscle gain.

For sets with different external weights, volume is calculated per set and then summed:

`Session volume = Σ (set weight × set repetitions)`

### 3.9. Personal Records

V1 includes personal records per exercise, calculated from valid sets in saved workouts.

Records include:
- **Maximum external weight:** the highest external weight recorded for the exercise.
- **Maximum repetitions at a given external weight:** the highest repetition count achieved with the same external load.
- Date achieved.

Requirements:
- Exercises without external load can establish repetition records at zero external weight.
- The maximum external weight record represents external load; zero is not presented as a meaningful maximum-load achievement for a bodyweight exercise.
- If the same record is achieved multiple times, the most recent date is displayed.
- Editing a saved workout requires recalculating affected records.
- Personal records and progression charts are separate features and both are included in V1.

### 3.10. Local Persistence

- SQLite is the only data store in V1.
- No backend, account, cloud storage, or synchronization is implemented.
- Core operations for routines, scheduling, workout recording, history, and progression must work offline.
- Data must persist when the application is closed and reopened.
- Stable identifiers must be used for stored entities.
- Multi-record operations that must succeed together must use database transactions.
- UI components and business logic must not access SQLite directly; data access must go through the repository layer.
- The architecture may evolve in future versions, but V1 must not include speculative synchronization infrastructure.

## 4. Product Principles

- **User control:** the application recommends; the user decides.
- **Flexible recording:** performance can be recorded during or after training.
- **Data-driven progression:** recommendations are based on recorded performance.
- **Historical integrity:** editing or deleting a routine does not rewrite or remove saved workout history.
- **Simplicity:** V1 addresses a focused set of needs.
- **Reliable persistence:** core functionality does not depend on an internet connection.
- **Incremental evolution:** avoid implementing infrastructure for features outside the current scope.

## 5. Product Acceptance Criteria

1. On first launch, the user is asked for their name, body weight, and preferred unit.
2. Profile data persists after the application is closed and reopened.
3. The user can edit profile details and change the preferred unit.
4. Weights are entered and displayed to one decimal place in the selected unit.
5. Unit changes preserve the underlying values and do not cause cumulative conversion errors.
6. The user can create, edit, duplicate, and permanently delete routines.
7. Each saved routine has at least one exercise.
8. Exercise entries keep their creation order and support planned sets, repetition ranges, optional weight, and optional notes.
9. A routine can be scheduled on multiple weekdays and assigned to specific dates.
10. The calendar does not duplicate a routine when weekly and one-time scheduling coincide.
11. The calendar distinguishes scheduled routines from saved workouts.
12. The user can record a workout from an existing routine for any past date.
13. A saved workout's date cannot be edited.
14. The recording screen preloads each set's planned weight and requires repetitions for every planned set before saving.
15. Changes to a routine do not alter the configuration already captured by an ongoing recording.
16. The previous session result appears during recording when available.
17. After saving, the workout detail screen opens.
18. The user can view and edit saved workout performance but cannot delete a saved workout.
19. Deleting a routine permanently removes it from planning and removes its active exercise configuration.
20. Deleting a routine preserves saved workouts, historical snapshots, charts, and personal records.
21. Editing a routine does not modify historical workouts.
22. Progression recommendations appear only when all planned sets reach at least the maximum target repetitions.
23. Exceeding the maximum target repetitions remains valid for recommendations.
24. Recommendations never change the planned weight automatically.
25. Editing a workout recalculates affected progression data and withdraws a pending recommendation if its conditions are no longer met.
26. The user can view progression charts for weight, repetitions, and volume per exercise.
27. Charts update when saved workout performance is edited.
28. Personal records are calculated from actual saved performance, including repetition records for exercises without external load.
29. Core features work without an internet connection.
30. Saved data persists after the application is closed and reopened.
31. Creating a routine lets the user choose zero or more recurring weekdays before saving; the selected Home date is not assigned automatically. Routines without weekdays remain unscheduled and can be assigned later from the calendar.
32. Duplicating a routine asks the user for a date, creates an independent copy named `<original name> COPIA` with the original exercise configuration, assigns it to the chosen date, and does not inherit recurring weekdays or one-time assignments.
33. Every user-facing message is presented in Spanish.

## 6. Glossary

- **Profile:** locally stored personal data, including name, body weight, and preferred weight unit.
- **Training unit:** selected unit for entering and displaying weights: kilograms or pounds.
- **Routine:** reusable workout template.
- **Routine exercise:** an exercise entry configured within a routine.
- **Weekly scheduling:** recurring assignment of a routine to weekdays.
- **One-time assignment:** assignment of a routine to a specific date.
- **Workout:** saved record of actual performance from a routine.
- **Set:** a performance entry containing external weight and repetitions.
- **Historical snapshot:** copy of the routine and exercise configuration captured for a workout.
- **Progression:** evolution of recorded performance over time.
- **Progression chart:** temporal representation of actual recorded performance for an exercise.
- **Progression recommendation:** advisory suggestion to consider changing the planned weight.
- **Personal record:** best recorded result for a defined exercise metric.

## 7. Limits of This Document

This PRD defines product scope and functional requirements. It does not define:
- Database tables, columns, indexes, or migrations.
- Repository or service implementation.
- Detailed navigation and component architecture.
- Visual styles, animations, or design tokens.
- Folder structure or coding conventions.
- Implementation plans, tasks, or technical tests.

These details belong in the architecture, design, and feature specification documents.


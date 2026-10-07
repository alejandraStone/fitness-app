# Navigation

## 1. Navigation Structure

The application uses a tab-based main navigation.

```text
App
├── Calendar
├── Routines
├── History
└── Settings
```

### Calendar

Entry point for the daily training flow.

```text
Calendar
├── Select date
├── View scheduled routines
├── Add routine to date
├── Select routine
└── Workout
```

### Routines

Manage reusable training routines.

```text
Routines
├── Routine list
├── Create routine
├── Edit routine
└── Routine detail
```

### History

View previously recorded workouts and progression.

```text
History
├── Workout history
├── Workout detail
└── Progression
```

### Settings

Application and account configuration.

```text
Settings
├── Account
└── App settings
```

## 2. Navigation Rules

* The main navigation remains available from the main application sections.
* Selecting a calendar date does not create a workout.
* A scheduled or assigned routine must be selected before recording a workout.
* A workout can be created, edited or viewed independently of the current calendar date.
* Editing a routine does not modify historical workouts.
* Back navigation must preserve the current application state.
* Navigation must not depend on network connectivity.

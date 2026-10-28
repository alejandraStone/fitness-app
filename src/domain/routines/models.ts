/**
 * Domain models for the Routines and Scheduling module.
 *
 * These models are independent of React Native and SQLite, as required by
 * `docs/architecture/overview.md`.
 *
 * Requirements: `docs/PRD.md` sections 3.2–3.4 and `specs/001-routines/spec.md`.
 */

/** Stable identifier of a routine (UUID). */
export type RoutineId = string;

/** Stable identifier of an exercise entry configured within a routine (UUID). */
export type RoutineExerciseId = string;

/** Stable identifier of a one-time routine assignment (UUID). */
export type RoutineAssignmentId = string;

/**
 * ISO weekday of a recurring routine schedule.
 * Monday = 1, ..., Sunday = 7 (`docs/architecture/database.md`).
 */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Calendar date without time or time zone, in `YYYY-MM-DD` format.
 * Date-only values must not shift across time zones.
 */
export type DateOnly = string;

/** Timestamp in ISO 8601 UTC format, for example `2026-10-18T08:30:00.000Z`. */
export type Timestamp = string;

/**
 * Exercise entry configured within one routine.
 * There is no independent exercise library in V1: every entry belongs to
 * exactly one routine and can be configured differently in another routine.
 */
export interface RoutineExercise {
  /** Stable identifier. */
  id: RoutineExerciseId;
  /** Routine this entry belongs to. */
  routineId: RoutineId;
  /** Exercise name; at least one non-whitespace character after trimming. */
  name: string;
  /** Zero-based position within the routine; unique and deterministic per routine. */
  order: number;
  /** Planned number of sets; positive integer. */
  targetSets: number;
  /** Minimum target repetitions; positive integer. */
  targetRepsMin: number;
  /** Maximum target repetitions; greater than or equal to `targetRepsMin`. */
  targetRepsMax: number;
  /** Planned external weight in kilograms; non-negative. Zero means no external load. */
  targetWeightKg: number;
  /** Optional exercise-specific notes. */
  notes?: string;
}

/**
 * Reusable workout template.
 * Editing a routine affects future planning only; historical workouts keep
 * their own snapshots.
 */
export interface Routine {
  /** Stable identifier. */
  id: RoutineId;
  /** Routine name; at least one non-whitespace character after trimming. */
  name: string;
  /** Recurring weekdays assigned to the routine; unique values. */
  weekdays: IsoWeekday[];
  /** Exercise entries in display order. */
  exercises: RoutineExercise[];
  /** Creation timestamp. */
  createdAt: Timestamp;
  /** Last update timestamp. */
  updatedAt: Timestamp;
}

/**
 * One-time assignment of a routine to a specific calendar date.
 * Independent from recurring weekdays; assigning a date never creates a workout.
 */
export interface RoutineAssignment {
  /** Stable identifier. */
  id: RoutineAssignmentId;
  /** Assigned routine. */
  routineId: RoutineId;
  /** Assigned calendar date. */
  date: DateOnly;
}

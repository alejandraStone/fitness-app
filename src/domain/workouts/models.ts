/**
 * Domain models for the Workout Records module.
 *
 * These models are independent of React Native and SQLite, as required by
 * `docs/architecture/overview.md`.
 *
 * Requirements: `docs/PRD.md` sections 3.5–3.6 and
 * `specs/002-workout-records/spec.md` FR-02, FR-03, FR-04 and FR-07.
 */

import type { DateOnly, RoutineId, Timestamp } from '../routines';

/** Stable identifier of a saved workout (UUID). */
export type WorkoutId = string;

/** Stable identifier of an exercise inside a saved workout (UUID). */
export type WorkoutExerciseId = string;

/** Stable identifier of a performed set (UUID). */
export type WorkoutSetId = string;

/**
 * Actual performance of one set.
 *
 * `weightKg` is the external load in kilograms. Zero represents an exercise
 * without external load. `setNumber` is one-based and follows the planned set
 * order captured in the workout snapshot.
 */
export interface WorkoutSetPerformance {
  /** One-based set number within its workout exercise. */
  setNumber: number;
  /** Actual external weight in kilograms; non-negative. */
  weightKg: number;
  /** Actual repetitions performed; positive integer. */
  reps: number;
}

/** A performed set persisted as part of a saved workout. */
export interface WorkoutSet extends WorkoutSetPerformance {
  /** Stable identifier. */
  id: WorkoutSetId;
}

/**
 * Immutable planned configuration captured for one exercise when recording
 * begins.
 *
 * These values are historical snapshots. They must never be reconstructed from
 * the current routine configuration.
 */
export interface WorkoutExerciseSnapshot {
  /** Exercise name captured when recording began. */
  nameSnapshot: string;
  /** Zero-based display order within the workout snapshot. */
  order: number;
  /** Planned number of sets; positive integer. */
  plannedSets: number;
  /** Minimum planned repetitions; positive integer. */
  plannedRepsMin: number;
  /** Maximum planned repetitions; greater than or equal to `plannedRepsMin`. */
  plannedRepsMax: number;
  /** Planned external weight in kilograms; non-negative. Zero means no external load. */
  plannedWeightKg: number;
  /** Optional exercise notes captured when recording began. */
  notesSnapshot?: string;
}

/**
 * An exercise inside a saved workout.
 *
 * Combines the historical planned snapshot with the actual performed sets.
 * The planned values remain separate from the actual values.
 */
export interface WorkoutExercise extends WorkoutExerciseSnapshot {
  /** Stable identifier. */
  id: WorkoutExerciseId;
  /** Performed sets in ascending set-number order. */
  sets: WorkoutSet[];
}

/**
 * A saved workout created from an existing routine.
 *
 * `routineId` is historical metadata and may reference a routine that no
 * longer exists. The saved workout keeps its own complete snapshot.
 */
export interface Workout {
  /** Stable identifier. */
  id: WorkoutId;
  /** Original source routine identifier, retained as historical metadata. */
  routineId: RoutineId;
  /** Selected workout date; immutable after saving. */
  date: DateOnly;
  /** Routine name captured when recording began. */
  routineNameSnapshot: string;
  /** Timestamp of the first successful save. */
  savedAt: Timestamp;
  /** Exercises in their historical display order. */
  exercises: WorkoutExercise[];
}

/**
 * Lightweight workout data used by Home and Workout History.
 *
 * The counts are calculated from saved workouts only. Scheduled routines and
 * planned targets must never be included.
 */
export interface WorkoutSummary {
  /** Stable workout identifier. */
  id: WorkoutId;
  /** Original source routine identifier, retained as historical metadata. */
  routineId: RoutineId;
  /** Workout date. */
  date: DateOnly;
  /** Routine name captured when recording began. */
  routineNameSnapshot: string;
  /** Timestamp of the first successful save. */
  savedAt: Timestamp;
  /** Number of exercises recorded in the workout. */
  exerciseCount: number;
  /** Total number of performed sets. */
  totalSets: number;
  /** Sum of repetitions across every performed set. */
  totalReps: number;
}

/**
 * Immutable snapshot used while recording a workout.
 *
 * The context is captured when recording begins and remains unchanged if the
 * source routine is edited during the recording. The selected date becomes the
 * workout date and cannot be changed on the recording screen.
 */
export interface WorkoutRecordingContext {
  /** Original source routine identifier. */
  routineId: RoutineId;
  /** Selected workout date. */
  date: DateOnly;
  /** Routine name captured when recording began. */
  routineNameSnapshot: string;
  /** Planned exercises in display order. */
  exercises: WorkoutExerciseSnapshot[];
}

/**
 * Previous saved result for one exercise, shown while recording or editing.
 *
 * The result uses historical snapshot data only. It contains the previous
 * workout date and the actual weights and repetitions recorded for each set.
 */
export interface PreviousExercisePerformance {
  /** Identifier of the workout that contains the previous result. */
  workoutId: WorkoutId;
  /** Date of the previous workout. */
  date: DateOnly;
  /** Recorded sets in ascending set-number order. */
  sets: WorkoutSetPerformance[];
}

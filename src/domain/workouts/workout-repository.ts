/**
 * Persistence port for saved workouts.
 *
 * Implemented by the Data / Infrastructure layer. Application use cases must
 * depend on this interface rather than on SQLite details.
 *
 * Requirements: `specs/002-workout-records/plan.md` §2.1–2.3.
 */

import type { DateOnly, RoutineId } from '../routines';
import type { Workout, WorkoutId, WorkoutSummary } from './models';

/** Optional filters for previous-performance candidate reads. */
export interface PreviousPerformanceCandidateOptions {
  /** Workout being edited; it must not be considered as its own previous result. */
  excludeWorkoutId?: WorkoutId;
}

/**
 * Persistence operations required by Workout Records.
 *
 * The repository keeps the workout, its exercise snapshots and its performed
 * sets independent from the current routine configuration. Deleting a routine
 * must never delete saved workouts.
 */
export interface WorkoutRepository {
  /**
   * Persists a new workout with its exercises and sets in one transaction.
   *
   * Implementations must reject a second workout for the same routine and
   * date without leaving partial data.
   */
  create(workout: Workout): Promise<void>;

  /**
   * Returns every complete saved workout with ordered exercises and sets,
   * newest first by workout date, save timestamp and identifier.
   */
  findAll(): Promise<Workout[]>;

  /** Returns the complete saved workout, or `null` when it does not exist. */
  findById(id: WorkoutId): Promise<Workout | null>;

  /** Returns the workout saved for a routine and date, or `null` when none exists. */
  findByRoutineAndDate(
    routineId: RoutineId,
    date: DateOnly,
  ): Promise<Workout | null>;

  /**
   * Returns every saved-workout summary, newest first by workout date and then
   * by save timestamp.
   */
  findSummaries(): Promise<WorkoutSummary[]>;

  /**
   * Returns saved-workout summaries whose date is >= `startDate` and
   * < `endDateExclusive`, newest first by workout date and save timestamp.
   */
  findSummariesByDateRange(
    startDate: DateOnly,
    endDateExclusive: DateOnly,
  ): Promise<WorkoutSummary[]>;

  /**
   * Returns complete saved workouts strictly before `selectedDate`, ordered
   * newest first by workout date and save timestamp so the application can
   * apply normalized exercise-name matching and select the latest result.
   */
  findPreviousPerformanceCandidates(
    selectedDate: DateOnly,
    options?: PreviousPerformanceCandidateOptions,
  ): Promise<Workout[]>;

  /**
   * Updates only the actual weights and repetitions of an existing workout.
   *
   * Date, snapshots, exercise identity, order, set count and planned values
   * must remain unchanged. Implementations verify that every provided exercise
   * belongs to the workout and that every set belongs to its workout exercise,
   * and run the update in a transaction.
   */
  updateActualSets(workout: Workout): Promise<void>;
}

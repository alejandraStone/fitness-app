import type { Routine, RoutineAssignment, RoutineId } from './models';

/** Optional records persisted atomically with a new routine. */
export interface CreateRoutineOptions {
  /**
   * One-time date assignment created with the routine. Persisting both in one
   * transaction keeps creation from Home consistent when the user chooses the
   * selected date during creation.
   */
  dateAssignment?: RoutineAssignment;
}

/**
 * Persistence port for routines.
 *
 * Implemented by the Data / Infrastructure layer. Application use cases must
 * depend on this interface rather than on SQLite details.
 */
export interface RoutineRepository {
  /**
   * Persists a new routine together with its exercise entries, recurring
   * weekdays and optional date assignment in a single transaction.
   */
  create(routine: Routine, options?: CreateRoutineOptions): Promise<void>;

  /** Returns all routines. */
  findAll(): Promise<Routine[]>;

  /** Returns the routine with the given identifier, or `null` if none exists. */
  findById(id: RoutineId): Promise<Routine | null>;

  /**
   * Replaces the current configuration of an existing routine, including its
   * exercise entries and recurring weekdays.
   */
  update(routine: Routine): Promise<void>;

  /**
   * Permanently deletes a routine together with its exercise entries and
   * scheduling assignments.
   *
   * Returns `false` when no routine exists with the given identifier.
   * Implementations must not delete saved workouts or historical snapshots.
   */
  delete(id: RoutineId): Promise<boolean>;
}

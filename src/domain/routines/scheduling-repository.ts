import type {
  DateOnly,
  RoutineAssignment,
  RoutineAssignmentId,
  RoutineId,
} from './models';

/**
 * Persistence port for individual-date routine assignments.
 *
 * Recurring weekdays are part of the `Routine` aggregate and are persisted
 * through `RoutineRepository`. This port owns only one-time assignments.
 * Implemented by the Data / Infrastructure layer.
 */
export interface SchedulingRepository {
  /**
   * Returns the assignment for a routine on a calendar date, or `null` when
   * the routine is not assigned to that date.
   */
  findAssignment(
    routineId: RoutineId,
    date: DateOnly,
  ): Promise<RoutineAssignment | null>;

  /** Returns all individual-date assignments for a calendar date. */
  findAssignmentsByDate(date: DateOnly): Promise<RoutineAssignment[]>;

  /**
   * Returns all individual-date assignments of a routine, ordered by date and
   * assignment identifier.
   */
  findAssignmentsByRoutine(
    routineId: RoutineId,
  ): Promise<RoutineAssignment[]>;

  /**
   * Returns individual-date assignments within an inclusive date range,
   * ordered by date and then routine.
   */
  findAssignmentsInRange(
    startDate: DateOnly,
    endDate: DateOnly,
  ): Promise<RoutineAssignment[]>;

  /** Persists a new individual-date assignment. */
  createAssignment(assignment: RoutineAssignment): Promise<void>;

  /**
   * Deletes an individual-date assignment independently from recurring
   * weekdays. Returns `false` when the assignment does not exist.
   */
  deleteAssignment(id: RoutineAssignmentId): Promise<boolean>;
}

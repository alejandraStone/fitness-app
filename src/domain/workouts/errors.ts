/**
 * Domain failures for the Workout Records module.
 */

import type { DateOnly, RoutineId } from '../routines';

/** Stable code for a workout that already exists for a routine and date. */
export const DUPLICATE_WORKOUT_CODE = 'workout.duplicate';

/**
 * Raised when a second workout is saved for the same routine and date.
 *
 * The constraint is enforced by SQLite; the Data layer maps that persistence
 * failure to this domain error so application code does not depend on SQLite
 * error messages. The message is user-facing and written in Spanish.
 */
export class DuplicateWorkoutError extends Error {
  readonly code = DUPLICATE_WORKOUT_CODE;
  readonly routineId: RoutineId;
  readonly date: DateOnly;

  constructor(routineId: RoutineId, date: DateOnly) {
    super('Ya existe un entrenamiento guardado para esta rutina y fecha.');
    this.name = 'DuplicateWorkoutError';
    this.routineId = routineId;
    this.date = date;
  }
}

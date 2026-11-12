/**
 * Application failures for the Workout Records module.
 *
 * Every message is written in Spanish because these values may be shown
 * directly by the presentation layer. Codes stay stable for programmatic
 * handling.
 */

import type { ValidationErrorCode } from '../../domain/routines';
import {
  DUPLICATE_WORKOUT_CODE,
  type WorkoutValidationErrorCode,
} from '../../domain/workouts';

/** Stable identifier of a workout use-case failure. */
export type WorkoutErrorCode =
  | ValidationErrorCode
  | WorkoutValidationErrorCode
  | 'workout.date.future'
  | 'workout.routine.notFound'
  | 'workout.routine.notScheduled'
  | 'workout.routine.deleted'
  | 'workout.save.failed'
  | 'workout.notFound'
  | 'workout.load.failed'
  | 'workout.update.failed'
  | 'workout.structure.changed'
  | 'workout.month.invalid'
  | typeof DUPLICATE_WORKOUT_CODE;

/** One workout failure addressed to a form field or operation target. */
export interface WorkoutError {
  field: string;
  code: WorkoutErrorCode;
  message: string;
}

/** Creates the error returned when a routine does not exist. */
export function workoutRoutineNotFoundError(): WorkoutError {
  return {
    field: 'routineId',
    code: 'workout.routine.notFound',
    message: 'No se encontró la rutina.',
  };
}

/** Creates the error returned when a routine is not scheduled for the date. */
export function workoutRoutineNotScheduledError(): WorkoutError {
  return {
    field: 'date',
    code: 'workout.routine.notScheduled',
    message: 'La rutina no está programada para la fecha seleccionada.',
  };
}

/** Creates the error returned when the selected date is in the future. */
export function workoutDateFutureError(): WorkoutError {
  return {
    field: 'date',
    code: 'workout.date.future',
    message: 'No puedes registrar un entrenamiento en una fecha futura.',
  };
}

/**
 * Creates the cancellation result used when the source routine was deleted
 * while the recording was open.
 */
export function workoutRoutineDeletedError(): WorkoutError {
  return {
    field: 'routineId',
    code: 'workout.routine.deleted',
    message:
      'La rutina se eliminó mientras registrabas el entrenamiento. El registro se canceló.',
  };
}

/** Creates the error returned when a routine/date workout already exists. */
export function workoutDuplicateError(message: string): WorkoutError {
  return {
    field: 'date',
    code: DUPLICATE_WORKOUT_CODE,
    message,
  };
}

/** Creates the recoverable error returned when persistence fails. */
export function workoutSaveFailedError(): WorkoutError {
  return {
    field: 'workout',
    code: 'workout.save.failed',
    message: 'No se pudo guardar el entrenamiento. Inténtalo de nuevo.',
  };
}

/** Creates the error returned when a workout identifier does not exist. */
export function workoutNotFoundError(): WorkoutError {
  return {
    field: 'workoutId',
    code: 'workout.notFound',
    message: 'No se encontró el entrenamiento.',
  };
}

/** Creates the error returned when stored workout data cannot be read. */
export function workoutLoadFailedError(
  message = 'No se pudo cargar el entrenamiento.',
): WorkoutError {
  return {
    field: 'workout',
    code: 'workout.load.failed',
    message,
  };
}

/** Creates the error returned when updating actual values fails. */
export function workoutUpdateFailedError(): WorkoutError {
  return {
    field: 'workout',
    code: 'workout.update.failed',
    message:
      'No se pudieron actualizar los valores del entrenamiento. Inténtalo de nuevo.',
  };
}

/**
 * Creates the error returned when an edit attempts to change a historical
 * snapshot field instead of an actual weight or repetition count.
 */
export function workoutStructureChangedError(field: string): WorkoutError {
  return {
    field,
    code: 'workout.structure.changed',
    message: 'Solo puedes cambiar el peso y las repeticiones de cada serie.',
  };
}

/** Creates the error returned when a month value cannot be interpreted. */
export function workoutMonthInvalidError(): WorkoutError {
  return {
    field: 'month',
    code: 'workout.month.invalid',
    message: 'El mes indicado no es válido.',
  };
}

import type { ValidationErrorCode } from '../../domain/routines';

/** Stable identifier of a scheduling use-case failure. */
export type SchedulingErrorCode =
  | ValidationErrorCode
  | 'routine.notFound'
  | 'assignment.notFound'
  | 'schedule.mode.invalid'
  | 'schedule.recurrence.dateMissing'
  | 'schedule.date.alreadyRecurring';

/** One scheduling failure addressed to a form field or operation target. */
export interface SchedulingError {
  field: string;
  code: SchedulingErrorCode;
  message: string;
}

/** Creates the standard error returned when a routine does not exist. */
export function routineNotFoundError(): SchedulingError {
  return {
    field: 'routineId',
    code: 'routine.notFound',
    message: 'No se encontró la rutina.',
  };
}

/** Creates the standard error returned when an assignment does not exist. */
export function assignmentNotFoundError(): SchedulingError {
  return {
    field: 'assignmentId',
    code: 'assignment.notFound',
    message: 'No se encontró la asignación.',
  };
}

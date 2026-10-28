import {
  validateDateOnly,
  type DateOnly,
  type RoutineAssignment,
  type RoutineId,
  type RoutineRepository,
  type SchedulingRepository,
} from '../../domain/routines';
import {
  routineNotFoundError,
  type SchedulingError,
} from './scheduling-errors';

/** Input accepted when assigning a routine to one calendar date. */
export interface AssignRoutineToDateInput {
  routineId: RoutineId;
  date: DateOnly;
}

/** External dependencies required to assign a routine to a date. */
export interface AssignRoutineToDateDependencies {
  routineRepository: RoutineRepository;
  schedulingRepository: SchedulingRepository;
  /** Generates stable identifiers for new assignments. */
  generateId: () => string;
}

/** Outcome of the individual-date assignment use case. */
export type AssignRoutineToDateResult =
  | { ok: true; assignment: RoutineAssignment }
  | { ok: false; errors: SchedulingError[] };

/**
 * Assigns a routine to one calendar date.
 *
 * The date is validated independently from recurring weekdays. Assigning a
 * date never changes recurring weekdays and never creates a workout record.
 * Repeating the same assignment returns the existing record without creating
 * a duplicate.
 */
export async function assignRoutineToDate(
  input: AssignRoutineToDateInput,
  dependencies: AssignRoutineToDateDependencies,
): Promise<AssignRoutineToDateResult> {
  const dateValidation = validateDateOnly(input.date);
  if (!dateValidation.ok) {
    return { ok: false, errors: dateValidation.errors };
  }

  const routine = await dependencies.routineRepository.findById(input.routineId);
  if (routine === null) {
    return { ok: false, errors: [routineNotFoundError()] };
  }

  const existing = await dependencies.schedulingRepository.findAssignment(
    input.routineId,
    dateValidation.value,
  );
  if (existing !== null) {
    return { ok: true, assignment: existing };
  }

  const assignment: RoutineAssignment = {
    id: dependencies.generateId(),
    routineId: input.routineId,
    date: dateValidation.value,
  };

  await dependencies.schedulingRepository.createAssignment(assignment);

  return { ok: true, assignment };
}

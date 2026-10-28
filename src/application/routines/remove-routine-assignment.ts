import type {
  RoutineAssignmentId,
  SchedulingRepository,
} from '../../domain/routines';
import {
  assignmentNotFoundError,
  type SchedulingError,
} from './scheduling-errors';

/** External dependencies required to remove an individual-date assignment. */
export interface RemoveRoutineAssignmentDependencies {
  schedulingRepository: SchedulingRepository;
}

/** Outcome of removing an individual-date assignment. */
export type RemoveRoutineAssignmentResult =
  | { ok: true }
  | { ok: false; errors: SchedulingError[] };

/**
 * Removes one individual-date assignment without changing recurring weekdays.
 */
export async function removeRoutineAssignment(
  assignmentId: RoutineAssignmentId,
  dependencies: RemoveRoutineAssignmentDependencies,
): Promise<RemoveRoutineAssignmentResult> {
  const deleted = await dependencies.schedulingRepository.deleteAssignment(
    assignmentId,
  );

  if (!deleted) {
    return { ok: false, errors: [assignmentNotFoundError()] };
  }

  return { ok: true };
}

import type {
  RoutineAssignment,
  RoutineId,
  SchedulingRepository,
} from '../../domain/routines';

/** External dependencies required to read one routine's one-time dates. */
export interface ListRoutineAssignmentsDependencies {
  schedulingRepository: SchedulingRepository;
}

/**
 * Returns every one-time date assignment of a routine in calendar order.
 *
 * Recurring weekdays belong to the routine aggregate and are not included.
 */
export async function listRoutineAssignments(
  routineId: RoutineId,
  dependencies: ListRoutineAssignmentsDependencies,
): Promise<RoutineAssignment[]> {
  return dependencies.schedulingRepository.findAssignmentsByRoutine(
    routineId,
  );
}

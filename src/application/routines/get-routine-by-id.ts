import type {
  Routine,
  RoutineId,
  RoutineRepository,
} from '../../domain/routines';
import { orderRoutineExercises } from './routine-ordering';

/** External dependencies required to retrieve a routine. */
export interface GetRoutineByIdDependencies {
  routineRepository: RoutineRepository;
}

/**
 * Retrieves one routine by identifier.
 *
 * Returns `null` when the identifier does not match an existing routine.
 */
export async function getRoutineById(
  routineId: RoutineId,
  dependencies: GetRoutineByIdDependencies,
): Promise<Routine | null> {
  const routine = await dependencies.routineRepository.findById(routineId);
  return routine === null ? null : orderRoutineExercises(routine);
}

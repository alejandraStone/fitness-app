import type { Routine, RoutineRepository } from '../../domain/routines';
import { orderRoutineExercises } from './routine-ordering';

/** External dependencies required to list routines. */
export interface ListRoutinesDependencies {
  routineRepository: RoutineRepository;
}

/**
 * Retrieves all routines with their exercise entries in configured order.
 */
export async function listRoutines(
  dependencies: ListRoutinesDependencies,
): Promise<Routine[]> {
  const routines = await dependencies.routineRepository.findAll();
  return routines.map(orderRoutineExercises);
}

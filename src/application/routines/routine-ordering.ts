import type { Routine } from '../../domain/routines';

/**
 * Returns a copy of the routine with exercise entries sorted by their
 * configured display order.
 *
 * Repositories return ordered entries; this also keeps the application
 * contract deterministic for any repository implementation.
 */
export function orderRoutineExercises(routine: Routine): Routine {
  return {
    ...routine,
    exercises: [...routine.exercises].sort(
      (left, right) => left.order - right.order,
    ),
  };
}

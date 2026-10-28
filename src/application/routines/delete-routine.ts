import type { RoutineId, RoutineRepository } from '../../domain/routines';

/** External dependencies required to delete a routine. */
export interface DeleteRoutineDependencies {
  routineRepository: RoutineRepository;
}

/** Failure returned when the routine cannot be found. */
export interface DeleteRoutineError {
  field: 'routineId';
  code: 'routine.notFound';
  message: string;
}

/** Outcome of the routine deletion use case. */
export type DeleteRoutineResult =
  | { ok: true }
  | { ok: false; errors: DeleteRoutineError[] };

/**
 * Permanently deletes a routine from current routine management.
 *
 * The repository is responsible for deleting the routine, its exercise
 * entries and its recurring and individual-date scheduling assignments as one
 * operation. Saved workouts and historical snapshots are not part of the
 * routine aggregate and must remain untouched.
 */
export async function deleteRoutine(
  routineId: RoutineId,
  dependencies: DeleteRoutineDependencies,
): Promise<DeleteRoutineResult> {
  const deleted = await dependencies.routineRepository.delete(routineId);
  if (!deleted) {
    return {
      ok: false,
      errors: [
        {
          field: 'routineId',
          code: 'routine.notFound',
          message: 'No se encontró la rutina.',
        },
      ],
    };
  }

  return { ok: true };
}

import type {
  Routine,
  RoutineExerciseId,
  RoutineId,
} from '../../domain/routines';
import { toUpdateRoutineExerciseInput } from './routine-exercise-input';
import {
  updateRoutine,
  type UpdateRoutineDependencies,
  type UpdateRoutineError,
} from './update-routine';

/** External dependencies required to remove one exercise entry. */
export type DeleteRoutineExerciseDependencies = UpdateRoutineDependencies;

/** Input accepted when removing one exercise entry. */
export interface DeleteRoutineExerciseInput {
  routineId: RoutineId;
  exerciseId: RoutineExerciseId;
}

/** Outcome of removing one exercise entry. */
export type DeleteRoutineExerciseResult =
  | { ok: true; routine: Routine }
  | { ok: false; errors: UpdateRoutineError[] };

/**
 * Removes one exercise entry without changing the routine schedule.
 *
 * The remaining configuration is saved through the routine update use case so
 * validation, timestamps and identifier handling remain centralized.
 */
export async function deleteRoutineExercise(
  input: DeleteRoutineExerciseInput,
  dependencies: DeleteRoutineExerciseDependencies,
): Promise<DeleteRoutineExerciseResult> {
  const existing = await dependencies.routineRepository.findById(input.routineId);
  if (existing === null) {
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

  if (
    !existing.exercises.some((exercise) => exercise.id === input.exerciseId)
  ) {
    return {
      ok: false,
      errors: [
        {
          field: 'exerciseId',
          code: 'exercise.unknownId',
          message: 'El ejercicio no pertenece a esta rutina.',
        },
      ],
    };
  }

  return updateRoutine(
    input.routineId,
    {
      name: existing.name,
      exercises: existing.exercises
        .filter((exercise) => exercise.id !== input.exerciseId)
        .map(toUpdateRoutineExerciseInput),
    },
    dependencies,
  );
}

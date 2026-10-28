import {
  validateRoutineExercise,
  type Routine,
  type RoutineExerciseId,
  type RoutineExerciseInput,
  type RoutineId,
} from '../../domain/routines';
import { toUpdateRoutineExerciseInput } from './routine-exercise-input';
import {
  updateRoutine,
  type UpdateRoutineDependencies,
  type UpdateRoutineError,
  type UpdateRoutineExerciseInput,
} from './update-routine';

/** External dependencies required to add or edit one exercise entry. */
export type SaveRoutineExerciseDependencies = UpdateRoutineDependencies;

/** Input accepted when adding or editing one exercise entry. */
export interface SaveRoutineExerciseInput {
  routineId: RoutineId;
  exercise: RoutineExerciseInput;
  /** Existing entry to replace. Omit it to append a new entry. */
  exerciseId?: RoutineExerciseId;
}

/** Outcome of adding or editing one exercise entry. */
export type SaveRoutineExerciseResult =
  | { ok: true; routine: Routine }
  | { ok: false; errors: UpdateRoutineError[] };

/**
 * Adds or edits one exercise entry without changing the routine schedule.
 *
 * The complete updated configuration is saved through the routine update use
 * case, which remains the single owner of validation, identifiers and
 * timestamps. Existing exercise identifiers and their order are preserved.
 */
export async function saveRoutineExercise(
  input: SaveRoutineExerciseInput,
  dependencies: SaveRoutineExerciseDependencies,
): Promise<SaveRoutineExerciseResult> {
  const exerciseValidation = validateRoutineExercise(input.exercise);
  if (!exerciseValidation.ok) {
    return { ok: false, errors: exerciseValidation.errors };
  }

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

  const exercises = existing.exercises.map(toUpdateRoutineExerciseInput);
  const targetIndex =
    input.exerciseId === undefined
      ? -1
      : exercises.findIndex((exercise) => exercise.id === input.exerciseId);

  if (input.exerciseId !== undefined && targetIndex < 0) {
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

  const nextExercise: UpdateRoutineExerciseInput = {
    ...exerciseValidation.value,
  };
  if (input.exerciseId === undefined) {
    exercises.push(nextExercise);
  } else {
    nextExercise.id = input.exerciseId;
    exercises[targetIndex] = nextExercise;
  }

  return updateRoutine(
    input.routineId,
    { name: existing.name, exercises },
    dependencies,
  );
}

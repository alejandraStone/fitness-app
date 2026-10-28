import type { Routine } from '../../domain/routines';
import type {
  RoutineFormError,
  RoutineFormExercise,
  RoutineFormValues,
} from './types';

/** Maps a persisted routine to the editable values used by the form. */
export function routineToFormValues(routine: Routine): RoutineFormValues {
  return {
    name: routine.name,
    weekdays: [...routine.weekdays],
    exercises: routine.exercises.map(toFormExercise),
  };
}

/** Converts application or domain errors into the form's display shape. */
export function toRoutineFormErrors(
  errors: readonly { field: string; message: string }[],
): RoutineFormError[] {
  return errors.map(({ field, message }) => ({ field, message }));
}

function toFormExercise(
  exercise: Routine['exercises'][number],
): RoutineFormExercise {
  const formExercise: RoutineFormExercise = {
    id: exercise.id,
    name: exercise.name,
    targetSets: exercise.targetSets,
    targetRepsMin: exercise.targetRepsMin,
    targetRepsMax: exercise.targetRepsMax,
    targetWeightKg: exercise.targetWeightKg,
  };

  if (exercise.notes !== undefined) {
    formExercise.notes = exercise.notes;
  }

  return formExercise;
}

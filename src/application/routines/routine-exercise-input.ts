import type { RoutineExercise } from '../../domain/routines';
import type { UpdateRoutineExerciseInput } from './update-routine';

/** Maps a persisted exercise to the input accepted by the routine editor. */
export function toUpdateRoutineExerciseInput(
  exercise: RoutineExercise,
): UpdateRoutineExerciseInput {
  const input: UpdateRoutineExerciseInput = {
    id: exercise.id,
    name: exercise.name,
    targetSets: exercise.targetSets,
    targetRepsMin: exercise.targetRepsMin,
    targetRepsMax: exercise.targetRepsMax,
    targetWeightKg: exercise.targetWeightKg,
  };

  if (exercise.notes !== undefined) {
    input.notes = exercise.notes;
  }

  return input;
}

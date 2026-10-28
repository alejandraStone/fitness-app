import {
  validateRoutineExercise,
  type ValidatedRoutineExercise,
  type ValidationResult,
} from '../../domain/routines';

/**
 * Raw exercise-form values. Numeric inputs are kept as text while the user is
 * typing and converted only when the entry is validated.
 */
export interface ExerciseFormValues {
  name: string;
  notes: string;
  targetSets: string;
  targetRepsMin: string;
  targetRepsMax: string;
  targetWeightKg: string;
}

/**
 * Converts exercise-form text into the domain input shape and validates it.
 *
 * The domain validator remains the single owner of the authoritative exercise
 * rules. An empty weight means no external load, matching the domain default.
 */
export function validateExerciseFormValues(
  values: ExerciseFormValues,
): ValidationResult<ValidatedRoutineExercise> {
  const weight = values.targetWeightKg.trim();

  return validateRoutineExercise({
    name: values.name,
    notes: values.notes,
    targetSets: toNumber(values.targetSets),
    targetRepsMin: toNumber(values.targetRepsMin),
    targetRepsMax: toNumber(values.targetRepsMax),
    targetWeightKg: weight === '' ? undefined : toNumber(weight),
  });
}

function toNumber(value: string): number {
  return Number(value.trim());
}

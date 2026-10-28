/**
 * Validation rules for the Routines and Scheduling module.
 *
 * These rules belong to the Domain layer and remain independent of React
 * Native and SQLite. Valid input is returned normalized so callers persist a
 * single canonical representation.
 *
 * Requirements: `docs/PRD.md` §3.2 and `specs/001-routines/spec.md` FR-01/FR-02.
 */

import type { RoutineExercise } from './models';

/** Exercise fields accepted when creating or editing a routine. */
export type RoutineExerciseInput = Pick<
  RoutineExercise,
  | 'name'
  | 'targetSets'
  | 'targetRepsMin'
  | 'targetRepsMax'
  | 'notes'
> & {
  /**
   * Optional planned external weight in kilograms. Omitted or undefined is
   * normalized to `0`, which represents no external load.
   */
  targetWeightKg?: number;
};

/** Exercise entry returned after successful validation. */
export type ValidatedRoutineExercise = Omit<
  RoutineExerciseInput,
  'targetWeightKg'
> & {
  targetWeightKg: number;
};

/** Routine fields accepted when creating or editing a routine. */
export interface RoutineInput {
  name: string;
  exercises: RoutineExerciseInput[];
}

/** Routine returned after successful validation. */
export interface ValidatedRoutineInput {
  name: string;
  exercises: ValidatedRoutineExercise[];
}

/** Stable identifier of a validation rule. */
export type ValidationErrorCode =
  | 'routine.invalid'
  | 'routine.name.required'
  | 'routine.exercises.invalid'
  | 'routine.exercises.required'
  | 'exercise.invalid'
  | 'exercise.name.required'
  | 'exercise.notes.invalid'
  | 'exercise.targetSets.invalid'
  | 'exercise.targetRepsMin.invalid'
  | 'exercise.targetRepsMax.invalid'
  | 'exercise.targetReps.range'
  | 'exercise.targetWeight.invalid'
  | 'schedule.weekdays.invalid'
  | 'schedule.weekday.invalid'
  | 'schedule.date.invalid';

/** One validation failure, addressed to a form field. */
export interface ValidationError {
  /** Field path, for example `name` or `exercises[0].targetSets`. */
  field: string;
  /** Stable rule identifier. */
  code: ValidationErrorCode;
  /** Human-readable explanation suitable for user feedback. */
  message: string;
}

/** Result of validating an input value. */
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

/**
 * Validates and normalizes a routine name.
 *
 * Leading and trailing whitespace is removed. The result must contain at
 * least one non-whitespace character.
 */
export function validateRoutineName(value: unknown): ValidationResult<string> {
  return validateRequiredText(
    value,
    'name',
    'routine.name.required',
    'El nombre de la rutina es obligatorio.',
  );
}

/**
 * Validates and normalizes one routine exercise entry.
 *
 * A valid entry has a non-empty name, a positive integer set count, positive
 * integer repetition bounds with minimum <= maximum, and a finite
 * non-negative planned weight in kilograms. An unspecified weight is treated
 * as zero (no external load), per `docs/PRD.md` §3.2. Optional notes are
 * trimmed; empty values become absent.
 */
export function validateRoutineExercise(
  value: unknown,
): ValidationResult<ValidatedRoutineExercise> {
  return validateExercise(value, '');
}

/**
 * Validates and normalizes a routine configuration before it is saved.
 *
 * A routine may be edited while empty, but saving requires at least one
 * exercise (`docs/PRD.md` §3.2 and `docs/architecture/database.md` §3.2).
 * All validation errors are returned so forms can present them together.
 */
export function validateRoutine(
  value: unknown,
): ValidationResult<ValidatedRoutineInput> {
  if (!isRecord(value)) {
    return failure([
      {
        field: 'routine',
        code: 'routine.invalid',
        message: 'La rutina debe ser un objeto.',
      },
    ]);
  }

  const errors: ValidationError[] = [];
  const nameResult = validateRoutineName(value.name);
  if (!nameResult.ok) {
    errors.push(...nameResult.errors);
  }

  const exercises: ValidatedRoutineExercise[] = [];
  if (!Array.isArray(value.exercises)) {
    errors.push({
      field: 'exercises',
      code: 'routine.exercises.invalid',
      message: 'Los ejercicios deben ser una lista.',
    });
  } else if (value.exercises.length === 0) {
    errors.push({
      field: 'exercises',
      code: 'routine.exercises.required',
      message:
        'La rutina debe contener al menos un ejercicio para poder guardarse.',
    });
  } else {
    value.exercises.forEach((exercise, index) => {
      const result = validateExercise(exercise, `exercises[${index}]`);
      if (result.ok) {
        exercises.push(result.value);
      } else {
        errors.push(...result.errors);
      }
    });
  }

  if (!nameResult.ok || errors.length > 0) {
    return failure(errors);
  }

  return success({ name: nameResult.value, exercises });
}

function validateExercise(
  value: unknown,
  fieldPrefix: string,
): ValidationResult<ValidatedRoutineExercise> {
  if (!isRecord(value)) {
    return failure([
      {
        field: fieldPrefix || 'exercise',
        code: 'exercise.invalid',
        message: 'El ejercicio debe ser un objeto.',
      },
    ]);
  }

  const errors: ValidationError[] = [];
  const nameResult = validateRequiredText(
    value.name,
    fieldPath(fieldPrefix, 'name'),
    'exercise.name.required',
    'El nombre del ejercicio es obligatorio.',
  );
  if (!nameResult.ok) {
    errors.push(...nameResult.errors);
  }

  const notes = normalizeOptionalText(
    value.notes,
    fieldPath(fieldPrefix, 'notes'),
    'exercise.notes.invalid',
    'La nota debe ser un texto.',
    errors,
  );

  const setsResult = validatePositiveInteger(
    value.targetSets,
    fieldPath(fieldPrefix, 'targetSets'),
    'exercise.targetSets.invalid',
    'Las series planificadas deben ser un número entero mayor que cero.',
  );
  if (!setsResult.ok) {
    errors.push(...setsResult.errors);
  }

  const repsMinResult = validatePositiveInteger(
    value.targetRepsMin,
    fieldPath(fieldPrefix, 'targetRepsMin'),
    'exercise.targetRepsMin.invalid',
    'Las repeticiones mínimas deben ser un número entero mayor que cero.',
  );
  if (!repsMinResult.ok) {
    errors.push(...repsMinResult.errors);
  }

  const repsMaxResult = validatePositiveInteger(
    value.targetRepsMax,
    fieldPath(fieldPrefix, 'targetRepsMax'),
    'exercise.targetRepsMax.invalid',
    'Las repeticiones máximas deben ser un número entero mayor que cero.',
  );
  if (!repsMaxResult.ok) {
    errors.push(...repsMaxResult.errors);
  }

  if (
    repsMinResult.ok &&
    repsMaxResult.ok &&
    repsMinResult.value > repsMaxResult.value
  ) {
    errors.push({
      field: fieldPath(fieldPrefix, 'targetRepsMax'),
      code: 'exercise.targetReps.range',
      message:
        'Las repeticiones máximas deben ser mayores o iguales que las mínimas.',
    });
  }

  const weightResult = validateNonNegativeNumber(
    value.targetWeightKg === undefined ? 0 : value.targetWeightKg,
    fieldPath(fieldPrefix, 'targetWeightKg'),
    'exercise.targetWeight.invalid',
    'El peso planificado debe ser un número mayor o igual que cero.',
  );
  if (!weightResult.ok) {
    errors.push(...weightResult.errors);
  }

  // Explicit checks are required for TypeScript to narrow the union types
  // before reading the normalized values below.
  if (
    !nameResult.ok ||
    !setsResult.ok ||
    !repsMinResult.ok ||
    !repsMaxResult.ok ||
    !weightResult.ok ||
    errors.length > 0
  ) {
    return failure(errors);
  }

  const exercise: ValidatedRoutineExercise = {
    name: nameResult.value,
    targetSets: setsResult.value,
    targetRepsMin: repsMinResult.value,
    targetRepsMax: repsMaxResult.value,
    targetWeightKg: weightResult.value,
  };
  if (notes !== undefined) {
    exercise.notes = notes;
  }

  return success(exercise);
}

function validateRequiredText(
  value: unknown,
  field: string,
  code: ValidationErrorCode,
  message: string,
): ValidationResult<string> {
  if (typeof value !== 'string') {
    return failure([{ field, code, message }]);
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return failure([{ field, code, message }]);
  }

  return success(normalized);
}

function normalizeOptionalText(
  value: unknown,
  field: string,
  code: ValidationErrorCode,
  message: string,
  errors: ValidationError[],
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    errors.push({ field, code, message });
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function validatePositiveInteger(
  value: unknown,
  field: string,
  code: ValidationErrorCode,
  message: string,
): ValidationResult<number> {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    return failure([{ field, code, message }]);
  }

  return success(value);
}

function validateNonNegativeNumber(
  value: unknown,
  field: string,
  code: ValidationErrorCode,
  message: string,
): ValidationResult<number> {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return failure([{ field, code, message }]);
  }

  // Normalize negative zero so the persisted value is always canonical.
  return success(value === 0 ? 0 : value);
}

function fieldPath(prefix: string, field: string): string {
  return prefix ? `${prefix}.${field}` : field;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function success<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function failure<T>(errors: ValidationError[]): ValidationResult<T> {
  return { ok: false, errors };
}

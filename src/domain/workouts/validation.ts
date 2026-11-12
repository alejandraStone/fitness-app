/**
 * Validation rules for the Workout Records module.
 *
 * These rules belong to the Domain layer and remain independent of React
 * Native and SQLite. Every user-facing message is written in Spanish.
 *
 * Requirements: `specs/002-workout-records/spec.md` FR-02 and FR-03.
 */

import type { Routine } from '../routines';
import type {
  WorkoutExerciseSnapshot,
  WorkoutRecordingContext,
  WorkoutSetPerformance,
} from './models';

/** Stable identifier of a workout validation rule. */
export type WorkoutValidationErrorCode =
  | 'workout.exercises.invalid'
  | 'workout.exercises.countMismatch'
  | 'workout.exercise.invalid'
  | 'workout.sets.invalid'
  | 'workout.sets.countMismatch'
  | 'workout.set.invalid'
  | 'workout.set.weight.invalid'
  | 'workout.set.reps.invalid';

/** One validation failure, addressed to a form field. */
export interface WorkoutValidationError {
  /** Field path, for example `exercises[0].sets[2].reps`. */
  field: string;
  /** Stable rule identifier. */
  code: WorkoutValidationErrorCode;
  /** Human-readable explanation suitable for user feedback. */
  message: string;
}

/** Result of validating a workout value. */
export type WorkoutValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: WorkoutValidationError[] };

/** Validated actual values for one exercise, aligned with its snapshot order. */
export interface ValidatedWorkoutExercisePerformance {
  /** Zero-based display order copied from the captured snapshot. */
  order: number;
  /** Performed sets in ascending set-number order. */
  sets: WorkoutSetPerformance[];
}

/** Validated actual values for every planned exercise. */
export type ValidatedWorkoutPerformance = ValidatedWorkoutExercisePerformance[];

/**
 * Builds the immutable exercise snapshots captured when recording begins.
 *
 * The routine is not mutated. Entries are sorted by their configured order and
 * receive contiguous positions in the snapshot, preserving every configured
 * entry even when two entries share the same name.
 */
export function buildWorkoutSnapshot(
  routine: Routine,
): WorkoutExerciseSnapshot[] {
  return [...routine.exercises]
    .sort((left, right) => left.order - right.order)
    .map((exercise, order) => {
      const snapshot: WorkoutExerciseSnapshot = {
        nameSnapshot: exercise.name,
        order,
        plannedSets: exercise.targetSets,
        plannedRepsMin: exercise.targetRepsMin,
        plannedRepsMax: exercise.targetRepsMax,
        plannedWeightKg: exercise.targetWeightKg,
      };

      if (exercise.notes !== undefined) {
        snapshot.notesSnapshot = exercise.notes;
      }

      return snapshot;
    });
}

/**
 * Validates the actual performance captured for every planned exercise.
 *
 * Input is expected to align positionally with `context.exercises`, and each
 * exercise's sets with its planned set count. A valid result contains exactly
 * one recorded set per planned set; no set can be added, removed or skipped.
 * Empty values are not converted to zero: only an explicit non-negative
 * weight and a positive integer repetition count are accepted.
 */
export function validateWorkoutPerformance(
  context: WorkoutRecordingContext,
  actuals: unknown,
): WorkoutValidationResult<ValidatedWorkoutPerformance> {
  if (!Array.isArray(actuals)) {
    return failure([
      {
        field: 'exercises',
        code: 'workout.exercises.invalid',
        message: 'El registro debe contener los ejercicios planificados.',
      },
    ]);
  }

  const errors: WorkoutValidationError[] = [];
  const validated: ValidatedWorkoutPerformance = [];

  if (actuals.length !== context.exercises.length) {
    errors.push({
      field: 'exercises',
      code: 'workout.exercises.countMismatch',
      message: 'La cantidad de ejercicios no coincide con la rutina planificada.',
    });
  }

  context.exercises.forEach((snapshot, exerciseIndex) => {
    const fieldPrefix = `exercises[${exerciseIndex}]`;
    const actual = actuals[exerciseIndex];

    if (!isRecord(actual)) {
      errors.push({
        field: fieldPrefix,
        code: 'workout.exercise.invalid',
        message: 'El ejercicio debe ser un objeto.',
      });
      return;
    }

    if (!Array.isArray(actual.sets)) {
      errors.push({
        field: `${fieldPrefix}.sets`,
        code: 'workout.sets.invalid',
        message: 'Las series deben ser una lista.',
      });
      return;
    }

    const sets: unknown[] = actual.sets;
    const exerciseErrorsBefore = errors.length;

    if (sets.length !== snapshot.plannedSets) {
      errors.push({
        field: `${fieldPrefix}.sets`,
        code: 'workout.sets.countMismatch',
        message:
          'Debes registrar exactamente una serie por cada serie planificada.',
      });
    }

    const validatedSets: WorkoutSetPerformance[] = [];

    sets.forEach((set, setIndex) => {
      const setFieldPrefix = `${fieldPrefix}.sets[${setIndex}]`;

      if (!isRecord(set)) {
        errors.push({
          field: setFieldPrefix,
          code: 'workout.set.invalid',
          message: 'La serie debe ser un objeto.',
        });
        return;
      }

      const weightResult = validateActualWeight(set.weightKg);
      const repsResult = validateActualReps(set.reps);

      if (!weightResult.ok) {
        errors.push({
          field: `${setFieldPrefix}.weightKg`,
          code: 'workout.set.weight.invalid',
          message: 'El peso debe ser un número mayor o igual que cero.',
        });
      }

      if (!repsResult.ok) {
        errors.push({
          field: `${setFieldPrefix}.reps`,
          code: 'workout.set.reps.invalid',
          message:
            'Las repeticiones deben ser un número entero mayor que cero.',
        });
      }

      if (weightResult.ok && repsResult.ok) {
        validatedSets.push({
          setNumber: setIndex + 1,
          weightKg: weightResult.value,
          reps: repsResult.value,
        });
      }
    });

    if (errors.length === exerciseErrorsBefore) {
      validated.push({ order: snapshot.order, sets: validatedSets });
    }
  });

  if (errors.length > 0) {
    return failure(errors);
  }

  return success(validated);
}

function validateActualWeight(
  value: unknown,
): { ok: true; value: number } | { ok: false } {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return { ok: false };
  }

  // Normalize negative zero so the validated value is always canonical.
  return { ok: true, value: value === 0 ? 0 : value };
}

function validateActualReps(
  value: unknown,
): { ok: true; value: number } | { ok: false } {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    return { ok: false };
  }

  return { ok: true, value };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function success<T>(value: T): WorkoutValidationResult<T> {
  return { ok: true, value };
}

function failure<T>(
  errors: WorkoutValidationError[],
): WorkoutValidationResult<T> {
  return { ok: false, errors };
}

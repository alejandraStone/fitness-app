import { describe, expect, it } from '@jest/globals';

import {
  validateRoutine,
  validateRoutineExercise,
  validateRoutineName,
} from './validation';

const validExercise = {
  name: 'Back Squat',
  targetSets: 4,
  targetRepsMin: 6,
  targetRepsMax: 8,
  targetWeightKg: 75,
};

describe('validateRoutineName', () => {
  it('accepts a non-empty name and trims surrounding whitespace', () => {
    const result = validateRoutineName('  Lower A  ');

    expect(result).toEqual({ ok: true, value: 'Lower A' });
  });

  it('accepts a single non-whitespace character', () => {
    expect(validateRoutineName('A')).toEqual({ ok: true, value: 'A' });
  });

  it('rejects an empty name', () => {
    const result = validateRoutineName('');

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toEqual([
      {
        field: 'name',
        code: 'routine.name.required',
        message: 'El nombre de la rutina es obligatorio.',
      },
    ]);
  });

  it('rejects a whitespace-only name', () => {
    expect(validateRoutineName('   \t\n ').ok).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(validateRoutineName(undefined).ok).toBe(false);
    expect(validateRoutineName(null).ok).toBe(false);
    expect(validateRoutineName(42).ok).toBe(false);
  });
});

describe('validateRoutineExercise', () => {
  it('accepts a valid exercise and returns the normalized values', () => {
    const result = validateRoutineExercise(validExercise);

    expect(result).toEqual({ ok: true, value: validExercise });
  });

  it('trims the name and optional text fields', () => {
    const result = validateRoutineExercise({
      ...validExercise,
      name: '  Bench Press  ',
      notes: '  Pause at the bottom  ',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        ...validExercise,
        name: 'Bench Press',
        notes: 'Pause at the bottom',
      },
    });
  });

  it('omits optional text fields when they are empty after trimming', () => {
    const result = validateRoutineExercise({
      ...validExercise,
      notes: '',
    });

    expect(result).toEqual({ ok: true, value: validExercise });
  });

  it('accepts a zero planned weight as an exercise without external load', () => {
    const result = validateRoutineExercise({ ...validExercise, targetWeightKg: 0 });

    expect(result).toEqual({
      ok: true,
      value: { ...validExercise, targetWeightKg: 0 },
    });
  });

  it('accepts fractional planned weights', () => {
    const result = validateRoutineExercise({
      ...validExercise,
      targetWeightKg: 62.5,
    });

    expect(result).toEqual({
      ok: true,
      value: { ...validExercise, targetWeightKg: 62.5 },
    });
  });

  it('treats an unspecified planned weight as zero (no external load)', () => {
    const result = validateRoutineExercise({
      name: 'Pull-up',
      targetSets: 3,
      targetRepsMin: 5,
      targetRepsMax: 8,
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: 'Pull-up',
        targetSets: 3,
        targetRepsMin: 5,
        targetRepsMax: 8,
        targetWeightKg: 0,
      },
    });
  });

  it('normalizes negative zero weight to zero', () => {
    const result = validateRoutineExercise({
      ...validExercise,
      targetWeightKg: -0,
    });

    expect(result.ok && Object.is(result.value.targetWeightKg, -0)).toBe(false);
    expect(result).toEqual({
      ok: true,
      value: { ...validExercise, targetWeightKg: 0 },
    });
  });

  it('accepts a large safe integer set count and rejects unsafe integers', () => {
    expect(
      validateRoutineExercise({
        ...validExercise,
        targetSets: Number.MAX_SAFE_INTEGER,
      }).ok,
    ).toBe(true);
    expect(
      validateRoutineExercise({
        ...validExercise,
        targetSets: Number.MAX_SAFE_INTEGER + 1,
      }).ok,
    ).toBe(false);
  });

  it('accepts equal minimum and maximum repetitions', () => {
    const result = validateRoutineExercise({
      ...validExercise,
      targetRepsMin: 8,
      targetRepsMax: 8,
    });

    expect(result).toEqual({
      ok: true,
      value: { ...validExercise, targetRepsMin: 8, targetRepsMax: 8 },
    });
  });

  it('rejects a missing exercise name', () => {
    const result = validateRoutineExercise({ ...validExercise, name: '  ' });

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'name',
        code: 'exercise.name.required',
        message: 'El nombre del ejercicio es obligatorio.',
      },
    ]);
  });

  it('rejects invalid planned set counts', () => {
    for (const targetSets of [0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY, '3']) {
      const result = validateRoutineExercise({ ...validExercise, targetSets });

      expect(result.ok).toBe(false);
      expect(!result.ok && result.errors[0].code).toBe(
        'exercise.targetSets.invalid',
      );
    }
  });

  it('rejects non-positive repetition bounds', () => {
    const minResult = validateRoutineExercise({
      ...validExercise,
      targetRepsMin: 0,
    });
    const maxResult = validateRoutineExercise({
      ...validExercise,
      targetRepsMax: -3,
    });

    expect(!minResult.ok && minResult.errors[0].code).toBe(
      'exercise.targetRepsMin.invalid',
    );
    expect(!maxResult.ok && maxResult.errors[0].code).toBe(
      'exercise.targetRepsMax.invalid',
    );
  });

  it('rejects a minimum repetition count greater than the maximum', () => {
    const result = validateRoutineExercise({
      ...validExercise,
      targetRepsMin: 10,
      targetRepsMax: 8,
    });

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'targetRepsMax',
        code: 'exercise.targetReps.range',
        message:
          'Las repeticiones máximas deben ser mayores o iguales que las mínimas.',
      },
    ]);
  });

  it('rejects negative, non-finite or non-numeric planned weights', () => {
    for (const targetWeightKg of [-0.5, Number.NaN, Number.POSITIVE_INFINITY, '75']) {
      const result = validateRoutineExercise({ ...validExercise, targetWeightKg });

      expect(result.ok).toBe(false);
      expect(!result.ok && result.errors[0].code).toBe(
        'exercise.targetWeight.invalid',
      );
    }
  });

  it('rejects non-string optional notes', () => {
    const result = validateRoutineExercise({
      ...validExercise,
      notes: false,
    });

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'notes',
        code: 'exercise.notes.invalid',
        message: 'La nota debe ser un texto.',
      },
    ]);
  });

  it('rejects values that are not objects', () => {
    expect(validateRoutineExercise(null).ok).toBe(false);
    expect(validateRoutineExercise([]).ok).toBe(false);
  });
});

describe('validateRoutine', () => {
  it('accepts a routine with ordered exercise entries', () => {
    const result = validateRoutine({
      name: '  Lower A  ',
      exercises: [
        { ...validExercise, name: 'Back Squat' },
        { ...validExercise, name: 'Romanian Deadlift', targetSets: 3 },
      ],
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: 'Lower A',
        exercises: [
          { ...validExercise, name: 'Back Squat' },
          { ...validExercise, name: 'Romanian Deadlift', targetSets: 3 },
        ],
      },
    });
  });

  it('rejects a routine without exercises when saving', () => {
    const result = validateRoutine({ name: 'Lower A', exercises: [] });

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'exercises',
        code: 'routine.exercises.required',
        message:
          'La rutina debe contener al menos un ejercicio para poder guardarse.',
      },
    ]);
  });

  it('rejects a missing exercises list', () => {
    const result = validateRoutine({ name: 'Lower A' });

    expect(!result.ok && result.errors[0].code).toBe(
      'routine.exercises.invalid',
    );
  });

  it('reports every invalid field with its exercise position', () => {
    const result = validateRoutine({
      name: '   ',
      exercises: [
        validExercise,
        { ...validExercise, name: '', targetSets: 0, targetWeightKg: -5 },
      ],
    });

    expect(!result.ok && result.errors.map((error) => error.field)).toEqual([
      'name',
      'exercises[1].name',
      'exercises[1].targetSets',
      'exercises[1].targetWeightKg',
    ]);
  });

  it('rejects values that are not objects', () => {
    expect(validateRoutine(null).ok).toBe(false);
    expect(validateRoutine('Lower A').ok).toBe(false);
    expect(validateRoutine([]).ok).toBe(false);
  });

  it('does not mutate the input', () => {
    const input = {
      name: '  Lower A  ',
      exercises: [{ ...validExercise, name: '  Back Squat  ' }],
    };
    const snapshot = structuredClone(input);

    validateRoutine(input);

    expect(input).toEqual(snapshot);
  });
});

import { describe, expect, it } from '@jest/globals';

import { validateExerciseFormValues } from './exercise-form-values';

describe('validateExerciseFormValues', () => {
  it('normalizes valid text values into a domain exercise entry', () => {
    const result = validateExerciseFormValues({
      name: '  Back Squat  ',
      notes: '  Controlled  ',
      targetSets: '4',
      targetRepsMin: '6',
      targetRepsMax: '8',
      targetWeightKg: '75',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: 'Back Squat',
        notes: 'Controlled',
        targetSets: 4,
        targetRepsMin: 6,
        targetRepsMax: 8,
        targetWeightKg: 75,
      },
    });
  });

  it('treats an empty weight as no external load', () => {
    const result = validateExerciseFormValues({
      name: 'Pull-up',
      notes: '',
      targetSets: '3',
      targetRepsMin: '5',
      targetRepsMax: '8',
      targetWeightKg: '   ',
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

  it('reports invalid numeric values through the domain rules', () => {
    const result = validateExerciseFormValues({
      name: 'Back Squat',
      notes: '',
      targetSets: '0',
      targetRepsMin: '8',
      targetRepsMax: '6',
      targetWeightKg: '-1',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected exercise validation to fail.');
    }

    expect(result.errors.map((error) => error.code)).toEqual([
      'exercise.targetSets.invalid',
      'exercise.targetReps.range',
      'exercise.targetWeight.invalid',
    ]);
  });
});

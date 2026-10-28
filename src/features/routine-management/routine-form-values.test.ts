import { describe, expect, it } from '@jest/globals';

import type { Routine } from '../../domain/routines';
import {
  routineToFormValues,
  toRoutineFormErrors,
} from './routine-form-values';

const ROUTINE: Routine = {
  id: 'routine-1',
  name: 'Lower A',
  weekdays: [1, 3],
  exercises: [
    {
      id: 'exercise-1',
      routineId: 'routine-1',
      name: 'Back Squat',
      order: 0,
      targetSets: 4,
      targetRepsMin: 6,
      targetRepsMax: 8,
      targetWeightKg: 75,
      notes: 'Belt',
    },
  ],
  createdAt: '2026-10-18T08:00:00.000Z',
  updatedAt: '2026-10-19T08:00:00.000Z',
};

describe('routine form values', () => {
  it('preserves exercise identifiers and configuration when editing', () => {
    const values = routineToFormValues(ROUTINE);

    expect(values).toEqual({
      name: 'Lower A',
      weekdays: [1, 3],
      exercises: [
        {
          id: 'exercise-1',
          name: 'Back Squat',
          notes: 'Belt',
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 8,
          targetWeightKg: 75,
        },
      ],
    });
    expect(values.weekdays).not.toBe(ROUTINE.weekdays);
  });

  it('maps application errors to form errors', () => {
    expect(
      toRoutineFormErrors([
        { field: 'name', message: 'El nombre de la rutina es obligatorio.' },
        { field: 'exercises', message: 'Añade al menos un ejercicio.' },
      ]),
    ).toEqual([
      { field: 'name', message: 'El nombre de la rutina es obligatorio.' },
      { field: 'exercises', message: 'Añade al menos un ejercicio.' },
    ]);
  });
});

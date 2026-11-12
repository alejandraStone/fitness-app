import { describe, expect, it } from '@jest/globals';

import type { Workout, WorkoutRecordingContext } from '../../domain/workouts';
import {
  createEditingContext,
  createEditingFormValues,
  createRecordingFormValues,
  validateWorkoutFormValues,
  type WorkoutFormValues,
} from './workout-form-values';

function createContext(): WorkoutRecordingContext {
  return {
    routineId: 'routine-1',
    date: '2026-11-02',
    routineNameSnapshot: 'Lower A',
    exercises: [
      {
        nameSnapshot: 'Back Squat',
        order: 0,
        plannedSets: 2,
        plannedRepsMin: 8,
        plannedRepsMax: 10,
        plannedWeightKg: 75,
      },
      {
        nameSnapshot: 'Leg Curl',
        order: 1,
        plannedSets: 1,
        plannedRepsMin: 10,
        plannedRepsMax: 12,
        plannedWeightKg: 30,
      },
    ],
  };
}

function validValues(): WorkoutFormValues {
  return [
    {
      sets: [
        { weightKg: '80', reps: '8' },
        { weightKg: ' 82.5 ', reps: '7' },
      ],
    },
    {
      sets: [{ weightKg: '0', reps: '12' }],
    },
  ];
}

function createWorkout(): Workout {
  return {
    id: 'workout-1',
    routineId: 'routine-1',
    date: '2026-11-02',
    routineNameSnapshot: 'Lower A',
    savedAt: '2026-11-02T18:00:00.000Z',
    exercises: [
      {
        id: 'workout-exercise-1',
        nameSnapshot: 'Back Squat',
        order: 0,
        plannedSets: 2,
        plannedRepsMin: 8,
        plannedRepsMax: 10,
        plannedWeightKg: 75,
        notesSnapshot: 'Brace before descending.',
        sets: [
          { id: 'set-1', setNumber: 1, weightKg: 80, reps: 8 },
          { id: 'set-2', setNumber: 2, weightKg: 82.5, reps: 7 },
        ],
      },
      {
        id: 'workout-exercise-2',
        nameSnapshot: 'Leg Curl',
        order: 1,
        plannedSets: 1,
        plannedRepsMin: 10,
        plannedRepsMax: 12,
        plannedWeightKg: 30,
        sets: [{ id: 'set-3', setNumber: 1, weightKg: 0, reps: 12 }],
      },
    ],
  };
}

describe('validateWorkoutFormValues', () => {
  it('converts valid text values into ordered actual performance', () => {
    const result = validateWorkoutFormValues(createContext(), validValues());

    expect(result).toEqual({
      ok: true,
      value: [
        {
          order: 0,
          sets: [
            { setNumber: 1, weightKg: 80, reps: 8 },
            { setNumber: 2, weightKg: 82.5, reps: 7 },
          ],
        },
        {
          order: 1,
          sets: [{ setNumber: 1, weightKg: 0, reps: 12 }],
        },
      ],
    });
  });

  it('rejects empty repetitions and never converts them to zero', () => {
    const values = validValues();
    values[0].sets[0].reps = '   ';

    const result = validateWorkoutFormValues(createContext(), values);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected empty repetitions to be invalid.');
    }

    expect(result.errors).toEqual([
      {
        field: 'exercises[0].sets[0].reps',
        code: 'workout.set.reps.invalid',
        message: 'Las repeticiones deben ser un número entero mayor que cero.',
      },
    ]);
  });

  it('rejects empty and non-numeric weights with their set field paths', () => {
    const values = validValues();
    values[0].sets[0].weightKg = '   ';
    values[0].sets[1].weightKg = 'mucho';

    const result = validateWorkoutFormValues(createContext(), values);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid weights to be rejected.');
    }

    expect(result.errors.map((error) => error.field)).toEqual([
      'exercises[0].sets[0].weightKg',
      'exercises[0].sets[1].weightKg',
    ]);
    expect(result.errors.map((error) => error.code)).toEqual([
      'workout.set.weight.invalid',
      'workout.set.weight.invalid',
    ]);
  });

  it('rejects non-integer and zero repetitions', () => {
    const values = validValues();
    values[0].sets[0].reps = '7.5';
    values[0].sets[1].reps = '0';

    const result = validateWorkoutFormValues(createContext(), values);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid repetitions to be rejected.');
    }

    expect(result.errors.map((error) => error.field)).toEqual([
      'exercises[0].sets[0].reps',
      'exercises[0].sets[1].reps',
    ]);
  });

  it('preserves exercise and set count field paths from the domain rules', () => {
    const fewerExercises: WorkoutFormValues = [validValues()[0]];
    const fewerSets = validValues();
    fewerSets[0].sets = [fewerSets[0].sets[0]];

    const exerciseResult = validateWorkoutFormValues(
      createContext(),
      fewerExercises,
    );
    const setResult = validateWorkoutFormValues(createContext(), fewerSets);

    expect(exerciseResult.ok).toBe(false);
    if (exerciseResult.ok) {
      throw new Error('Expected the exercise count mismatch to fail.');
    }
    expect(exerciseResult.errors).toContainEqual({
      field: 'exercises',
      code: 'workout.exercises.countMismatch',
      message:
        'La cantidad de ejercicios no coincide con la rutina planificada.',
    });

    expect(setResult.ok).toBe(false);
    if (setResult.ok) {
      throw new Error('Expected the set count mismatch to fail.');
    }
    expect(setResult.errors).toContainEqual({
      field: 'exercises[0].sets',
      code: 'workout.sets.countMismatch',
      message:
        'Debes registrar exactamente una serie por cada serie planificada.',
    });
  });
});

describe('createRecordingFormValues', () => {
  it('prefills planned weights and leaves every repetition empty', () => {
    expect(createRecordingFormValues(createContext())).toEqual([
      {
        sets: [
          { weightKg: '75', reps: '' },
          { weightKg: '75', reps: '' },
        ],
      },
      {
        sets: [{ weightKg: '30', reps: '' }],
      },
    ]);
  });
});

describe('editing form values', () => {
  it('prefills actual weights and repetitions from the saved workout', () => {
    expect(createEditingFormValues(createWorkout())).toEqual([
      {
        sets: [
          { weightKg: '80', reps: '8' },
          { weightKg: '82.5', reps: '7' },
        ],
      },
      {
        sets: [{ weightKg: '0', reps: '12' }],
      },
    ]);
  });

  it('rebuilds the snapshot context without reading the current routine', () => {
    expect(createEditingContext(createWorkout())).toEqual({
      routineId: 'routine-1',
      date: '2026-11-02',
      routineNameSnapshot: 'Lower A',
      exercises: [
        {
          nameSnapshot: 'Back Squat',
          order: 0,
          plannedSets: 2,
          plannedRepsMin: 8,
          plannedRepsMax: 10,
          plannedWeightKg: 75,
          notesSnapshot: 'Brace before descending.',
        },
        {
          nameSnapshot: 'Leg Curl',
          order: 1,
          plannedSets: 1,
          plannedRepsMin: 10,
          plannedRepsMax: 12,
          plannedWeightKg: 30,
        },
      ],
    });
  });
});

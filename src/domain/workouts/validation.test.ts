import { describe, expect, it } from '@jest/globals';

import type { Routine, RoutineExercise } from '../routines';
import type { WorkoutRecordingContext } from './models';
import {
  buildWorkoutSnapshot,
  validateWorkoutPerformance,
} from './validation';

function makeRoutine(exercises: RoutineExercise[]): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [],
    exercises,
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  };
}

function makeExercise(
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id: 'routine-exercise-1',
    routineId: 'routine-1',
    name: 'Back Squat',
    order: 0,
    targetSets: 2,
    targetRepsMin: 6,
    targetRepsMax: 8,
    targetWeightKg: 75,
    ...overrides,
  };
}

function makeContext(
  exercises: WorkoutRecordingContext['exercises'],
): WorkoutRecordingContext {
  return {
    routineId: 'routine-1',
    date: '2026-11-02',
    routineNameSnapshot: 'Lower A',
    exercises,
  };
}

const squatContext = makeContext([
  {
    nameSnapshot: 'Back Squat',
    order: 0,
    plannedSets: 2,
    plannedRepsMin: 6,
    plannedRepsMax: 8,
    plannedWeightKg: 75,
  },
  {
    nameSnapshot: 'Leg Curl',
    order: 1,
    plannedSets: 1,
    plannedRepsMin: 8,
    plannedRepsMax: 12,
    plannedWeightKg: 0,
  },
]);

describe('buildWorkoutSnapshot', () => {
  it('captures ordered exercise configuration without mutating the routine', () => {
    const routine = makeRoutine([
      makeExercise({
        id: 'exercise-order-1',
        name: 'Leg Curl',
        order: 1,
        targetSets: 3,
      }),
      makeExercise({
        id: 'exercise-order-0',
        name: 'Back Squat',
        order: 0,
        notes: '  Pause at the bottom  ',
      }),
    ]);
    const originalOrder = routine.exercises.map((exercise) => exercise.id);

    const snapshot = buildWorkoutSnapshot(routine);

    expect(snapshot).toEqual([
      {
        nameSnapshot: 'Back Squat',
        order: 0,
        plannedSets: 2,
        plannedRepsMin: 6,
        plannedRepsMax: 8,
        plannedWeightKg: 75,
        notesSnapshot: '  Pause at the bottom  ',
      },
      {
        nameSnapshot: 'Leg Curl',
        order: 1,
        plannedSets: 3,
        plannedRepsMin: 6,
        plannedRepsMax: 8,
        plannedWeightKg: 75,
      },
    ]);
    expect(routine.exercises.map((exercise) => exercise.id)).toEqual(
      originalOrder,
    );
  });

  it('preserves every entry when two exercises share the same name', () => {
    const routine = makeRoutine([
      makeExercise({ id: 'exercise-1', name: 'Back Squat', order: 0 }),
      makeExercise({ id: 'exercise-2', name: 'Back Squat', order: 1 }),
    ]);

    const snapshot = buildWorkoutSnapshot(routine);

    expect(snapshot).toHaveLength(2);
    expect(snapshot.map((exercise) => exercise.nameSnapshot)).toEqual([
      'Back Squat',
      'Back Squat',
    ]);
    expect(snapshot.map((exercise) => exercise.order)).toEqual([0, 1]);
  });
});

describe('validateWorkoutPerformance', () => {
  it('accepts one valid recorded set per planned set', () => {
    const result = validateWorkoutPerformance(squatContext, [
      {
        sets: [
          { weightKg: 75, reps: 8 },
          { weightKg: 72.5, reps: 10 },
        ],
      },
      { sets: [{ weightKg: 0, reps: 12 }] },
    ]);

    expect(result).toEqual({
      ok: true,
      value: [
        {
          order: 0,
          sets: [
            { setNumber: 1, weightKg: 75, reps: 8 },
            { setNumber: 2, weightKg: 72.5, reps: 10 },
          ],
        },
        {
          order: 1,
          sets: [{ setNumber: 1, weightKg: 0, reps: 12 }],
        },
      ],
    });
  });

  it('accepts zero kilograms as an exercise without external load', () => {
    const context = makeContext([
      {
        nameSnapshot: 'Pull-up',
        order: 0,
        plannedSets: 2,
        plannedRepsMin: 5,
        plannedRepsMax: 8,
        plannedWeightKg: 0,
      },
    ]);

    const result = validateWorkoutPerformance(context, [
      {
        sets: [
          { weightKg: 0, reps: 8 },
          { weightKg: 0, reps: 7 },
        ],
      },
    ]);

    expect(result.ok).toBe(true);
  });

  it('normalizes negative zero to zero', () => {
    const result = validateWorkoutPerformance(
      makeContext([
        {
          nameSnapshot: 'Pull-up',
          order: 0,
          plannedSets: 1,
          plannedRepsMin: 5,
          plannedRepsMax: 8,
          plannedWeightKg: 0,
        },
      ]),
      [{ sets: [{ weightKg: -0, reps: 7 }] }],
    );

    expect(result).toEqual({
      ok: true,
      value: [
        { order: 0, sets: [{ setNumber: 1, weightKg: 0, reps: 7 }] },
      ],
    });
  });

  it.each([undefined, null, '', -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid actual weight %p',
    (weightKg) => {
      const result = validateWorkoutPerformance(
        makeContext([
          {
            nameSnapshot: 'Back Squat',
            order: 0,
            plannedSets: 1,
            plannedRepsMin: 6,
            plannedRepsMax: 8,
            plannedWeightKg: 75,
          },
        ]),
        [{ sets: [{ weightKg, reps: 8 }] }],
      );

      expect(result).toEqual({
        ok: false,
        errors: [
          {
            field: 'exercises[0].sets[0].weightKg',
            code: 'workout.set.weight.invalid',
            message: 'El peso debe ser un número mayor o igual que cero.',
          },
        ],
      });
    },
  );

  it.each([undefined, null, '', 0, -1, 1.5, '8'])(
    'rejects invalid actual repetitions %p',
    (reps) => {
      const result = validateWorkoutPerformance(
        makeContext([
          {
            nameSnapshot: 'Back Squat',
            order: 0,
            plannedSets: 1,
            plannedRepsMin: 6,
            plannedRepsMax: 8,
            plannedWeightKg: 75,
          },
        ]),
        [{ sets: [{ weightKg: 75, reps }] }],
      );

      expect(result).toEqual({
        ok: false,
        errors: [
          {
            field: 'exercises[0].sets[0].reps',
            code: 'workout.set.reps.invalid',
            message:
              'Las repeticiones deben ser un número entero mayor que cero.',
          },
        ],
      });
    },
  );

  it('rejects a missing set', () => {
    const result = validateWorkoutPerformance(squatContext, [
      { sets: [{ weightKg: 75, reps: 8 }] },
      { sets: [{ weightKg: 0, reps: 12 }] },
    ]);

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'exercises[0].sets',
          code: 'workout.sets.countMismatch',
          message:
            'Debes registrar exactamente una serie por cada serie planificada.',
        },
      ],
    });
  });

  it('rejects an extra set', () => {
    const result = validateWorkoutPerformance(
      makeContext([
        {
          nameSnapshot: 'Back Squat',
          order: 0,
          plannedSets: 1,
          plannedRepsMin: 6,
          plannedRepsMax: 8,
          plannedWeightKg: 75,
        },
      ]),
      [
        {
          sets: [
            { weightKg: 75, reps: 8 },
            { weightKg: 75, reps: 8 },
          ],
        },
      ],
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toEqual([
      expect.objectContaining({
        field: 'exercises[0].sets',
        code: 'workout.sets.countMismatch',
      }),
    ]);
  });

  it('rejects a missing or extra exercise', () => {
    const missing = validateWorkoutPerformance(squatContext, [
      { sets: [{ weightKg: 75, reps: 8 }] },
    ]);
    const extra = validateWorkoutPerformance(squatContext, [
      { sets: [{ weightKg: 75, reps: 8 }] },
      { sets: [{ weightKg: 0, reps: 12 }] },
      { sets: [{ weightKg: 0, reps: 12 }] },
    ]);

    expect(missing.ok).toBe(false);
    expect(!missing.ok && missing.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'exercises',
          code: 'workout.exercises.countMismatch',
        }),
      ]),
    );
    expect(extra.ok).toBe(false);
    expect(!extra.ok && extra.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'exercises',
          code: 'workout.exercises.countMismatch',
        }),
      ]),
    );
  });

  it('requires every configured entry when two exercises share a name', () => {
    const context = makeContext([
      {
        nameSnapshot: 'Back Squat',
        order: 0,
        plannedSets: 1,
        plannedRepsMin: 6,
        plannedRepsMax: 8,
        plannedWeightKg: 75,
      },
      {
        nameSnapshot: 'Back Squat',
        order: 1,
        plannedSets: 1,
        plannedRepsMin: 6,
        plannedRepsMax: 8,
        plannedWeightKg: 70,
      },
    ]);

    const incomplete = validateWorkoutPerformance(context, [
      { sets: [{ weightKg: 75, reps: 8 }] },
    ]);
    const complete = validateWorkoutPerformance(context, [
      { sets: [{ weightKg: 75, reps: 8 }] },
      { sets: [{ weightKg: 70, reps: 8 }] },
    ]);

    expect(incomplete.ok).toBe(false);
    expect(complete.ok).toBe(true);
  });

  it('rejects a non-list actual performance value', () => {
    const result = validateWorkoutPerformance(squatContext, null);

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'exercises',
          code: 'workout.exercises.invalid',
          message: 'El registro debe contener los ejercicios planificados.',
        },
      ],
    });
  });

  it('rejects malformed exercise and set entries', () => {
    const result = validateWorkoutPerformance(squatContext, [
      null,
      { sets: 'not-a-list' },
    ]);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toEqual([
      {
        field: 'exercises[0]',
        code: 'workout.exercise.invalid',
        message: 'El ejercicio debe ser un objeto.',
      },
      {
        field: 'exercises[1].sets',
        code: 'workout.sets.invalid',
        message: 'Las series deben ser una lista.',
      },
    ]);
  });

  it('rejects a malformed set entry', () => {
    const result = validateWorkoutPerformance(
      makeContext([
        {
          nameSnapshot: 'Back Squat',
          order: 0,
          plannedSets: 1,
          plannedRepsMin: 6,
          plannedRepsMax: 8,
          plannedWeightKg: 75,
        },
      ]),
      [{ sets: [42] }],
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toEqual([
      {
        field: 'exercises[0].sets[0]',
        code: 'workout.set.invalid',
        message: 'La serie debe ser un objeto.',
      },
    ]);
  });

  it('returns every invalid set field in the same result', () => {
    const result = validateWorkoutPerformance(
      makeContext([
        {
          nameSnapshot: 'Back Squat',
          order: 0,
          plannedSets: 1,
          plannedRepsMin: 6,
          plannedRepsMax: 8,
          plannedWeightKg: 75,
        },
      ]),
      [{ sets: [{ weightKg: -5, reps: 0 }] }],
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.map((error) => error.field)).toEqual([
      'exercises[0].sets[0].weightKg',
      'exercises[0].sets[0].reps',
    ]);
  });
});

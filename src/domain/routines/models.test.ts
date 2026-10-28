import { describe, expect, it } from '@jest/globals';

import type { IsoWeekday, Routine, RoutineAssignment, RoutineExercise } from './models';

describe('routines domain models', () => {
  it('represents a routine with ordered exercise entries and recurring weekdays', () => {
    const exercises: RoutineExercise[] = [
      {
        id: 'exercise-1',
        routineId: 'routine-1',
        name: 'Back Squat',
        order: 0,
        targetSets: 4,
        targetRepsMin: 6,
        targetRepsMax: 8,
        targetWeightKg: 75,
      },
      {
        id: 'exercise-2',
        routineId: 'routine-1',
        name: 'Bench Press',
        order: 1,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 10,
        targetWeightKg: 0,
        notes: 'Pause at the bottom',
      },
    ];
    const weekdays: IsoWeekday[] = [1, 3];

    const routine: Routine = {
      id: 'routine-1',
      name: 'Lower A',
      weekdays,
      exercises,
      createdAt: '2026-10-18T08:00:00.000Z',
      updatedAt: '2026-10-18T08:00:00.000Z',
    };

    expect(routine.exercises.map((exercise) => exercise.order)).toEqual([0, 1]);
    expect(routine.exercises[1].targetWeightKg).toBe(0);
    expect(routine.weekdays).toEqual([1, 3]);
  });

  it('represents a one-time assignment to a calendar date', () => {
    const assignment: RoutineAssignment = {
      id: 'assignment-1',
      routineId: 'routine-1',
      date: '2026-10-24',
    };

    expect(assignment.date).toBe('2026-10-24');
  });
});

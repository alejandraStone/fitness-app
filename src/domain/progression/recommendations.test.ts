import { describe, expect, it } from '@jest/globals';

import type { Routine, RoutineExercise } from '../routines';
import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../workouts';
import {
  findPendingRecommendations,
  isQualifyingExercise,
  selectLatestExerciseSessions,
} from './recommendations';

function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'set-1',
    setNumber: 1,
    weightKg: 50,
    reps: 8,
    ...overrides,
  };
}

function createExercise(
  overrides: Partial<WorkoutExercise> = {},
): WorkoutExercise {
  return {
    id: 'workout-exercise-1',
    nameSnapshot: 'Sentadilla',
    order: 0,
    plannedSets: 3,
    plannedRepsMin: 6,
    plannedRepsMax: 8,
    plannedWeightKg: 50,
    sets: [
      createSet({ id: 'set-1', setNumber: 1, reps: 8 }),
      createSet({ id: 'set-2', setNumber: 2, reps: 8 }),
      createSet({ id: 'set-3', setNumber: 3, reps: 8 }),
    ],
    ...overrides,
  };
}

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    routineId: 'routine-1',
    date: '2026-11-10',
    routineNameSnapshot: 'Pierna A',
    savedAt: '2026-11-10T18:00:00.000Z',
    exercises: [createExercise()],
    ...overrides,
  };
}

function createRoutineExercise(
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id: 'routine-exercise-1',
    routineId: 'routine-1',
    name: 'Sentadilla',
    order: 0,
    targetSets: 3,
    targetRepsMin: 6,
    targetRepsMax: 8,
    targetWeightKg: 50,
    ...overrides,
  };
}

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Pierna A',
    weekdays: [1],
    exercises: [createRoutineExercise()],
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
    ...overrides,
  };
}

function pending(
  workout: Workout,
  workouts: Workout[],
  routine: Routine | null = createRoutine(),
  keepWeightDecisionIds: ReadonlySet<string> = new Set(),
) {
  return findPendingRecommendations({
    workout,
    workouts,
    routine,
    keepWeightDecisionIds,
  });
}

describe('isQualifyingExercise', () => {
  it('qualifies when every set reaches or exceeds the planned maximum', () => {
    expect(isQualifyingExercise(createExercise())).toBe(true);
    expect(
      isQualifyingExercise(
        createExercise({
          sets: [
            createSet({ id: 'set-1', setNumber: 1, reps: 8 }),
            createSet({ id: 'set-2', setNumber: 2, reps: 9 }),
            createSet({ id: 'set-3', setNumber: 3, reps: 10 }),
          ],
        }),
      ),
    ).toBe(true);
  });

  it('rejects a set below the planned maximum', () => {
    expect(
      isQualifyingExercise(
        createExercise({
          sets: [
            createSet({ id: 'set-1', setNumber: 1, reps: 8 }),
            createSet({ id: 'set-2', setNumber: 2, reps: 7 }),
            createSet({ id: 'set-3', setNumber: 3, reps: 8 }),
          ],
        }),
      ),
    ).toBe(false);
  });

  it('rejects a set-count mismatch', () => {
    expect(
      isQualifyingExercise(
        createExercise({
          sets: [
            createSet({ id: 'set-1', setNumber: 1, reps: 8 }),
            createSet({ id: 'set-2', setNumber: 2, reps: 8 }),
          ],
        }),
      ),
    ).toBe(false);
  });

  it('rejects exercises without planned external weight', () => {
    expect(
      isQualifyingExercise(createExercise({ plannedWeightKg: 0 })),
    ).toBe(false);
  });
});

describe('selectLatestExerciseSessions', () => {
  it('selects the latest workout per normalized exercise name', () => {
    const older = createWorkout({
      id: 'workout-older',
      date: '2026-11-08',
      savedAt: '2026-11-08T18:00:00.000Z',
    });
    const newer = createWorkout({
      id: 'workout-newer',
      date: '2026-11-10',
      savedAt: '2026-11-10T18:00:00.000Z',
    });

    const sessions = selectLatestExerciseSessions([older, newer]);

    expect(sessions.get('sentadilla')?.workout.id).toBe('workout-newer');
  });

  it('uses the save timestamp and ascending identifier for same-date workouts', () => {
    const earlierSave = createWorkout({
      id: 'workout-a',
      date: '2026-11-10',
      savedAt: '2026-11-10T18:00:00.000Z',
    });
    const laterSave = createWorkout({
      id: 'workout-b',
      date: '2026-11-10',
      savedAt: '2026-11-10T19:00:00.000Z',
    });
    const higherId = createWorkout({
      id: 'workout-c',
      date: '2026-11-10',
      savedAt: '2026-11-10T19:00:00.000Z',
    });
    const lowerId = createWorkout({
      id: 'workout-0',
      date: '2026-11-10',
      savedAt: '2026-11-10T19:00:00.000Z',
    });

    expect(
      selectLatestExerciseSessions([earlierSave, laterSave]).get('sentadilla')
        ?.workout.id,
    ).toBe('workout-b');
    expect(
      selectLatestExerciseSessions([higherId, lowerId]).get('sentadilla')
        ?.workout.id,
    ).toBe('workout-0');
  });

  it('uses the lowest order and then the lowest identifier for duplicate names', () => {
    const workout = createWorkout({
      exercises: [
        createExercise({
          id: 'workout-exercise-z',
          order: 1,
          sets: [
            createSet({ id: 'set-1', setNumber: 1, reps: 8 }),
            createSet({ id: 'set-2', setNumber: 2, reps: 8 }),
            createSet({ id: 'set-3', setNumber: 3, reps: 8 }),
          ],
        }),
        createExercise({
          id: 'workout-exercise-a',
          order: 1,
        }),
      ],
    });

    expect(
      selectLatestExerciseSessions([workout]).get('sentadilla')?.exercise.id,
    ).toBe('workout-exercise-a');
  });
});

describe('findPendingRecommendations', () => {
  it('returns ordered repetitions for a qualifying latest session', () => {
    const workout = createWorkout({
      exercises: [
        createExercise({
          sets: [
            createSet({ id: 'set-3', setNumber: 3, reps: 10 }),
            createSet({ id: 'set-1', setNumber: 1, reps: 8 }),
            createSet({ id: 'set-2', setNumber: 2, reps: 9 }),
          ],
        }),
      ],
    });

    expect(pending(workout, [workout])).toEqual([
      {
        workoutExerciseId: 'workout-exercise-1',
        exerciseName: 'Sentadilla',
        repetitions: [8, 9, 10],
        plannedRepsMax: 8,
      },
    ]);
  });

  it('hides an older recommendation when a newer session exists', () => {
    const older = createWorkout({
      id: 'workout-older',
      date: '2026-11-08',
      savedAt: '2026-11-08T18:00:00.000Z',
    });
    const newer = createWorkout({
      id: 'workout-newer',
      date: '2026-11-10',
      savedAt: '2026-11-10T18:00:00.000Z',
      exercises: [
        createExercise({
          id: 'workout-exercise-newer',
          sets: [
            createSet({ id: 'set-1', setNumber: 1, reps: 8 }),
            createSet({ id: 'set-2', setNumber: 2, reps: 7 }),
            createSet({ id: 'set-3', setNumber: 3, reps: 8 }),
          ],
        }),
      ],
    });

    expect(pending(older, [older, newer])).toEqual([]);
    expect(pending(newer, [older, newer])).toEqual([]);
  });

  it('shows a recommendation only for the workout selected by the latest-session rule', () => {
    const current = createWorkout({
      id: 'workout-current',
      date: '2026-11-10',
      savedAt: '2026-11-10T18:00:00.000Z',
    });
    const older = createWorkout({
      id: 'workout-older',
      date: '2026-11-08',
      savedAt: '2026-11-08T18:00:00.000Z',
    });

    expect(pending(current, [current, older])).toHaveLength(1);
    expect(pending(older, [current, older])).toEqual([]);
  });

  it('does not evaluate a duplicate exercise name with a higher order', () => {
    const duplicate = createExercise({
      id: 'workout-exercise-duplicate',
      order: 1,
      sets: [
        createSet({ id: 'duplicate-set-1', setNumber: 1, reps: 8 }),
        createSet({ id: 'duplicate-set-2', setNumber: 2, reps: 8 }),
        createSet({ id: 'duplicate-set-3', setNumber: 3, reps: 8 }),
      ],
    });
    const qualifyingLower = createExercise();
    const workout = createWorkout({
      exercises: [qualifyingLower, duplicate],
    });

    expect(pending(workout, [workout])).toHaveLength(1);
    expect(pending(workout, [workout])[0].workoutExerciseId).toBe(
      qualifyingLower.id,
    );

    const nonQualifyingLower = createExercise({
      sets: [
        createSet({ id: 'lower-set-1', setNumber: 1, reps: 7 }),
        createSet({ id: 'lower-set-2', setNumber: 2, reps: 8 }),
        createSet({ id: 'lower-set-3', setNumber: 3, reps: 8 }),
      ],
    });
    const duplicateWorkout = createWorkout({
      exercises: [nonQualifyingLower, duplicate],
    });

    expect(pending(duplicateWorkout, [duplicateWorkout])).toEqual([]);
  });

  it('normalizes trim, case and Unicode composition for routine matching', () => {
    const workout = createWorkout({
      exercises: [
        createExercise({
          nameSnapshot: '  CAFÉ ',
        }),
      ],
    });
    const routine = createRoutine({
      exercises: [createRoutineExercise({ name: 'Cafe\u0301' })],
    });

    expect(pending(workout, [workout], routine)).toHaveLength(1);
  });

  it('hides recommendations when the source routine no longer exists', () => {
    const workout = createWorkout();

    expect(pending(workout, [workout], null)).toEqual([]);
  });

  it('hides recommendations when the routine has no unique matching exercise', () => {
    const workout = createWorkout();
    const noMatch = createRoutine({
      exercises: [createRoutineExercise({ name: 'Prensa' })],
    });
    const duplicateMatch = createRoutine({
      exercises: [
        createRoutineExercise(),
        createRoutineExercise({ id: 'routine-exercise-2', order: 1 }),
      ],
    });

    expect(pending(workout, [workout], noMatch)).toEqual([]);
    expect(pending(workout, [workout], duplicateMatch)).toEqual([]);
  });

  it('hides recommendations when the current planned weight differs', () => {
    const workout = createWorkout();
    const changed = createRoutine({
      exercises: [createRoutineExercise({ targetWeightKg: 55 })],
    });
    const restored = createRoutine({
      exercises: [createRoutineExercise({ targetWeightKg: 50 })],
    });

    expect(pending(workout, [workout], changed)).toEqual([]);
    expect(pending(workout, [workout], restored)).toHaveLength(1);
  });

  it('suppresses only the exercise with a keep-weight decision', () => {
    const workout = createWorkout({
      exercises: [
        createExercise(),
        createExercise({
          id: 'workout-exercise-2',
          nameSnapshot: 'Prensa',
          order: 1,
          plannedWeightKg: 80,
          sets: [
            createSet({ id: 'press-set-1', setNumber: 1, reps: 10 }),
            createSet({ id: 'press-set-2', setNumber: 2, reps: 10 }),
            createSet({ id: 'press-set-3', setNumber: 3, reps: 10 }),
          ],
        }),
      ],
    });
    const routine = createRoutine({
      exercises: [
        createRoutineExercise(),
        createRoutineExercise({
          id: 'routine-exercise-2',
          name: 'Prensa',
          order: 1,
          targetWeightKg: 80,
        }),
      ],
    });

    expect(
      pending(workout, [workout], routine, new Set(['workout-exercise-1'])),
    ).toEqual([
      {
        workoutExerciseId: 'workout-exercise-2',
        exerciseName: 'Prensa',
        repetitions: [10, 10, 10],
        plannedRepsMax: 8,
      },
    ]);
  });

  it('does not let an older decision suppress a newer workout', () => {
    const older = createWorkout({
      id: 'workout-older',
      date: '2026-11-08',
      savedAt: '2026-11-08T18:00:00.000Z',
    });
    const newer = createWorkout({
      id: 'workout-newer',
      date: '2026-11-10',
      savedAt: '2026-11-10T18:00:00.000Z',
      exercises: [
        createExercise({
          id: 'workout-exercise-newer',
        }),
      ],
    });

    expect(
      pending(newer, [older, newer], createRoutine(), new Set(['workout-exercise-1'])),
    ).toHaveLength(1);
  });
});

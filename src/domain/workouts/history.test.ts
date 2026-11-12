import { describe, expect, it } from '@jest/globals';

import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutSetPerformance,
} from './models';
import {
  findPreviousExercisePerformance,
  normalizeExerciseName,
  summarizeWorkout,
} from './history';

function makeSet(
  setNumber: number,
  weightKg: number,
  reps: number,
): WorkoutSet {
  return { id: `set-${setNumber}`, setNumber, weightKg, reps };
}

function makeExercise(
  nameSnapshot: string,
  order: number,
  sets: WorkoutSet[],
  overrides: Partial<WorkoutExercise> = {},
): WorkoutExercise {
  return {
    id: `exercise-${order}`,
    nameSnapshot,
    order,
    plannedSets: sets.length,
    plannedRepsMin: 6,
    plannedRepsMax: 10,
    plannedWeightKg: 0,
    sets,
    ...overrides,
  };
}

function makeWorkout(
  id: string,
  date: string,
  savedAt: string,
  exercises: WorkoutExercise[],
): Workout {
  return {
    id,
    routineId: `routine-${id}`,
    date,
    routineNameSnapshot: 'Lower A',
    savedAt,
    exercises,
  };
}

function performance(reps: number[]): WorkoutSetPerformance[] {
  return reps.map((value, index) => ({
    setNumber: index + 1,
    weightKg: 75,
    reps: value,
  }));
}

describe('normalizeExerciseName', () => {
  it('trims surrounding whitespace and ignores letter case', () => {
    expect(normalizeExerciseName('  Back Squat  ')).toBe('back squat');
    expect(normalizeExerciseName('BACK SQUAT')).toBe('back squat');
  });

  it('normalizes Unicode composition', () => {
    expect(normalizeExerciseName('Cafe\u0301')).toBe(
      normalizeExerciseName('Café'),
    );
  });
});

describe('findPreviousExercisePerformance', () => {
  it('returns null when no earlier workout contains the exercise', () => {
    const workouts = [
      makeWorkout(
        'same-date',
        '2026-11-02',
        '2026-11-02T10:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 8)])],
      ),
      makeWorkout(
        'future',
        '2026-11-03',
        '2026-11-03T10:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 80, 6)])],
      ),
    ];

    expect(
      findPreviousExercisePerformance(workouts, {
        exerciseName: 'Back Squat',
        selectedDate: '2026-11-02',
      }),
    ).toBeNull();
  });

  it('selects the latest workout date strictly before the selected date', () => {
    const workouts = [
      makeWorkout(
        'older',
        '2026-10-20',
        '2026-10-20T10:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 6)])],
      ),
      makeWorkout(
        'newer',
        '2026-11-01',
        '2026-11-01T10:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 8)])],
      ),
    ];

    const result = findPreviousExercisePerformance(workouts, {
      exerciseName: 'Back Squat',
      selectedDate: '2026-11-02',
    });

    expect(result).toEqual({
      workoutId: 'newer',
      date: '2026-11-01',
      sets: performance([8]),
    });
  });

  it('matches names across routines ignoring whitespace and case', () => {
    const workouts = [
      makeWorkout(
        'workout-1',
        '2026-11-01',
        '2026-11-01T10:00:00.000Z',
        [makeExercise('  bAcK sQuAt  ', 0, [makeSet(1, 75, 8)])],
      ),
    ];

    const result = findPreviousExercisePerformance(workouts, {
      exerciseName: 'Back Squat',
      selectedDate: '2026-11-02',
    });

    expect(result?.workoutId).toBe('workout-1');
  });

  it('uses the latest saved workout when dates are equal', () => {
    const workouts = [
      makeWorkout(
        'saved-first',
        '2026-11-01',
        '2026-11-01T10:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 8)])],
      ),
      makeWorkout(
        'saved-later',
        '2026-11-01',
        '2026-11-01T12:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 9)])],
      ),
    ];

    const result = findPreviousExercisePerformance(workouts, {
      exerciseName: 'Back Squat',
      selectedDate: '2026-11-02',
    });

    expect(result).toEqual({
      workoutId: 'saved-later',
      date: '2026-11-01',
      sets: performance([9]),
    });
  });

  it('breaks date and save-time ties deterministically by workout identifier', () => {
    const workouts = [
      makeWorkout(
        'workout-b',
        '2026-11-01',
        '2026-11-01T10:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 8)])],
      ),
      makeWorkout(
        'workout-a',
        '2026-11-01',
        '2026-11-01T10:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 9)])],
      ),
    ];

    const result = findPreviousExercisePerformance(workouts, {
      exerciseName: 'Back Squat',
      selectedDate: '2026-11-02',
    });

    expect(result?.workoutId).toBe('workout-a');
    expect(result?.sets.map((set) => set.reps)).toEqual([9]);
  });

  it('excludes the workout being edited', () => {
    const workouts = [
      makeWorkout(
        'current',
        '2026-11-01',
        '2026-11-01T12:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 9)])],
      ),
      makeWorkout(
        'other',
        '2026-11-01',
        '2026-11-01T10:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 8)])],
      ),
    ];

    const result = findPreviousExercisePerformance(workouts, {
      exerciseName: 'Back Squat',
      selectedDate: '2026-11-03',
      excludeWorkoutId: 'current',
    });

    expect(result?.workoutId).toBe('other');
  });

  it('uses the first display-order entry when a workout repeats an exercise name', () => {
    const workouts = [
      makeWorkout(
        'workout-1',
        '2026-11-01',
        '2026-11-01T10:00:00.000Z',
        [
          makeExercise('Back Squat', 1, [makeSet(1, 75, 12)]),
          makeExercise('Back Squat', 0, [makeSet(1, 75, 8)]),
        ],
      ),
    ];

    const result = findPreviousExercisePerformance(workouts, {
      exerciseName: 'Back Squat',
      selectedDate: '2026-11-02',
    });

    expect(result?.sets.map((set) => set.reps)).toEqual([8]);
  });

  it('returns null when the exercise has a different historical name', () => {
    const workouts = [
      makeWorkout(
        'workout-1',
        '2026-11-01',
        '2026-11-01T10:00:00.000Z',
        [makeExercise('Back Squat', 0, [makeSet(1, 75, 8)])],
      ),
    ];

    expect(
      findPreviousExercisePerformance(workouts, {
        exerciseName: 'Front Squat',
        selectedDate: '2026-11-02',
      }),
    ).toBeNull();
  });
});

describe('summarizeWorkout', () => {
  it('counts saved exercises, sets and repetitions', () => {
    const workout = makeWorkout(
      'workout-1',
      '2026-11-01',
      '2026-11-01T10:00:00.000Z',
      [
        makeExercise('Back Squat', 0, [
          makeSet(1, 75, 8),
          makeSet(2, 75, 7),
        ]),
        makeExercise('Leg Curl', 1, [makeSet(1, 30, 12)]),
      ],
    );

    expect(summarizeWorkout(workout)).toEqual({
      id: 'workout-1',
      routineId: 'routine-workout-1',
      date: '2026-11-01',
      routineNameSnapshot: 'Lower A',
      savedAt: '2026-11-01T10:00:00.000Z',
      exerciseCount: 2,
      totalSets: 3,
      totalReps: 27,
    });
  });

  it('returns zero totals for a workout with no exercises', () => {
    const workout = makeWorkout(
      'workout-1',
      '2026-11-01',
      '2026-11-01T10:00:00.000Z',
      [],
    );

    expect(summarizeWorkout(workout)).toMatchObject({
      exerciseCount: 0,
      totalSets: 0,
      totalReps: 0,
    });
  });
});

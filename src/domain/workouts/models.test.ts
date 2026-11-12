import { describe, expect, it } from '@jest/globals';

import type {
  PreviousExercisePerformance,
  Workout,
  WorkoutExercise,
  WorkoutRecordingContext,
  WorkoutSet,
  WorkoutSummary,
} from './models';

describe('workouts domain models', () => {
  const performedSets: WorkoutSet[] = [
    { id: 'set-1', setNumber: 1, weightKg: 75, reps: 8 },
    { id: 'set-2', setNumber: 2, weightKg: 75, reps: 7 },
  ];

  const exercise: WorkoutExercise = {
    id: 'workout-exercise-1',
    nameSnapshot: 'Back Squat',
    order: 0,
    plannedSets: 2,
    plannedRepsMin: 6,
    plannedRepsMax: 8,
    plannedWeightKg: 75,
    notesSnapshot: 'Pause at the bottom',
    sets: performedSets,
  };

  it('represents a saved workout with its historical snapshot and actual sets', () => {
    const workout: Workout = {
      id: 'workout-1',
      routineId: 'routine-1',
      date: '2026-11-01',
      routineNameSnapshot: 'Lower A',
      savedAt: '2026-11-01T18:30:00.000Z',
      exercises: [exercise],
    };

    expect(workout.exercises[0].nameSnapshot).toBe('Back Squat');
    expect(workout.exercises[0].plannedWeightKg).toBe(75);
    expect(workout.exercises[0].sets.map((set) => set.reps)).toEqual([8, 7]);
    expect(workout.date).toBe('2026-11-01');
  });

  it('represents the immutable snapshot captured while recording', () => {
    const context: WorkoutRecordingContext = {
      routineId: 'routine-1',
      date: '2026-11-02',
      routineNameSnapshot: 'Lower A',
      exercises: [
        {
          nameSnapshot: 'Back Squat',
          order: 0,
          plannedSets: 2,
          plannedRepsMin: 6,
          plannedRepsMax: 8,
          plannedWeightKg: 75,
          notesSnapshot: 'Pause at the bottom',
        },
      ],
    };

    expect(context.exercises[0].plannedSets).toBe(2);
    expect(context.exercises[0].nameSnapshot).toBe('Back Squat');
  });

  it('represents a lightweight summary for Home and history', () => {
    const summary: WorkoutSummary = {
      id: 'workout-1',
      routineId: 'routine-1',
      date: '2026-11-01',
      routineNameSnapshot: 'Lower A',
      savedAt: '2026-11-01T18:30:00.000Z',
      exerciseCount: 1,
      totalSets: 2,
      totalReps: 15,
    };

    expect(summary.exerciseCount).toBe(1);
    expect(summary.totalSets).toBe(2);
    expect(summary.totalReps).toBe(15);
  });

  it('represents a previous performance with its date and recorded sets', () => {
    const previous: PreviousExercisePerformance = {
      workoutId: 'workout-1',
      date: '2026-11-01',
      sets: [
        { setNumber: 1, weightKg: 75, reps: 8 },
        { setNumber: 2, weightKg: 75, reps: 7 },
      ],
    };

    expect(previous.date).toBe('2026-11-01');
    expect(previous.sets[1]).toEqual({
      setNumber: 2,
      weightKg: 75,
      reps: 7,
    });
  });
});

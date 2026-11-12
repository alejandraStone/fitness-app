/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { Workout } from '../../domain/workouts';
import type { SqliteDatabase } from '../database/sqlite-database';
import {
  createTestDatabasePath,
  openTestDatabase,
} from '../database/testing/test-database';
import { SqliteWorkoutRepository } from '../workouts/sqlite-workout-repository';
import { SqliteProgressionDecisionRepository } from './sqlite-progression-decision-repository';

const SAVED_AT = '2026-11-02T18:00:00.000Z';
const DECIDED_AT = '2026-11-03T18:00:00.000Z';

function createWorkout(
  id: string,
  exerciseIds: string[] = [`${id}-exercise-1`],
): Workout {
  return {
    id,
    routineId: `${id}-routine`,
    date: '2026-11-02',
    routineNameSnapshot: `Routine ${id}`,
    savedAt: SAVED_AT,
    exercises: exerciseIds.map((exerciseId, index) => ({
      id: exerciseId,
      nameSnapshot: `Exercise ${index + 1}`,
      order: index,
      plannedSets: 2,
      plannedRepsMin: 8,
      plannedRepsMax: 10,
      plannedWeightKg: 50,
      sets: [
        {
          id: `${exerciseId}-set-1`,
          setNumber: 1,
          weightKg: 50,
          reps: 8,
        },
        {
          id: `${exerciseId}-set-2`,
          setNumber: 2,
          weightKg: 50,
          reps: 8,
        },
      ],
    })),
  };
}

function cloneWorkout(workout: Workout): Workout {
  return JSON.parse(JSON.stringify(workout)) as Workout;
}

describe('SqliteProgressionDecisionRepository', () => {
  let database: SqliteDatabase;
  let workoutRepository: SqliteWorkoutRepository;
  let repository: SqliteProgressionDecisionRepository;

  beforeEach(async () => {
    database = await openTestDatabase();
    workoutRepository = new SqliteWorkoutRepository(database);
    repository = new SqliteProgressionDecisionRepository(database);
  });

  afterEach(async () => {
    await database.closeAsync();
  });

  it('reads only the decisions of the requested workout', async () => {
    const first = createWorkout('workout-first', [
      'workout-first-exercise-1',
      'workout-first-exercise-2',
    ]);
    const second = createWorkout('workout-second');
    await workoutRepository.create(first);
    await workoutRepository.create(second);
    await repository.saveKeepWeightDecision(
      'workout-first-exercise-2',
      DECIDED_AT,
    );
    await repository.saveKeepWeightDecision(
      'workout-first-exercise-1',
      DECIDED_AT,
    );
    await repository.saveKeepWeightDecision(
      'workout-second-exercise-1',
      DECIDED_AT,
    );

    await expect(
      repository.findKeepWeightDecisionIds(first.id),
    ).resolves.toEqual([
      'workout-first-exercise-1',
      'workout-first-exercise-2',
    ]);
    await expect(
      repository.findKeepWeightDecisionIds(second.id),
    ).resolves.toEqual(['workout-second-exercise-1']);
    await expect(
      repository.findKeepWeightDecisionIds('missing-workout'),
    ).resolves.toEqual([]);
  });

  it('does not duplicate or replace a repeated decision', async () => {
    const workout = createWorkout('workout-1');
    await workoutRepository.create(workout);

    await repository.saveKeepWeightDecision(
      'workout-1-exercise-1',
      DECIDED_AT,
    );
    await repository.saveKeepWeightDecision(
      'workout-1-exercise-1',
      '2026-11-04T09:00:00.000Z',
    );

    const rows = await database.getAllAsync<{
      workout_exercise_id: string;
      decided_at: string;
    }>(
      `SELECT workout_exercise_id, decided_at
       FROM progression_keep_weight_decisions`,
    );
    expect(rows).toEqual([
      {
        workout_exercise_id: 'workout-1-exercise-1',
        decided_at: DECIDED_AT,
      },
    ]);
  });

  it('keeps a decision when the workout actual sets are edited', async () => {
    const workout = createWorkout('workout-1');
    await workoutRepository.create(workout);
    await repository.saveKeepWeightDecision(
      'workout-1-exercise-1',
      DECIDED_AT,
    );

    const edited = cloneWorkout(workout);
    edited.exercises[0].sets[0] = {
      ...edited.exercises[0].sets[0],
      reps: 6,
    };
    await workoutRepository.updateActualSets(edited);

    await expect(
      repository.findKeepWeightDecisionIds(workout.id),
    ).resolves.toEqual(['workout-1-exercise-1']);
  });

  it('cascades decisions when the workout is deleted', async () => {
    const workout = createWorkout('workout-1');
    await workoutRepository.create(workout);
    await repository.saveKeepWeightDecision(
      'workout-1-exercise-1',
      DECIDED_AT,
    );

    await database.runAsync('DELETE FROM workouts WHERE id = ?', [workout.id]);

    await expect(
      repository.findKeepWeightDecisionIds(workout.id),
    ).resolves.toEqual([]);
    const rows = await database.getAllAsync<{ workout_exercise_id: string }>(
      'SELECT workout_exercise_id FROM progression_keep_weight_decisions',
    );
    expect(rows).toEqual([]);
  });

  it('persists decisions across a database close and reopen', async () => {
    const temporaryDatabase = createTestDatabasePath();
    let firstConnection: SqliteDatabase | null = null;
    let secondConnection: SqliteDatabase | null = null;

    try {
      firstConnection = await openTestDatabase(temporaryDatabase.path);
      const firstWorkoutRepository = new SqliteWorkoutRepository(
        firstConnection,
      );
      const firstRepository = new SqliteProgressionDecisionRepository(
        firstConnection,
      );
      const workout = createWorkout('workout-1');
      await firstWorkoutRepository.create(workout);
      await firstRepository.saveKeepWeightDecision(
        'workout-1-exercise-1',
        DECIDED_AT,
      );
      await firstConnection.closeAsync();
      firstConnection = null;

      secondConnection = await openTestDatabase(temporaryDatabase.path);
      const secondRepository = new SqliteProgressionDecisionRepository(
        secondConnection,
      );

      await expect(
        secondRepository.findKeepWeightDecisionIds(workout.id),
      ).resolves.toEqual(['workout-1-exercise-1']);
    } finally {
      if (firstConnection !== null) {
        await firstConnection.closeAsync();
      }
      if (secondConnection !== null) {
        await secondConnection.closeAsync();
      }
      temporaryDatabase.cleanup();
    }
  });
});

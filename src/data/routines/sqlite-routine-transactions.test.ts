/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { Routine, RoutineExercise } from '../../domain/routines';
import type { SqliteDatabase } from '../database/sqlite-database';
import { openTestDatabase } from '../database/testing/test-database';
import { SqliteRoutineRepository } from './sqlite-routine-repository';
import { SqliteSchedulingRepository } from './sqlite-scheduling-repository';

const CREATED = '2026-10-18T08:00:00.000Z';
const UPDATED = '2026-10-19T12:00:00.000Z';

function createExercise(
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id: 'exercise-1',
    routineId: 'routine-1',
    name: 'Back Squat',
    order: 0,
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 10,
    targetWeightKg: 50,
    ...overrides,
  };
}

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [1, 3],
    exercises: [createExercise()],
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  };
}

function createIdGenerator(prefix = 'schedule'): () => string {
  let nextId = 0;
  return () => `${prefix}-${++nextId}`;
}

describe('routine write transactions', () => {
  let database: SqliteDatabase;
  let repository: SqliteRoutineRepository;
  let schedulingRepository: SqliteSchedulingRepository;

  beforeEach(async () => {
    database = await openTestDatabase();
    repository = new SqliteRoutineRepository({
      database,
      generateId: createIdGenerator(),
    });
    schedulingRepository = new SqliteSchedulingRepository(database);
  });

  afterEach(async () => {
    await database.closeAsync();
  });

  it('rolls back a routine creation when an exercise cannot be saved', async () => {
    const invalidRoutine = createRoutine({
      id: 'broken-routine',
      exercises: [
        createExercise({
          id: 'broken-exercise',
          routineId: 'broken-routine',
          targetSets: 0,
        }),
      ],
    });

    await expect(repository.create(invalidRoutine)).rejects.toThrow(
      /CHECK constraint failed/,
    );

    const routineCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM routines',
    );
    const exerciseCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM routine_exercises',
    );
    const scheduleCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM routine_schedules',
    );

    expect(routineCount?.count).toBe(0);
    expect(exerciseCount?.count).toBe(0);
    expect(scheduleCount?.count).toBe(0);
  });

  it('rolls back all routine changes when an exercise update fails', async () => {
    const original = createRoutine({
      exercises: [
        createExercise({ id: 'exercise-1' }),
        createExercise({
          id: 'exercise-2',
          name: 'Leg Press',
          order: 1,
          targetWeightKg: 120,
        }),
      ],
    });
    await repository.create(original);

    const schedulesBefore = await database.getAllAsync<{
      id: string;
      day_of_week: number;
    }>(
      `SELECT id, day_of_week FROM routine_schedules
       WHERE routine_id = ? ORDER BY day_of_week ASC`,
      [original.id],
    );

    const invalidUpdate = createRoutine({
      name: 'Broken update',
      weekdays: [2],
      exercises: [
        createExercise({ id: 'exercise-1', order: 0 }),
        createExercise({ id: 'exercise-3', order: 0 }),
      ],
      updatedAt: UPDATED,
    });

    await expect(repository.update(invalidUpdate)).rejects.toThrow(
      /UNIQUE constraint failed/,
    );

    await expect(repository.findById(original.id)).resolves.toEqual(original);

    const schedulesAfter = await database.getAllAsync<{
      id: string;
      day_of_week: number;
    }>(
      `SELECT id, day_of_week FROM routine_schedules
       WHERE routine_id = ? ORDER BY day_of_week ASC`,
      [original.id],
    );
    expect(schedulesAfter).toEqual(schedulesBefore);
  });

  it('deletes scheduling assignments with their routine but leaves other routines intact', async () => {
    const target = createRoutine({
      exercises: [
        createExercise({ id: 'exercise-1' }),
        createExercise({
          id: 'exercise-2',
          name: 'Leg Press',
          order: 1,
          targetWeightKg: 120,
        }),
      ],
    });
    const other = createRoutine({
      id: 'routine-2',
      name: 'Upper A',
      weekdays: [2],
      exercises: [
        createExercise({
          id: 'exercise-3',
          routineId: 'routine-2',
          name: 'Bench Press',
        }),
      ],
    });
    await repository.create(target);
    await repository.create(other);
    await schedulingRepository.createAssignment({
      id: 'assignment-target',
      routineId: target.id,
      date: '2026-10-19',
    });
    await schedulingRepository.createAssignment({
      id: 'assignment-other',
      routineId: other.id,
      date: '2026-10-19',
    });

    await expect(repository.delete(target.id)).resolves.toBe(true);

    await expect(
      schedulingRepository.findAssignment(target.id, '2026-10-19'),
    ).resolves.toBeNull();
    await expect(
      schedulingRepository.findAssignment(other.id, '2026-10-19'),
    ).resolves.toEqual({
      id: 'assignment-other',
      routineId: other.id,
      date: '2026-10-19',
    });

    const targetExerciseCount = await database.getFirstAsync<{
      count: number;
    }>(
      'SELECT COUNT(*) AS count FROM routine_exercises WHERE routine_id = ?',
      [target.id],
    );
    const targetScheduleCount = await database.getFirstAsync<{
      count: number;
    }>(
      'SELECT COUNT(*) AS count FROM routine_schedules WHERE routine_id = ?',
      [target.id],
    );
    expect(targetExerciseCount?.count).toBe(0);
    expect(targetScheduleCount?.count).toBe(0);
  });
});

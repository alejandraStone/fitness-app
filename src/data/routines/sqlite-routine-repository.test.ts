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

describe('SqliteRoutineRepository', () => {
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

  it('creates a routine and reads it back with ordered exercises', async () => {
    const routine = createRoutine({
      exercises: [
        createExercise({
          id: 'exercise-2',
          name: 'Leg Press',
          order: 1,
          targetWeightKg: 120,
        }),
        createExercise({
          id: 'exercise-1',
          notes: 'Brace before descending.',
        }),
      ],
    });

    await repository.create(routine);

    const expected = createRoutine({
      exercises: [
        createExercise({
          id: 'exercise-1',
          notes: 'Brace before descending.',
        }),
        createExercise({
          id: 'exercise-2',
          name: 'Leg Press',
          order: 1,
          targetWeightKg: 120,
        }),
      ],
    });
    await expect(repository.findById(routine.id)).resolves.toEqual(expected);
  });

  it('creates a date assignment atomically with the routine', async () => {
    const routine = createRoutine();
    const assignment = {
      id: 'assignment-1',
      routineId: routine.id,
      date: '2026-10-19',
    };

    await repository.create(routine, { dateAssignment: assignment });

    await expect(repository.findById(routine.id)).resolves.toEqual(routine);
    await expect(
      schedulingRepository.findAssignment(routine.id, assignment.date),
    ).resolves.toEqual(assignment);
  });

  it('rolls back routine creation when the date assignment fails', async () => {
    const existing = createRoutine({
      id: 'routine-existing',
      exercises: [
        createExercise({ id: 'exercise-existing', routineId: 'routine-existing' }),
      ],
    });
    await repository.create(existing);
    await schedulingRepository.createAssignment({
      id: 'assignment-conflict',
      routineId: existing.id,
      date: '2026-10-18',
    });

    const routine = createRoutine({ id: 'routine-new' });
    await expect(
      repository.create(routine, {
        dateAssignment: {
          id: 'assignment-conflict',
          routineId: routine.id,
          date: '2026-10-19',
        },
      }),
    ).rejects.toThrow();

    await expect(repository.findById('routine-new')).resolves.toBeNull();
    await expect(
      schedulingRepository.findAssignment(existing.id, '2026-10-18'),
    ).resolves.toEqual({
      id: 'assignment-conflict',
      routineId: existing.id,
      date: '2026-10-18',
    });
  });

  it('returns an empty list and null for missing routines', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('lists all routines in creation order', async () => {
    const first = createRoutine({
      id: 'routine-1',
      createdAt: CREATED,
      updatedAt: CREATED,
      exercises: [createExercise({ id: 'exercise-1' })],
    });
    const second = createRoutine({
      id: 'routine-2',
      name: 'Upper A',
      weekdays: [2],
      createdAt: UPDATED,
      updatedAt: UPDATED,
      exercises: [
        createExercise({
          id: 'exercise-2',
          routineId: 'routine-2',
          name: 'Bench Press',
        }),
      ],
    });

    await repository.create(second);
    await repository.create(first);

    const routines = await repository.findAll();
    expect(routines.map((routine) => routine.id)).toEqual([
      'routine-1',
      'routine-2',
    ]);
    expect(routines).toEqual([first, second]);
  });

  it('updates routine details, exercises and weekdays', async () => {
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
    await schedulingRepository.createAssignment({
      id: 'assignment-1',
      routineId: original.id,
      date: '2026-10-19',
    });

    const scheduleIdsBefore = await database.getAllAsync<{
      id: string;
      day_of_week: number;
    }>(
      `SELECT id, day_of_week FROM routine_schedules
       WHERE routine_id = ? ORDER BY day_of_week ASC`,
      [original.id],
    );

    const updated = createRoutine({
      name: 'Lower B',
      weekdays: [2, 3],
      exercises: [
        createExercise({
          id: 'exercise-1',
          name: 'Front Squat',
          targetSets: 4,
          notes: 'Front rack grip.',
        }),
        createExercise({
          id: 'exercise-3',
          name: 'Leg Curl',
          order: 1,
          targetWeightKg: 35,
        }),
      ],
      updatedAt: UPDATED,
    });

    await repository.update(updated);

    await expect(repository.findById(original.id)).resolves.toEqual(updated);
    await expect(
      schedulingRepository.findAssignment(original.id, '2026-10-19'),
    ).resolves.toEqual({
      id: 'assignment-1',
      routineId: original.id,
      date: '2026-10-19',
    });

    const scheduleIdsAfter = await database.getAllAsync<{
      id: string;
      day_of_week: number;
    }>(
      `SELECT id, day_of_week FROM routine_schedules
       WHERE routine_id = ? ORDER BY day_of_week ASC`,
      [original.id],
    );
    expect(scheduleIdsAfter.map((schedule) => schedule.day_of_week)).toEqual([
      2, 3,
    ]);
    expect(
      scheduleIdsAfter.find((schedule) => schedule.day_of_week === 3)?.id,
    ).toBe(
      scheduleIdsBefore.find((schedule) => schedule.day_of_week === 3)?.id,
    );
  });

  it('rejects updates for a routine that does not exist', async () => {
    await expect(
      repository.update(createRoutine({ id: 'missing' })),
    ).rejects.toThrow('was not found');
  });

  it('deletes a routine and cascades its exercises and assignments', async () => {
    const routine = createRoutine({
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
    const otherRoutine = createRoutine({
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
    await repository.create(routine);
    await repository.create(otherRoutine);
    await schedulingRepository.createAssignment({
      id: 'assignment-1',
      routineId: routine.id,
      date: '2026-10-19',
    });
    await schedulingRepository.createAssignment({
      id: 'assignment-2',
      routineId: otherRoutine.id,
      date: '2026-10-19',
    });

    await expect(repository.delete(routine.id)).resolves.toBe(true);

    await expect(repository.findById(routine.id)).resolves.toBeNull();
    await expect(repository.findById(otherRoutine.id)).resolves.toEqual(
      otherRoutine,
    );

    const remainingAssignments = await database.getAllAsync<{ id: string }>(
      'SELECT id FROM routine_assignments ORDER BY id ASC',
    );
    expect(remainingAssignments.map((assignment) => assignment.id)).toEqual([
      'assignment-2',
    ]);

    const remainingExercises = await database.getAllAsync<{ id: string }>(
      'SELECT id FROM routine_exercises WHERE routine_id = ?',
      [routine.id],
    );
    expect(remainingExercises).toEqual([]);

    const remainingSchedules = await database.getAllAsync<{ id: string }>(
      'SELECT id FROM routine_schedules WHERE routine_id = ?',
      [routine.id],
    );
    expect(remainingSchedules).toEqual([]);

    await expect(repository.delete(routine.id)).resolves.toBe(false);
  });
});

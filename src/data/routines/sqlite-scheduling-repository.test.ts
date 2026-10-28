/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { Routine, RoutineExercise } from '../../domain/routines';
import type { SqliteDatabase } from '../database/sqlite-database';
import {
  createTestDatabasePath,
  openTestDatabase,
} from '../database/testing/test-database';
import { SqliteRoutineRepository } from './sqlite-routine-repository';
import { SqliteSchedulingRepository } from './sqlite-scheduling-repository';

const CREATED = '2026-10-18T08:00:00.000Z';

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

async function seedRoutine(
  repository: SqliteRoutineRepository,
  id: string,
  weekdays: Routine['weekdays'],
): Promise<Routine> {
  const routine = createRoutine({
    id,
    name: `Routine ${id}`,
    weekdays,
    exercises: [
      createExercise({
        id: `exercise-${id}`,
        routineId: id,
      }),
    ],
  });
  await repository.create(routine);
  return routine;
}

function createIdGenerator(prefix: string): () => string {
  let nextId = 0;
  return () => `${prefix}-${++nextId}`;
}

describe('SqliteSchedulingRepository', () => {
  let database: SqliteDatabase;
  let routineRepository: SqliteRoutineRepository;
  let schedulingRepository: SqliteSchedulingRepository;

  beforeEach(async () => {
    database = await openTestDatabase();
    routineRepository = new SqliteRoutineRepository({
      database,
      generateId: createIdGenerator('schedule'),
    });
    schedulingRepository = new SqliteSchedulingRepository(database);
  });

  afterEach(async () => {
    await database.closeAsync();
  });

  it('persists and retrieves an individual-date assignment', async () => {
    await seedRoutine(routineRepository, 'routine-1', [1, 3]);
    const assignment = {
      id: 'assignment-1',
      routineId: 'routine-1',
      date: '2026-10-19',
    };

    await schedulingRepository.createAssignment(assignment);

    await expect(
      schedulingRepository.findAssignment('routine-1', '2026-10-19'),
    ).resolves.toEqual(assignment);
    await expect(
      schedulingRepository.findAssignment('routine-1', '2026-10-20'),
    ).resolves.toBeNull();
  });

  it('retrieves all assignments for a date across routines', async () => {
    await seedRoutine(routineRepository, 'routine-1', []);
    await seedRoutine(routineRepository, 'routine-2', []);
    await schedulingRepository.createAssignment({
      id: 'assignment-2',
      routineId: 'routine-2',
      date: '2026-10-19',
    });
    await schedulingRepository.createAssignment({
      id: 'assignment-1',
      routineId: 'routine-1',
      date: '2026-10-19',
    });
    await schedulingRepository.createAssignment({
      id: 'assignment-3',
      routineId: 'routine-1',
      date: '2026-10-20',
    });

    const assignments =
      await schedulingRepository.findAssignmentsByDate('2026-10-19');

    expect(assignments).toEqual([
      {
        id: 'assignment-1',
        routineId: 'routine-1',
        date: '2026-10-19',
      },
      {
        id: 'assignment-2',
        routineId: 'routine-2',
        date: '2026-10-19',
      },
    ]);
  });

  it('retrieves all assignments of one routine in calendar order', async () => {
    await seedRoutine(routineRepository, 'routine-1', []);
    await seedRoutine(routineRepository, 'routine-2', []);
    await schedulingRepository.createAssignment({
      id: 'later',
      routineId: 'routine-1',
      date: '2026-11-02',
    });
    await schedulingRepository.createAssignment({
      id: 'other-routine',
      routineId: 'routine-2',
      date: '2026-10-19',
    });
    await schedulingRepository.createAssignment({
      id: 'earlier',
      routineId: 'routine-1',
      date: '2026-10-19',
    });

    await expect(
      schedulingRepository.findAssignmentsByRoutine('routine-1'),
    ).resolves.toEqual([
      {
        id: 'earlier',
        routineId: 'routine-1',
        date: '2026-10-19',
      },
      {
        id: 'later',
        routineId: 'routine-1',
        date: '2026-11-02',
      },
    ]);
  });

  it('retrieves assignments in an inclusive date range in calendar order', async () => {
    await seedRoutine(routineRepository, 'routine-1', []);
    await seedRoutine(routineRepository, 'routine-2', []);
    const assignments = [
      { id: 'before', routineId: 'routine-1', date: '2026-09-30' },
      { id: 'start', routineId: 'routine-2', date: '2026-10-01' },
      { id: 'middle-b', routineId: 'routine-2', date: '2026-10-19' },
      { id: 'middle-a', routineId: 'routine-1', date: '2026-10-19' },
      { id: 'end', routineId: 'routine-1', date: '2026-10-31' },
      { id: 'after', routineId: 'routine-2', date: '2026-11-01' },
    ];
    for (const assignment of assignments) {
      await schedulingRepository.createAssignment(assignment);
    }

    await expect(
      schedulingRepository.findAssignmentsInRange('2026-10-01', '2026-10-31'),
    ).resolves.toEqual([
      assignments[1],
      assignments[3],
      assignments[2],
      assignments[4],
    ]);
  });

  it('deletes an assignment without changing recurring weekdays', async () => {
    await seedRoutine(routineRepository, 'routine-1', [1, 3]);
    await schedulingRepository.createAssignment({
      id: 'assignment-1',
      routineId: 'routine-1',
      date: '2026-10-19',
    });

    await expect(
      schedulingRepository.deleteAssignment('assignment-1'),
    ).resolves.toBe(true);
    await expect(
      schedulingRepository.findAssignment('routine-1', '2026-10-19'),
    ).resolves.toBeNull();
    await expect(
      schedulingRepository.deleteAssignment('assignment-1'),
    ).resolves.toBe(false);

    const routine = await routineRepository.findById('routine-1');
    expect(routine?.weekdays).toEqual([1, 3]);
  });

  it('keeps recurring weekdays and individual assignments across restarts', async () => {
    const temporaryDatabase = createTestDatabasePath();
    let firstConnection: SqliteDatabase | null = null;
    let secondConnection: SqliteDatabase | null = null;

    try {
      firstConnection = await openTestDatabase(temporaryDatabase.path);
      const firstRoutineRepository = new SqliteRoutineRepository({
        database: firstConnection,
        generateId: createIdGenerator('first-schedule'),
      });
      const routine = await seedRoutine(
        firstRoutineRepository,
        'routine-restart',
        [1, 3],
      );
      const firstSchedulingRepository = new SqliteSchedulingRepository(
        firstConnection,
      );
      const assignment = {
        id: 'assignment-restart',
        routineId: routine.id,
        date: '2026-10-19',
      };
      await firstSchedulingRepository.createAssignment(assignment);
      await firstConnection.closeAsync();
      firstConnection = null;

      secondConnection = await openTestDatabase(temporaryDatabase.path);
      const secondRoutineRepository = new SqliteRoutineRepository({
        database: secondConnection,
        generateId: createIdGenerator('second-schedule'),
      });
      const reopenedRoutine = await secondRoutineRepository.findById(routine.id);
      expect(reopenedRoutine?.weekdays).toEqual([1, 3]);

      const secondSchedulingRepository = new SqliteSchedulingRepository(
        secondConnection,
      );
      await expect(
        secondSchedulingRepository.findAssignment(routine.id, '2026-10-19'),
      ).resolves.toEqual(assignment);
      await expect(
        secondSchedulingRepository.findAssignmentsByDate('2026-10-19'),
      ).resolves.toEqual([assignment]);
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

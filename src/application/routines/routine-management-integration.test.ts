/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { SqliteDatabase } from '../../data/database/sqlite-database';
import { openTestDatabase } from '../../data/database/testing/test-database';
import { SqliteRoutineRepository } from '../../data/routines/sqlite-routine-repository';
import { createRoutine } from './create-routine';
import { getRoutineById } from './get-routine-by-id';
import { listRoutines } from './list-routines';
import { updateRoutine } from './update-routine';

const CREATED = '2026-10-18T08:00:00.000Z';
const UPDATED = '2026-10-19T12:00:00.000Z';

describe('routine management persistence workflow', () => {
  let database: SqliteDatabase;
  let repository: SqliteRoutineRepository;
  let generateId: () => string;
  let now: string;

  beforeEach(async () => {
    database = await openTestDatabase();
    let nextId = 0;
    generateId = () => `id-${++nextId}`;
    now = CREATED;
    repository = new SqliteRoutineRepository({ database, generateId });
  });

  afterEach(async () => {
    await database.closeAsync();
  });

  it('persists a routine with weekdays and updates its configuration', async () => {
    const created = await createRoutine(
      {
        name: 'Lower A',
        weekdays: [5, 2],
        exercises: [
          {
            name: 'Back Squat',
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 75,
          },
        ],
      },
      {
        routineRepository: repository,
        generateId,
        now: () => now,
      },
    );

    if (!created.ok) {
      throw new Error('Expected routine creation to succeed.');
    }
    expect(created.routine.weekdays).toEqual([2, 5]);

    await expect(
      getRoutineById(created.routine.id, { routineRepository: repository }),
    ).resolves.toEqual(created.routine);

    now = UPDATED;
    const updated = await updateRoutine(
      created.routine.id,
      {
        name: 'Lower B',
        weekdays: [3, 1],
        exercises: [
          {
            id: created.routine.exercises[0].id,
            name: 'Back Squat',
            targetSets: 5,
            targetRepsMin: 4,
            targetRepsMax: 6,
            targetWeightKg: 80,
          },
        ],
      },
      {
        routineRepository: repository,
        generateId,
        now: () => now,
      },
    );

    if (!updated.ok) {
      throw new Error('Expected routine update to succeed.');
    }

    await expect(
      getRoutineById(created.routine.id, { routineRepository: repository }),
    ).resolves.toEqual(updated.routine);
    await expect(
      listRoutines({ routineRepository: repository }),
    ).resolves.toEqual([updated.routine]);
  });
});

/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { SqliteDatabase } from '../../data/database/sqlite-database';
import { openTestDatabase } from '../../data/database/testing/test-database';
import { SqliteRoutineRepository } from '../../data/routines/sqlite-routine-repository';
import { SqliteSchedulingRepository } from '../../data/routines/sqlite-scheduling-repository';
import { assignRoutineToDate } from './assign-routine-to-date';
import { createRoutine } from './create-routine';
import { removeRoutineAssignment } from './remove-routine-assignment';
import { resolveMonthlySchedule } from './resolve-monthly-schedule';
import { setRoutineWeekdays } from './set-routine-weekdays';

const CREATED = '2026-10-18T08:00:00.000Z';
const UPDATED = '2026-10-19T12:00:00.000Z';

describe('scheduling persistence workflow', () => {
  let database: SqliteDatabase;
  let routineRepository: SqliteRoutineRepository;
  let schedulingRepository: SqliteSchedulingRepository;
  let generateId: () => string;

  beforeEach(async () => {
    database = await openTestDatabase();
    let nextId = 0;
    generateId = () => `id-${++nextId}`;
    routineRepository = new SqliteRoutineRepository({ database, generateId });
    schedulingRepository = new SqliteSchedulingRepository(database);
  });

  afterEach(async () => {
    await database.closeAsync();
  });

  it('keeps one-time dates and recurring weekdays independent', async () => {
    const created = await createRoutine(
      {
        name: 'Lower A',
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
        routineRepository,
        generateId,
        now: () => CREATED,
      },
    );

    if (!created.ok) {
      throw new Error('Expected routine creation to succeed.');
    }

    const assigned = await assignRoutineToDate(
      { routineId: created.routine.id, date: '2026-10-19' },
      { routineRepository, schedulingRepository, generateId },
    );
    if (!assigned.ok) {
      throw new Error('Expected the routine to be assigned.');
    }

    const initialMonth = await resolveMonthlySchedule('2026-10-01', {
      routineRepository,
      schedulingRepository,
    });
    if (!initialMonth.ok) {
      throw new Error('Expected the monthly schedule to load.');
    }

    expect(initialMonth.days).toHaveLength(1);
    expect(initialMonth.days[0]).toMatchObject({
      date: '2026-10-19',
      routines: [
        {
          recurring: false,
          assignment: { id: assigned.assignment.id },
        },
      ],
    });

    const weekdays = await setRoutineWeekdays(
      created.routine.id,
      [1],
      { routineRepository, now: () => UPDATED },
    );
    if (!weekdays.ok) {
      throw new Error('Expected the recurring days to update.');
    }

    const monthlyWithBothSources = await resolveMonthlySchedule('2026-10-01', {
      routineRepository,
      schedulingRepository,
    });
    if (!monthlyWithBothSources.ok) {
      throw new Error('Expected the monthly schedule to load.');
    }

    expect(monthlyWithBothSources.days.map((day) => day.date)).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ]);
    const october19 = monthlyWithBothSources.days.find(
      (day) => day.date === '2026-10-19',
    );
    expect(october19?.routines).toHaveLength(1);
    expect(october19?.routines[0].recurring).toBe(true);
    expect(october19?.routines[0].assignment?.id).toBe(
      assigned.assignment.id,
    );

    await expect(
      removeRoutineAssignment(assigned.assignment.id, {
        schedulingRepository,
      }),
    ).resolves.toEqual({ ok: true });

    const monthlyRecurringOnly = await resolveMonthlySchedule('2026-10-01', {
      routineRepository,
      schedulingRepository,
    });
    if (!monthlyRecurringOnly.ok) {
      throw new Error('Expected the monthly schedule to load.');
    }

    const recurringOnlyDay = monthlyRecurringOnly.days.find(
      (day) => day.date === '2026-10-19',
    );
    expect(recurringOnlyDay?.routines[0].recurring).toBe(true);
    expect(recurringOnlyDay?.routines[0].assignment).toBeUndefined();
    expect(
      monthlyRecurringOnly.days.find((day) => day.date === '2026-10-20'),
    ).toBeUndefined();
  });
});

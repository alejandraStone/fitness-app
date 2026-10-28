import { describe, expect, it, jest } from '@jest/globals';

import type {
  IsoWeekday,
  Routine,
  RoutineExercise,
  RoutineId,
  RoutineRepository,
} from '../../domain/routines';
import { setRoutineWeekdays } from './set-routine-weekdays';

const CREATED = '2026-10-18T08:00:00.000Z';
const NOW = '2026-10-19T12:00:00.000Z';

function createExercise(): RoutineExercise {
  return {
    id: 'exercise-1',
    routineId: 'routine-1',
    name: 'Back Squat',
    order: 0,
    targetSets: 4,
    targetRepsMin: 6,
    targetRepsMax: 8,
    targetWeightKg: 75,
  };
}

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [],
    exercises: [createExercise()],
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  };
}

interface InMemoryRoutineRepository extends RoutineRepository {
  findByIdCalls: RoutineId[];
  updates: Routine[];
}

function createRepository(routine: Routine | null): InMemoryRoutineRepository {
  const findByIdCalls: RoutineId[] = [];
  const updates: Routine[] = [];

  return {
    findByIdCalls,
    updates,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Routine[]> {
      return routine === null ? [] : [routine];
    },
    async findById(id: RoutineId): Promise<Routine | null> {
      findByIdCalls.push(id);
      return routine !== null && routine.id === id ? routine : null;
    },
    async update(updated: Routine): Promise<void> {
      updates.push(updated);
    },
    async delete(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

describe('setRoutineWeekdays', () => {
  it('assigns one recurring weekday without changing the rest of the routine', async () => {
    const existing = createRoutine();
    const repository = createRepository(existing);

    const result = await setRoutineWeekdays('routine-1', [3], {
      routineRepository: repository,
      now: () => NOW,
    });

    expect(result).toEqual({
      ok: true,
      routine: {
        ...existing,
        weekdays: [3],
        updatedAt: NOW,
      },
    });
    expect(existing.weekdays).toEqual([]);
    if (result.ok) {
      expect(repository.updates).toEqual([result.routine]);
    }
  });

  it('normalizes multiple weekdays by deduplicating and sorting them', async () => {
    const existing = createRoutine({ weekdays: [1, 3] });
    const repository = createRepository(existing);

    const result = await setRoutineWeekdays('routine-1', [5, 1, 3, 1], {
      routineRepository: repository,
      now: () => NOW,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.routine.weekdays).toEqual([1, 3, 5]);
      expect(result.routine.exercises).toEqual(existing.exercises);
    }
  });

  it('removes every recurring weekday when the list is empty', async () => {
    const existing = createRoutine({ weekdays: [1, 3, 5] });
    const repository = createRepository(existing);

    const result = await setRoutineWeekdays('routine-1', [], {
      routineRepository: repository,
      now: () => NOW,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.routine.weekdays).toEqual([]);
    }
    expect(repository.updates).toHaveLength(1);
  });

  it('rejects invalid weekday values before loading the routine', async () => {
    const repository = createRepository(createRoutine());
    const now = jest.fn(() => NOW);
    const invalidWeekdays = [0, 8, 2.5, '3'] as unknown as IsoWeekday[];

    const result = await setRoutineWeekdays('routine-1', invalidWeekdays, {
      routineRepository: repository,
      now,
    });

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'weekdays[0]',
        code: 'schedule.weekday.invalid',
        message: 'El día debe ser un número entero entre 1 (lunes) y 7 (domingo).',
      },
      {
        field: 'weekdays[1]',
        code: 'schedule.weekday.invalid',
        message: 'El día debe ser un número entero entre 1 (lunes) y 7 (domingo).',
      },
      {
        field: 'weekdays[2]',
        code: 'schedule.weekday.invalid',
        message: 'El día debe ser un número entero entre 1 (lunes) y 7 (domingo).',
      },
      {
        field: 'weekdays[3]',
        code: 'schedule.weekday.invalid',
        message: 'El día debe ser un número entero entre 1 (lunes) y 7 (domingo).',
      },
    ]);
    expect(repository.findByIdCalls).toEqual([]);
    expect(repository.updates).toEqual([]);
    expect(now).not.toHaveBeenCalled();
  });

  it('rejects a non-list weekday value', async () => {
    const repository = createRepository(createRoutine());

    const result = await setRoutineWeekdays(
      'routine-1',
      null as unknown as IsoWeekday[],
      {
        routineRepository: repository,
        now: () => NOW,
      },
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'weekdays',
        code: 'schedule.weekdays.invalid',
        message: 'Los días deben ser una lista.',
      },
    ]);
    expect(repository.findByIdCalls).toEqual([]);
  });

  it('returns a not-found error for an unknown routine', async () => {
    const repository = createRepository(null);
    const now = jest.fn(() => NOW);

    const result = await setRoutineWeekdays('missing-routine', [1], {
      routineRepository: repository,
      now,
    });

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'routineId',
        code: 'routine.notFound',
        message: 'No se encontró la rutina.',
      },
    ]);
    expect(repository.findByIdCalls).toEqual(['missing-routine']);
    expect(repository.updates).toEqual([]);
    expect(now).not.toHaveBeenCalled();
  });

  it('propagates persistence failures', async () => {
    const existing = createRoutine();
    const repository: RoutineRepository = {
      async create(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async findAll(): Promise<Routine[]> {
        return [existing];
      },
      async findById(): Promise<Routine | null> {
        return existing;
      },
      async update(): Promise<void> {
        throw new Error('database unavailable');
      },
      async delete(): Promise<boolean> {
        throw new Error('Not used in this test.');
      },
    };

    await expect(
      setRoutineWeekdays('routine-1', [1], {
        routineRepository: repository,
        now: () => NOW,
      }),
    ).rejects.toThrow('database unavailable');
  });
});

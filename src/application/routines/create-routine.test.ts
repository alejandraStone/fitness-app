import { describe, expect, it, jest } from '@jest/globals';

import type {
  CreateRoutineOptions,
  IsoWeekday,
  Routine,
  RoutineRepository,
} from '../../domain/routines';
import { createRoutine } from './create-routine';

const NOW = '2026-10-19T10:00:00.000Z';

interface InMemoryRoutineRepository extends RoutineRepository {
  created: Routine[];
  createOptions: (CreateRoutineOptions | undefined)[];
}

function createRepository(): InMemoryRoutineRepository {
  const created: Routine[] = [];
  const createOptions: (CreateRoutineOptions | undefined)[] = [];

  return {
    created,
    createOptions,
    async create(
      routine: Routine,
      options?: CreateRoutineOptions,
    ): Promise<void> {
      created.push(routine);
      createOptions.push(options);
    },
    async findAll(): Promise<Routine[]> {
      return [];
    },
    async findById(): Promise<Routine | null> {
      return null;
    },
    async update(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async delete(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

function createIdGenerator(prefix = 'id'): () => string {
  let next = 0;
  return () => `${prefix}-${++next}`;
}

describe('createRoutine', () => {
  it('creates a routine with normalized data, weekdays and exercise entries', async () => {
    const repository = createRepository();

    const result = await createRoutine(
      {
        name: '  Lower A  ',
        weekdays: [5, 2, 5],
        exercises: [
          {
            name: '  Back Squat  ',
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 75,
          },
          {
            name: 'Romanian Deadlift',
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 60,
            notes: '  Controlled  ',
          },
        ],
      },
      {
        routineRepository: repository,
        generateId: createIdGenerator(),
        now: () => NOW,
      },
    );

    expect(result).toEqual({
      ok: true,
      routine: {
        id: 'id-1',
        name: 'Lower A',
        weekdays: [2, 5],
        exercises: [
          {
            id: 'id-2',
            routineId: 'id-1',
            name: 'Back Squat',
            order: 0,
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 75,
          },
          {
            id: 'id-3',
            routineId: 'id-1',
            name: 'Romanian Deadlift',
            order: 1,
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 60,
            notes: 'Controlled',
          },
        ],
        createdAt: NOW,
        updatedAt: NOW,
      },
    });

    if (!result.ok) {
      throw new Error('Expected routine creation to succeed.');
    }
    expect(repository.created).toEqual([result.routine]);
    expect(repository.createOptions).toEqual([undefined]);
  });

  it('defaults omitted weekdays to an empty schedule', async () => {
    const result = await createRoutine(
      {
        name: 'Upper A',
        exercises: [
          {
            name: 'Bench Press',
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
          },
        ],
      },
      {
        routineRepository: createRepository(),
        generateId: createIdGenerator(),
        now: () => NOW,
      },
    );

    if (!result.ok) {
      throw new Error('Expected routine creation to succeed.');
    }
    expect(result.routine.weekdays).toEqual([]);
  });

  it('preserves the input order of exercise entries', async () => {
    const result = await createRoutine(
      {
        name: 'Upper A',
        exercises: [
          {
            name: 'Bench Press',
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 40,
          },
          {
            name: 'Overhead Press',
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 25,
          },
          {
            name: 'Cable Row',
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 45,
          },
        ],
      },
      {
        routineRepository: createRepository(),
        generateId: createIdGenerator(),
        now: () => NOW,
      },
    );

    if (!result.ok) {
      throw new Error('Expected routine creation to succeed.');
    }

    expect(result.routine.exercises.map((exercise) => exercise.name)).toEqual([
      'Bench Press',
      'Overhead Press',
      'Cable Row',
    ]);
    expect(result.routine.exercises.map((exercise) => exercise.order)).toEqual([
      0, 1, 2,
    ]);
  });

  it('rejects invalid data before generating identifiers or persisting', async () => {
    const repository = createRepository();
    const generateId = jest.fn(() => 'generated-id');

    const result = await createRoutine(
      {
        name: '   ',
        exercises: [],
      },
      {
        routineRepository: repository,
        generateId,
        now: () => NOW,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected routine creation to fail.');
    }

    expect(result.errors.map((error) => error.code)).toEqual([
      'routine.name.required',
      'routine.exercises.required',
    ]);
    expect(generateId).not.toHaveBeenCalled();
    expect(repository.created).toEqual([]);
  });

  it('rejects invalid weekdays without persisting the routine', async () => {
    const repository = createRepository();
    const generateId = jest.fn(() => 'generated-id');

    const result = await createRoutine(
      {
        name: 'Lower A',
        weekdays: [0, 8] as unknown as IsoWeekday[],
        exercises: [
          {
            name: 'Back Squat',
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
          },
        ],
      },
      {
        routineRepository: repository,
        generateId,
        now: () => NOW,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected routine creation to fail.');
    }

    expect(result.errors.map((error) => error.code)).toEqual([
      'schedule.weekday.invalid',
      'schedule.weekday.invalid',
    ]);
    expect(generateId).not.toHaveBeenCalled();
    expect(repository.created).toEqual([]);
  });

  it('rejects invalid exercise fields without persisting the routine', async () => {
    const repository = createRepository();

    const result = await createRoutine(
      {
        name: 'Lower A',
        exercises: [
          {
            name: 'Back Squat',
            targetSets: 0,
            targetRepsMin: 10,
            targetRepsMax: 8,
            targetWeightKg: -1,
          },
        ],
      },
      {
        routineRepository: repository,
        generateId: createIdGenerator(),
        now: () => NOW,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected routine creation to fail.');
    }

    expect(result.errors.map((error) => error.code)).toEqual([
      'exercise.targetSets.invalid',
      'exercise.targetReps.range',
      'exercise.targetWeight.invalid',
    ]);
    expect(repository.created).toEqual([]);
  });

  it('defaults an omitted planned weight to zero', async () => {
    const result = await createRoutine(
      {
        name: 'Pull-up day',
        exercises: [
          {
            name: 'Pull-up',
            targetSets: 3,
            targetRepsMin: 5,
            targetRepsMax: 8,
          },
        ],
      },
      {
        routineRepository: createRepository(),
        generateId: createIdGenerator(),
        now: () => NOW,
      },
    );

    if (!result.ok) {
      throw new Error('Expected routine creation to succeed.');
    }
    expect(result.routine.exercises[0].targetWeightKg).toBe(0);
  });

  it('propagates persistence failures', async () => {
    const repository: RoutineRepository = {
      async create(): Promise<void> {
        throw new Error('database unavailable');
      },
      async findAll(): Promise<Routine[]> {
        return [];
      },
      async findById(): Promise<Routine | null> {
        return null;
      },
      async update(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async delete(): Promise<boolean> {
        throw new Error('Not used in this test.');
      },
    };

    await expect(
      createRoutine(
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
          routineRepository: repository,
          generateId: createIdGenerator(),
          now: () => NOW,
        },
      ),
    ).rejects.toThrow('database unavailable');
  });
});

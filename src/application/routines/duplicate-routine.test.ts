import { describe, expect, it, jest } from '@jest/globals';

import type {
  CreateRoutineOptions,
  Routine,
  RoutineExercise,
  RoutineId,
  RoutineRepository,
} from '../../domain/routines';
import { duplicateRoutine } from './duplicate-routine';

const SOURCE_CREATED = '2026-10-18T08:00:00.000Z';
const NOW = '2026-10-19T12:00:00.000Z';
const TARGET_DATE = '2026-10-24';

function createExercise(
  id: string,
  name: string,
  order: number,
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id,
    routineId: 'routine-1',
    name,
    order,
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 10,
    targetWeightKg: 50,
    ...overrides,
  };
}

function createSource(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [1, 3, 5],
    exercises: [],
    createdAt: SOURCE_CREATED,
    updatedAt: SOURCE_CREATED,
    ...overrides,
  };
}

interface CreatedRecord {
  routine: Routine;
  options: CreateRoutineOptions | undefined;
}

interface InMemoryRoutineRepository extends RoutineRepository {
  created: CreatedRecord[];
  deletedIds: RoutineId[];
  findByIdCalls: RoutineId[];
}

function createRepository(source: Routine | null): InMemoryRoutineRepository {
  const created: CreatedRecord[] = [];
  const deletedIds: RoutineId[] = [];
  const findByIdCalls: RoutineId[] = [];

  return {
    created,
    deletedIds,
    findByIdCalls,
    async create(
      routine: Routine,
      options?: CreateRoutineOptions,
    ): Promise<void> {
      created.push({ routine, options });
    },
    async findAll(): Promise<Routine[]> {
      return source === null ? [] : [source];
    },
    async findById(id: RoutineId): Promise<Routine | null> {
      findByIdCalls.push(id);
      return source !== null && source.id === id ? source : null;
    },
    async update(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async delete(id: RoutineId): Promise<boolean> {
      deletedIds.push(id);
      return true;
    },
  };
}

function createIdGenerator(prefix = 'duplicate'): () => string {
  let next = 0;
  return () => `${prefix}-${++next}`;
}

describe('duplicateRoutine', () => {
  it('creates an independent copy named `<source name> COPIA` scheduled on the chosen date', async () => {
    const source = createSource({
      exercises: [
        createExercise('exercise-2', 'Leg Press', 1, {
          notes: 'Slow eccentric',
          targetSets: 3,
          targetRepsMin: 10,
          targetRepsMax: 12,
          targetWeightKg: 60,
        }),
        createExercise('exercise-1', 'Back Squat', 0, {
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 8,
          targetWeightKg: 75,
        }),
      ],
    });
    const repository = createRepository(source);

    const result = await duplicateRoutine(
      'routine-1',
      { date: TARGET_DATE },
      {
        routineRepository: repository,
        generateId: createIdGenerator('copy'),
        now: () => NOW,
      },
    );

    expect(result).toEqual({
      ok: true,
      routine: {
        id: 'copy-1',
        name: 'Lower A COPIA',
        weekdays: [],
        exercises: [
          {
            id: 'copy-2',
            routineId: 'copy-1',
            name: 'Back Squat',
            order: 0,
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 75,
          },
          {
            id: 'copy-3',
            routineId: 'copy-1',
            name: 'Leg Press',
            order: 1,
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 60,
            notes: 'Slow eccentric',
          },
        ],
        createdAt: NOW,
        updatedAt: NOW,
      },
      assignment: {
        id: 'copy-4',
        routineId: 'copy-1',
        date: TARGET_DATE,
      },
    });

    expect(repository.findByIdCalls).toEqual(['routine-1']);
    if (result.ok) {
      expect(repository.created).toEqual([
        {
          routine: result.routine,
          options: { dateAssignment: result.assignment },
        },
      ]);
    }
  });

  it('does not inherit recurring weekdays or mutate the source configuration', async () => {
    const source = createSource({
      exercises: [createExercise('exercise-1', 'Back Squat', 0)],
    });

    const result = await duplicateRoutine(
      'routine-1',
      { date: TARGET_DATE },
      {
        routineRepository: createRepository(source),
        generateId: createIdGenerator('copy'),
        now: () => NOW,
      },
    );

    if (!result.ok) {
      throw new Error('Expected routine duplication to succeed.');
    }

    expect(result.routine.weekdays).toEqual([]);
    expect(result.routine.exercises[0]).not.toBe(source.exercises[0]);

    result.routine.name = 'Changed';
    result.routine.weekdays.push(7);
    result.routine.exercises[0].name = 'Changed exercise';
    result.routine.exercises[0].targetWeightKg = 100;

    expect(source.name).toBe('Lower A');
    expect(source.weekdays).toEqual([1, 3, 5]);
    expect(source.exercises[0].name).toBe('Back Squat');
    expect(source.exercises[0].targetWeightKg).toBe(50);
  });

  it('rejects an invalid target date without reading or writing routines', async () => {
    const repository = createRepository(createSource());
    const generateId = jest.fn(() => 'generated-id');

    const result = await duplicateRoutine(
      'routine-1',
      { date: '2026-02-30' },
      {
        routineRepository: repository,
        generateId,
        now: () => NOW,
      },
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'date',
          code: 'schedule.date.invalid',
          message:
            'La fecha debe ser una fecha de calendario válida en formato AAAA-MM-DD.',
        },
      ],
    });
    expect(repository.findByIdCalls).toEqual([]);
    expect(repository.created).toEqual([]);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('returns a not-found error for an unknown source routine', async () => {
    const repository = createRepository(null);
    const generateId = jest.fn(() => 'generated-id');

    const result = await duplicateRoutine(
      'missing-routine',
      { date: TARGET_DATE },
      {
        routineRepository: repository,
        generateId,
        now: () => NOW,
      },
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'routineId',
          code: 'routine.notFound',
          message: 'No se encontró la rutina.',
        },
      ],
    });
    expect(repository.findByIdCalls).toEqual(['missing-routine']);
    expect(repository.created).toEqual([]);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('propagates persistence failures', async () => {
    const source = createSource({
      exercises: [createExercise('exercise-1', 'Back Squat', 0)],
    });
    const repository: RoutineRepository = {
      async create(): Promise<void> {
        throw new Error('database unavailable');
      },
      async findAll(): Promise<Routine[]> {
        return [source];
      },
      async findById(): Promise<Routine | null> {
        return source;
      },
      async update(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async delete(): Promise<boolean> {
        throw new Error('Not used in this test.');
      },
    };

    await expect(
      duplicateRoutine(
        'routine-1',
        { date: TARGET_DATE },
        {
          routineRepository: repository,
          generateId: createIdGenerator('copy'),
          now: () => NOW,
        },
      ),
    ).rejects.toThrow('database unavailable');
  });
});

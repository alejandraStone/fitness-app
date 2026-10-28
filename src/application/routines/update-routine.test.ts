import { describe, expect, it, jest } from '@jest/globals';

import type {
  IsoWeekday,
  Routine,
  RoutineExercise,
  RoutineId,
  RoutineRepository,
} from '../../domain/routines';
import { updateRoutine } from './update-routine';

const CREATED = '2026-10-18T08:00:00.000Z';
const UPDATED = '2026-10-19T12:00:00.000Z';

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

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [1, 3],
    exercises: [],
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

describe('updateRoutine', () => {
  it('updates, adds, removes and reorders exercise entries', async () => {
    const existing = createRoutine({
      exercises: [
        createExercise('exercise-1', 'Back Squat', 0, {
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 8,
          targetWeightKg: 75,
        }),
        createExercise('exercise-2', 'Leg Press', 1),
        createExercise('exercise-3', 'Calf Raise', 2),
      ],
    });
    const repository = createRepository(existing);
    const generateId = jest.fn(() => 'exercise-new');

    const result = await updateRoutine(
      'routine-1',
      {
        name: '  Lower B  ',
        exercises: [
          {
            id: 'exercise-3',
            name: '  Calf Raise  ',
            targetSets: 4,
            targetRepsMin: 12,
            targetRepsMax: 15,
            targetWeightKg: 40,
          },
          {
            id: 'exercise-1',
            name: '  Back Squat  ',
            targetSets: 5,
            targetRepsMin: 4,
            targetRepsMax: 6,
            targetWeightKg: 80,
            notes: '  Belt  ',
          },
          {
            name: '  Leg Extension  ',
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
          },
        ],
      },
      {
        routineRepository: repository,
        generateId,
        now: () => UPDATED,
      },
    );

    expect(result).toEqual({
      ok: true,
      routine: {
        id: 'routine-1',
        name: 'Lower B',
        weekdays: [1, 3],
        exercises: [
          {
            id: 'exercise-3',
            routineId: 'routine-1',
            name: 'Calf Raise',
            order: 0,
            targetSets: 4,
            targetRepsMin: 12,
            targetRepsMax: 15,
            targetWeightKg: 40,
          },
          {
            id: 'exercise-1',
            routineId: 'routine-1',
            name: 'Back Squat',
            order: 1,
            targetSets: 5,
            targetRepsMin: 4,
            targetRepsMax: 6,
            targetWeightKg: 80,
            notes: 'Belt',
          },
          {
            id: 'exercise-new',
            routineId: 'routine-1',
            name: 'Leg Extension',
            order: 2,
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 12,
            targetWeightKg: 0,
          },
        ],
        createdAt: CREATED,
        updatedAt: UPDATED,
      },
    });

    expect(generateId).toHaveBeenCalledTimes(1);
    if (result.ok) {
      expect(repository.updates).toEqual([result.routine]);
    }
  });

  it('replaces recurring weekdays when they are provided', async () => {
    const existing = createRoutine({
      exercises: [createExercise('exercise-1', 'Back Squat', 0)],
    });
    const repository = createRepository(existing);

    const result = await updateRoutine(
      'routine-1',
      {
        name: 'Lower A',
        weekdays: [6, 2, 6],
        exercises: [
          {
            id: 'exercise-1',
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
        generateId: jest.fn(() => 'generated-id'),
        now: () => UPDATED,
      },
    );

    if (!result.ok) {
      throw new Error('Expected routine update to succeed.');
    }

    expect(result.routine.weekdays).toEqual([2, 6]);
    expect(repository.updates).toEqual([result.routine]);
  });

  it('rejects invalid weekdays before loading or updating the routine', async () => {
    const repository = createRepository(createRoutine());
    const generateId = jest.fn(() => 'generated-id');

    const result = await updateRoutine(
      'routine-1',
      {
        name: 'Lower A',
        weekdays: [0] as unknown as IsoWeekday[],
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
        now: () => UPDATED,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected routine update to fail.');
    }

    expect(result.errors.map((error) => error.code)).toEqual([
      'schedule.weekday.invalid',
    ]);
    expect(repository.findByIdCalls).toEqual([]);
    expect(repository.updates).toEqual([]);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('rejects invalid data before loading or updating the routine', async () => {
    const repository = createRepository(null);
    const generateId = jest.fn(() => 'generated-id');

    const result = await updateRoutine(
      'routine-1',
      {
        name: '   ',
        exercises: [
          {
            name: 'Back Squat',
            targetSets: 0,
            targetRepsMin: 8,
            targetRepsMax: 6,
            targetWeightKg: -1,
          },
        ],
      },
      {
        routineRepository: repository,
        generateId,
        now: () => UPDATED,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected routine update to fail.');
    }

    expect(result.errors.map((error) => error.code)).toEqual([
      'routine.name.required',
      'exercise.targetSets.invalid',
      'exercise.targetReps.range',
      'exercise.targetWeight.invalid',
    ]);
    expect(repository.findByIdCalls).toEqual([]);
    expect(repository.updates).toEqual([]);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('returns a not-found error for an unknown routine', async () => {
    const repository = createRepository(null);
    const generateId = jest.fn(() => 'generated-id');

    const result = await updateRoutine(
      'missing-routine',
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
        generateId,
        now: () => UPDATED,
      },
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'routineId',
        code: 'routine.notFound',
        message: 'No se encontró la rutina.',
      },
    ]);
    expect(repository.findByIdCalls).toEqual(['missing-routine']);
    expect(repository.updates).toEqual([]);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('rejects an exercise identifier that does not belong to the routine', async () => {
    const existing = createRoutine({
      exercises: [createExercise('exercise-1', 'Back Squat', 0)],
    });
    const repository = createRepository(existing);

    const result = await updateRoutine(
      'routine-1',
      {
        name: 'Lower A',
        exercises: [
          {
            id: 'exercise-from-another-routine',
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
        generateId: jest.fn(() => 'generated-id'),
        now: () => UPDATED,
      },
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'exercises[0].id',
        code: 'exercise.unknownId',
        message: 'El ejercicio no pertenece a esta rutina.',
      },
    ]);
    expect(repository.updates).toEqual([]);
  });

  it('rejects duplicate exercise identifiers', async () => {
    const existing = createRoutine({
      exercises: [createExercise('exercise-1', 'Back Squat', 0)],
    });
    const repository = createRepository(existing);

    const result = await updateRoutine(
      'routine-1',
      {
        name: 'Lower A',
        exercises: [
          {
            id: 'exercise-1',
            name: 'Back Squat',
            targetSets: 4,
            targetRepsMin: 6,
            targetRepsMax: 8,
            targetWeightKg: 75,
          },
          {
            id: 'exercise-1',
            name: 'Back Squat variation',
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 70,
          },
        ],
      },
      {
        routineRepository: repository,
        generateId: jest.fn(() => 'generated-id'),
        now: () => UPDATED,
      },
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'exercises[1].id',
        code: 'exercise.duplicateId',
        message: 'El identificador del ejercicio está repetido.',
      },
    ]);
    expect(repository.updates).toEqual([]);
  });

  it('renames a routine without changing its schedule or exercise identifiers', async () => {
    const existing = createRoutine({
      weekdays: [1, 3],
      exercises: [
        createExercise('exercise-1', 'Back Squat', 0, { notes: 'Belt' }),
      ],
    });
    const repository = createRepository(existing);
    const generateId = jest.fn(() => 'unused-id');

    const result = await updateRoutine(
      'routine-1',
      {
        name: '  Lower B  ',
        exercises: [
          {
            id: 'exercise-1',
            name: 'Back Squat',
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 50,
            notes: 'Belt',
          },
        ],
      },
      {
        routineRepository: repository,
        generateId,
        now: () => UPDATED,
      },
    );

    if (!result.ok) {
      throw new Error('Expected routine update to succeed.');
    }

    expect(result.routine.name).toBe('Lower B');
    expect(result.routine.weekdays).toEqual([1, 3]);
    expect(result.routine.exercises[0]?.id).toBe('exercise-1');
    expect(result.routine.exercises[0]?.notes).toBe('Belt');
    expect(generateId).not.toHaveBeenCalled();
  });

  it('does not mutate the loaded routine, keeping historical snapshots independent', async () => {
    const existing = createRoutine({
      exercises: [
        createExercise('exercise-1', 'Back Squat', 0, {
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 8,
          targetWeightKg: 75,
        }),
      ],
    });
    const historicalSnapshot = structuredClone(existing);

    await updateRoutine(
      'routine-1',
      {
        name: 'Lower B',
        exercises: [
          {
            id: 'exercise-1',
            name: 'Back Squat',
            targetSets: 5,
            targetRepsMin: 4,
            targetRepsMax: 6,
            targetWeightKg: 80,
          },
        ],
      },
      {
        routineRepository: createRepository(existing),
        generateId: jest.fn(() => 'generated-id'),
        now: () => UPDATED,
      },
    );

    expect(existing).toEqual(historicalSnapshot);
  });

  it('propagates persistence failures', async () => {
    const existing = createRoutine({
      exercises: [createExercise('exercise-1', 'Back Squat', 0)],
    });
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
      updateRoutine(
        'routine-1',
        {
          name: 'Lower B',
          exercises: [
            {
              id: 'exercise-1',
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
          generateId: jest.fn(() => 'generated-id'),
          now: () => UPDATED,
        },
      ),
    ).rejects.toThrow('database unavailable');
  });
});

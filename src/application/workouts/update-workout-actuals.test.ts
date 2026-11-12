import { describe, expect, it } from '@jest/globals';

import type {
  Workout,
  WorkoutExercise,
  WorkoutRepository,
  WorkoutSet,
  WorkoutSummary,
} from '../../domain/workouts';
import { updateWorkoutActuals } from './update-workout-actuals';

function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'set-1',
    setNumber: 1,
    weightKg: 80,
    reps: 8,
    ...overrides,
  };
}

function createExercise(
  overrides: Partial<WorkoutExercise> = {},
): WorkoutExercise {
  return {
    id: 'workout-exercise-1',
    nameSnapshot: 'Back Squat',
    order: 0,
    plannedSets: 2,
    plannedRepsMin: 8,
    plannedRepsMax: 10,
    plannedWeightKg: 75,
    notesSnapshot: 'Brace before descending.',
    sets: [
      createSet(),
      createSet({ id: 'set-2', setNumber: 2, weightKg: 82.5, reps: 7 }),
    ],
    ...overrides,
  };
}

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    routineId: 'routine-1',
    date: '2026-11-02',
    routineNameSnapshot: 'Lower A',
    savedAt: '2026-11-02T18:00:00.000Z',
    exercises: [createExercise()],
    ...overrides,
  };
}

function cloneWorkout(workout: Workout): Workout {
  return JSON.parse(JSON.stringify(workout)) as Workout;
}

interface InMemoryWorkoutRepository extends WorkoutRepository {
  updated: Workout[];
}

function createRepository(
  workout: Workout | null,
  readError?: Error,
  updateError?: Error,
): InMemoryWorkoutRepository {
  const updated: Workout[] = [];

  return {
    updated,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
    },
    async findById(id: string): Promise<Workout | null> {
      if (readError !== undefined) {
        throw readError;
      }
      return workout !== null && workout.id === id ? cloneWorkout(workout) : null;
    },
    async findByRoutineAndDate(): Promise<Workout | null> {
      throw new Error('Not used in this test.');
    },
    async findSummaries(): Promise<WorkoutSummary[]> {
      throw new Error('Not used in this test.');
    },
    async findSummariesByDateRange(): Promise<WorkoutSummary[]> {
      throw new Error('Not used in this test.');
    },
    async findPreviousPerformanceCandidates(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
    },
    async updateActualSets(next: Workout): Promise<void> {
      if (updateError !== undefined) {
        throw updateError;
      }
      updated.push(next);
    },
  };
}

describe('updateWorkoutActuals', () => {
  it('updates only actual weights and repetitions and returns the updated workout', async () => {
    const stored = createWorkout();
    const repository = createRepository(stored);
    const candidate = cloneWorkout(stored);
    candidate.exercises[0].sets[0] = {
      ...candidate.exercises[0].sets[0],
      weightKg: 85,
      reps: 6,
    };
    candidate.exercises[0].sets[1] = {
      ...candidate.exercises[0].sets[1],
      weightKg: 0,
      reps: 12,
    };

    const result = await updateWorkoutActuals(
      { workout: candidate },
      { workoutRepository: repository },
    );

    const expected = cloneWorkout(stored);
    expected.exercises[0].sets[0].weightKg = 85;
    expected.exercises[0].sets[0].reps = 6;
    expected.exercises[0].sets[1].weightKg = 0;
    expected.exercises[0].sets[1].reps = 12;

    expect(result).toEqual({ ok: true, workout: expected });
    expect(repository.updated).toEqual([expected]);
  });

  it('reports a missing workout without attempting an update', async () => {
    const repository = createRepository(null);

    const result = await updateWorkoutActuals(
      { workout: createWorkout({ id: 'missing-workout' }) },
      { workoutRepository: repository },
    );

    expect(result).toEqual({
      ok: false,
      reason: 'notFound',
      errors: [
        {
          field: 'workoutId',
          code: 'workout.notFound',
          message: 'No se encontró el entrenamiento.',
        },
      ],
    });
    expect(repository.updated).toEqual([]);
  });

  it('validates every actual value before updating', async () => {
    const stored = createWorkout();
    const repository = createRepository(stored);
    const candidate = cloneWorkout(stored);
    candidate.exercises[0].sets[0].reps = 0;
    candidate.exercises[0].sets[1].weightKg = -5;

    const result = await updateWorkoutActuals(
      { workout: candidate },
      { workoutRepository: repository },
    );

    expect(result).toEqual({
      ok: false,
      reason: 'validation',
      errors: [
        {
          field: 'exercises[0].sets[0].reps',
          code: 'workout.set.reps.invalid',
          message: 'Las repeticiones deben ser un número entero mayor que cero.',
        },
        {
          field: 'exercises[0].sets[1].weightKg',
          code: 'workout.set.weight.invalid',
          message: 'El peso debe ser un número mayor o igual que cero.',
        },
      ],
    });
    expect(repository.updated).toEqual([]);
  });

  const structuralChanges: {
    name: string;
    field: string;
    change: (candidate: Workout) => void;
  }[] = [
    {
      name: 'workout date',
      field: 'date',
      change: (candidate) => {
        candidate.date = '2026-11-03';
      },
    },
    {
      name: 'routine snapshot name',
      field: 'routineNameSnapshot',
      change: (candidate) => {
        candidate.routineNameSnapshot = 'Upper A';
      },
    },
    {
      name: 'save timestamp',
      field: 'savedAt',
      change: (candidate) => {
        candidate.savedAt = '2026-11-02T19:00:00.000Z';
      },
    },
    {
      name: 'exercise identity',
      field: 'exercises[0].id',
      change: (candidate) => {
        candidate.exercises[0].id = 'other-exercise';
      },
    },
    {
      name: 'exercise order',
      field: 'exercises[0].order',
      change: (candidate) => {
        candidate.exercises[0].order = 2;
      },
    },
    {
      name: 'planned sets',
      field: 'exercises[0].plannedSets',
      change: (candidate) => {
        candidate.exercises[0].plannedSets = 3;
      },
    },
    {
      name: 'planned repetition minimum',
      field: 'exercises[0].plannedRepsMin',
      change: (candidate) => {
        candidate.exercises[0].plannedRepsMin = 6;
      },
    },
    {
      name: 'planned repetition maximum',
      field: 'exercises[0].plannedRepsMax',
      change: (candidate) => {
        candidate.exercises[0].plannedRepsMax = 12;
      },
    },
    {
      name: 'planned weight',
      field: 'exercises[0].plannedWeightKg',
      change: (candidate) => {
        candidate.exercises[0].plannedWeightKg = 80;
      },
    },
    {
      name: 'exercise notes snapshot',
      field: 'exercises[0].notesSnapshot',
      change: (candidate) => {
        candidate.exercises[0].notesSnapshot = 'Changed note.';
      },
    },
    {
      name: 'set count',
      field: 'exercises[0].sets',
      change: (candidate) => {
        candidate.exercises[0].sets = [candidate.exercises[0].sets[0]];
      },
    },
    {
      name: 'set identity',
      field: 'exercises[0].sets[0].id',
      change: (candidate) => {
        candidate.exercises[0].sets[0].id = 'other-set';
      },
    },
    {
      name: 'set number',
      field: 'exercises[0].sets[0].setNumber',
      change: (candidate) => {
        candidate.exercises[0].sets[0].setNumber = 2;
      },
    },
  ];

  it.each(structuralChanges)(
    'rejects a change to $name through the edit path',
    async ({ field, change }) => {
      const stored = createWorkout();
      const repository = createRepository(stored);
      const candidate = cloneWorkout(stored);
      change(candidate);

      const result = await updateWorkoutActuals(
        { workout: candidate },
        { workoutRepository: repository },
      );

      expect(result).toEqual({
        ok: false,
        reason: 'structure',
        errors: [
          {
            field,
            code: 'workout.structure.changed',
            message:
              'Solo puedes cambiar el peso y las repeticiones de cada serie.',
          },
        ],
      });
      expect(repository.updated).toEqual([]);
    },
  );

  it('translates read and write failures without exposing persistence details', async () => {
    const readRepository = createRepository(
      null,
      new Error('SQLITE_IOERR: read failed'),
    );
    const readResult = await updateWorkoutActuals(
      { workout: createWorkout() },
      { workoutRepository: readRepository },
    );

    expect(readResult).toEqual({
      ok: false,
      reason: 'persistence',
      errors: [
        {
          field: 'workout',
          code: 'workout.load.failed',
          message: 'No se pudo cargar el entrenamiento.',
        },
      ],
    });

    const stored = createWorkout();
    const writeRepository = createRepository(
      stored,
      undefined,
      new Error('SQLITE_FULL: disk full'),
    );
    const candidate = cloneWorkout(stored);
    candidate.exercises[0].sets[0].weightKg = 90;

    const writeResult = await updateWorkoutActuals(
      { workout: candidate },
      { workoutRepository: writeRepository },
    );

    expect(writeResult).toEqual({
      ok: false,
      reason: 'persistence',
      errors: [
        {
          field: 'workout',
          code: 'workout.update.failed',
          message:
            'No se pudieron actualizar los valores del entrenamiento. Inténtalo de nuevo.',
        },
      ],
    });
  });
});

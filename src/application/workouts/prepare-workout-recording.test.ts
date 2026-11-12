import { describe, expect, it } from '@jest/globals';

import type {
  DateOnly,
  Routine,
  RoutineAssignment,
  RoutineExercise,
  RoutineId,
  RoutineRepository,
  SchedulingRepository,
} from '../../domain/routines';
import type {
  PreviousPerformanceCandidateOptions,
  Workout,
  WorkoutExercise,
  WorkoutRepository,
  WorkoutSet,
  WorkoutSummary,
} from '../../domain/workouts';
import { prepareWorkoutRecording } from './prepare-workout-recording';

const CREATED = '2026-10-18T08:00:00.000Z';
const TODAY = '2026-11-02';

function createRoutineExercise(
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id: 'exercise-1',
    routineId: 'routine-1',
    name: 'Back Squat',
    order: 0,
    targetSets: 2,
    targetRepsMin: 8,
    targetRepsMax: 10,
    targetWeightKg: 75,
    notes: 'Brace before descending.',
    ...overrides,
  };
}

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [1],
    exercises: [createRoutineExercise()],
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  };
}

function createWorkoutSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'workout-set-1',
    setNumber: 1,
    weightKg: 75,
    reps: 8,
    ...overrides,
  };
}

function createWorkoutExercise(
  overrides: Partial<WorkoutExercise> = {},
): WorkoutExercise {
  return {
    id: 'workout-exercise-1',
    nameSnapshot: 'Back Squat',
    order: 0,
    plannedSets: 1,
    plannedRepsMin: 8,
    plannedRepsMax: 10,
    plannedWeightKg: 75,
    sets: [createWorkoutSet()],
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
    exercises: [createWorkoutExercise()],
    ...overrides,
  };
}

function createPreviousWorkout(
  id: string,
  date: DateOnly,
  exerciseName: string,
  weightKg: number,
  reps: number,
): Workout {
  return createWorkout({
    id,
    routineId: `routine-${id}`,
    date,
    routineNameSnapshot: 'Previous workout',
    savedAt: `${date}T10:00:00.000Z`,
    exercises: [
      createWorkoutExercise({
        id: `${id}-exercise`,
        nameSnapshot: exerciseName,
        plannedSets: 1,
        plannedRepsMin: reps,
        plannedRepsMax: reps,
        plannedWeightKg: weightKg,
        sets: [
          createWorkoutSet({
            id: `${id}-set`,
            weightKg,
            reps,
          }),
        ],
      }),
    ],
  });
}

interface InMemoryRoutineRepository extends RoutineRepository {
  findByIdCalls: RoutineId[];
}

function createRoutineRepository(
  routines: Routine[] = [],
): InMemoryRoutineRepository {
  const findByIdCalls: RoutineId[] = [];

  return {
    findByIdCalls,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Routine[]> {
      return routines;
    },
    async findById(id: RoutineId): Promise<Routine | null> {
      findByIdCalls.push(id);
      return routines.find((routine) => routine.id === id) ?? null;
    },
    async update(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async delete(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

interface FindAssignmentCall {
  routineId: RoutineId;
  date: DateOnly;
}

interface InMemorySchedulingRepository extends SchedulingRepository {
  findAssignmentCalls: FindAssignmentCall[];
}

function createSchedulingRepository(
  assignments: RoutineAssignment[] = [],
): InMemorySchedulingRepository {
  const findAssignmentCalls: FindAssignmentCall[] = [];

  return {
    findAssignmentCalls,
    async findAssignment(
      routineId: RoutineId,
      date: DateOnly,
    ): Promise<RoutineAssignment | null> {
      findAssignmentCalls.push({ routineId, date });
      return (
        assignments.find(
          (assignment) =>
            assignment.routineId === routineId && assignment.date === date,
        ) ?? null
      );
    },
    async findAssignmentsByDate(): Promise<RoutineAssignment[]> {
      throw new Error('Not used in this test.');
    },
    async findAssignmentsByRoutine(): Promise<RoutineAssignment[]> {
      throw new Error('Not used in this test.');
    },
    async findAssignmentsInRange(): Promise<RoutineAssignment[]> {
      throw new Error('Not used in this test.');
    },
    async createAssignment(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async deleteAssignment(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

interface FindByRoutineAndDateCall {
  routineId: RoutineId;
  date: DateOnly;
}

interface PreviousPerformanceCall {
  selectedDate: DateOnly;
  options: PreviousPerformanceCandidateOptions | undefined;
}

interface InMemoryWorkoutRepository extends WorkoutRepository {
  findByRoutineAndDateCalls: FindByRoutineAndDateCall[];
  previousPerformanceCalls: PreviousPerformanceCall[];
}

function createWorkoutRepository(
  workouts: Workout[] = [],
): InMemoryWorkoutRepository {
  const findByRoutineAndDateCalls: FindByRoutineAndDateCall[] = [];
  const previousPerformanceCalls: PreviousPerformanceCall[] = [];

  return {
    findByRoutineAndDateCalls,
    previousPerformanceCalls,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
    },
    async findById(): Promise<Workout | null> {
      throw new Error('Not used in this test.');
    },
    async findByRoutineAndDate(
      routineId: RoutineId,
      date: DateOnly,
    ): Promise<Workout | null> {
      findByRoutineAndDateCalls.push({ routineId, date });
      return (
        workouts.find(
          (workout) =>
            workout.routineId === routineId && workout.date === date,
        ) ?? null
      );
    },
    async findSummaries(): Promise<WorkoutSummary[]> {
      throw new Error('Not used in this test.');
    },
    async findSummariesByDateRange(): Promise<WorkoutSummary[]> {
      throw new Error('Not used in this test.');
    },
    async findPreviousPerformanceCandidates(
      selectedDate: DateOnly,
      options?: PreviousPerformanceCandidateOptions,
    ): Promise<Workout[]> {
      previousPerformanceCalls.push({ selectedDate, options });
      return workouts.filter(
        (workout) =>
          workout.date < selectedDate &&
          workout.id !== options?.excludeWorkoutId,
      );
    },
    async updateActualSets(): Promise<void> {
      throw new Error('Not used in this test.');
    },
  };
}

interface DependencyOptions {
  routines?: Routine[];
  assignments?: RoutineAssignment[];
  workouts?: Workout[];
  today?: DateOnly;
}

function createDependencies(options: DependencyOptions = {}) {
  return {
    routineRepository: createRoutineRepository(options.routines ?? []),
    schedulingRepository: createSchedulingRepository(options.assignments ?? []),
    workoutRepository: createWorkoutRepository(options.workouts ?? []),
    today: () => options.today ?? TODAY,
  };
}

describe('prepareWorkoutRecording', () => {
  it('prepares a recurring routine on the current date with aligned previous performances', async () => {
    const routine = createRoutine({
      weekdays: [1],
      exercises: [
        createRoutineExercise({
          id: 'exercise-2',
          name: 'Leg Curl',
          order: 1,
          targetSets: 1,
          targetRepsMin: 10,
          targetRepsMax: 12,
          targetWeightKg: 30,
          notes: 'Slow eccentric.',
        }),
        createRoutineExercise({
          id: 'exercise-1',
          name: 'Back Squat',
          order: 0,
          targetSets: 2,
          targetRepsMin: 8,
          targetRepsMax: 10,
          targetWeightKg: 75,
          notes: 'Brace before descending.',
        }),
      ],
    });
    const older = createPreviousWorkout(
      'older',
      '2026-10-30',
      'Back Squat',
      70,
      10,
    );
    const newer = createPreviousWorkout(
      'newer',
      '2026-11-01',
      '  bAcK sQuAt  ',
      80,
      8,
    );
    const sameDay = createPreviousWorkout(
      'same-day',
      '2026-11-02',
      'Back Squat',
      85,
      6,
    );
    const future = createPreviousWorkout(
      'future',
      '2026-11-03',
      'Back Squat',
      90,
      5,
    );
    const dependencies = createDependencies({
      routines: [routine],
      workouts: [older, newer, sameDay, future],
      today: '2026-11-02',
    });

    const result = await prepareWorkoutRecording(
      { routineId: routine.id, date: '2026-11-02' },
      dependencies,
    );

    expect(result).toEqual({
      ok: true,
      mode: 'record',
      context: {
        routineId: routine.id,
        date: '2026-11-02',
        routineNameSnapshot: 'Lower A',
        exercises: [
          {
            nameSnapshot: 'Back Squat',
            order: 0,
            plannedSets: 2,
            plannedRepsMin: 8,
            plannedRepsMax: 10,
            plannedWeightKg: 75,
            notesSnapshot: 'Brace before descending.',
          },
          {
            nameSnapshot: 'Leg Curl',
            order: 1,
            plannedSets: 1,
            plannedRepsMin: 10,
            plannedRepsMax: 12,
            plannedWeightKg: 30,
            notesSnapshot: 'Slow eccentric.',
          },
        ],
      },
      previousPerformances: [
        {
          workoutId: 'newer',
          date: '2026-11-01',
          sets: [{ setNumber: 1, weightKg: 80, reps: 8 }],
        },
        null,
      ],
    });
    expect(dependencies.schedulingRepository.findAssignmentCalls).toEqual([]);
    expect(
      dependencies.workoutRepository.previousPerformanceCalls,
    ).toEqual([{ selectedDate: '2026-11-02', options: undefined }]);
  });

  it('prepares a past date scheduled by a one-time assignment', async () => {
    const routine = createRoutine({ weekdays: [] });
    const assignment: RoutineAssignment = {
      id: 'assignment-1',
      routineId: routine.id,
      date: '2026-11-01',
    };
    const dependencies = createDependencies({
      routines: [routine],
      assignments: [assignment],
      today: '2026-11-02',
    });

    const result = await prepareWorkoutRecording(
      { routineId: routine.id, date: '2026-11-01' },
      dependencies,
    );

    expect(result.ok).toBe(true);
    if (!result.ok || result.mode !== 'record') {
      throw new Error('Expected recording preparation to succeed.');
    }

    expect(result.context.date).toBe('2026-11-01');
    expect(result.context.exercises).toHaveLength(1);
    expect(result.previousPerformances).toEqual([null]);
    expect(dependencies.schedulingRepository.findAssignmentCalls).toEqual([
      { routineId: routine.id, date: '2026-11-01' },
    ]);
    expect(
      dependencies.workoutRepository.previousPerformanceCalls,
    ).toHaveLength(1);
  });

  it('rejects an invalid date before loading data', async () => {
    const dependencies = createDependencies();

    const result = await prepareWorkoutRecording(
      { routineId: 'routine-1', date: '2026-02-30' },
      dependencies,
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
    expect(dependencies.routineRepository.findByIdCalls).toEqual([]);
    expect(dependencies.workoutRepository.findByRoutineAndDateCalls).toEqual(
      [],
    );
  });

  it('rejects a future date before loading data', async () => {
    const dependencies = createDependencies({
      routines: [createRoutine()],
      today: '2026-11-02',
    });

    const result = await prepareWorkoutRecording(
      { routineId: 'routine-1', date: '2026-11-03' },
      dependencies,
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'date',
          code: 'workout.date.future',
          message: 'No puedes registrar un entrenamiento en una fecha futura.',
        },
      ],
    });
    expect(dependencies.routineRepository.findByIdCalls).toEqual([]);
    expect(dependencies.workoutRepository.findByRoutineAndDateCalls).toEqual(
      [],
    );
  });

  it('rejects a missing routine without loading workouts', async () => {
    const dependencies = createDependencies({ today: '2026-11-02' });

    const result = await prepareWorkoutRecording(
      { routineId: 'missing-routine', date: '2026-11-02' },
      dependencies,
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'routineId',
          code: 'workout.routine.notFound',
          message: 'No se encontró la rutina.',
        },
      ],
    });
    expect(dependencies.routineRepository.findByIdCalls).toEqual([
      'missing-routine',
    ]);
    expect(dependencies.workoutRepository.findByRoutineAndDateCalls).toEqual(
      [],
    );
  });

  it('rejects a routine that is neither recurring nor assigned to the date', async () => {
    const routine = createRoutine({ weekdays: [3] });
    const dependencies = createDependencies({
      routines: [routine],
      today: '2026-11-02',
    });

    const result = await prepareWorkoutRecording(
      { routineId: routine.id, date: '2026-11-02' },
      dependencies,
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'date',
          code: 'workout.routine.notScheduled',
          message: 'La rutina no está programada para la fecha seleccionada.',
        },
      ],
    });
    expect(dependencies.schedulingRepository.findAssignmentCalls).toEqual([
      { routineId: routine.id, date: '2026-11-02' },
    ]);
    expect(
      dependencies.workoutRepository.previousPerformanceCalls,
    ).toEqual([]);
  });

  it('returns the existing workout and skips context and previous reads', async () => {
    const routine = createRoutine({ weekdays: [1] });
    const existing = createWorkout({
      id: 'workout-existing',
      routineId: routine.id,
      date: '2026-11-02',
    });
    const dependencies = createDependencies({
      routines: [routine],
      workouts: [existing],
      today: '2026-11-02',
    });

    const result = await prepareWorkoutRecording(
      { routineId: routine.id, date: '2026-11-02' },
      dependencies,
    );

    expect(result).toEqual({
      ok: true,
      mode: 'existing',
      workout: existing,
    });
    expect(
      dependencies.workoutRepository.previousPerformanceCalls,
    ).toEqual([]);
  });
});

import { describe, expect, it } from '@jest/globals';

import type {
  Workout,
  WorkoutRepository,
  WorkoutSummary,
} from '../../domain/workouts';
import { listWorkoutHistory } from './list-workout-history';

function createSummary(
  overrides: Partial<WorkoutSummary> = {},
): WorkoutSummary {
  return {
    id: 'workout-1',
    routineId: 'routine-1',
    date: '2026-11-02',
    routineNameSnapshot: 'Lower A',
    savedAt: '2026-11-02T18:00:00.000Z',
    exerciseCount: 2,
    totalSets: 4,
    totalReps: 28,
    ...overrides,
  };
}

interface InMemoryWorkoutRepository extends WorkoutRepository {
  findSummariesCalls: number;
}

function createRepository(
  summaries: WorkoutSummary[] = [],
  error?: Error,
): InMemoryWorkoutRepository {
  const repository: InMemoryWorkoutRepository = {
    findSummariesCalls: 0,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
    },
    async findById(): Promise<Workout | null> {
      throw new Error('Not used in this test.');
    },
    async findByRoutineAndDate(): Promise<Workout | null> {
      throw new Error('Not used in this test.');
    },
    async findSummaries(): Promise<WorkoutSummary[]> {
      repository.findSummariesCalls += 1;
      if (error !== undefined) {
        throw error;
      }
      return summaries;
    },
    async findSummariesByDateRange(): Promise<WorkoutSummary[]> {
      throw new Error('Not used in this test.');
    },
    async findPreviousPerformanceCandidates(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
    },
    async updateActualSets(): Promise<void> {
      throw new Error('Not used in this test.');
    },
  };

  return repository;
}

describe('listWorkoutHistory', () => {
  it('returns every saved workout newest first with deterministic tie-breaking', async () => {
    const older = createSummary({
      id: 'workout-older',
      date: '2026-10-30',
      savedAt: '2026-10-30T18:00:00.000Z',
    });
    const sameDateLaterSave = createSummary({
      id: 'workout-later-save',
      date: '2026-11-02',
      savedAt: '2026-11-02T20:00:00.000Z',
    });
    const sameDateEarlierSave = createSummary({
      id: 'workout-earlier-save',
      date: '2026-11-02',
      savedAt: '2026-11-02T18:00:00.000Z',
    });
    const repository = createRepository([
      older,
      sameDateEarlierSave,
      sameDateLaterSave,
    ]);

    const result = await listWorkoutHistory({
      workoutRepository: repository,
    });

    expect(result).toEqual({
      ok: true,
      summaries: [sameDateLaterSave, sameDateEarlierSave, older],
    });
    expect(repository.findSummariesCalls).toBe(1);
  });

  it('returns an empty list when no workouts have been saved', async () => {
    const repository = createRepository();

    const result = await listWorkoutHistory({
      workoutRepository: repository,
    });

    expect(result).toEqual({ ok: true, summaries: [] });
  });

  it('translates persistence failures into a recoverable Spanish error', async () => {
    const repository = createRepository(
      [],
      new Error('SQLITE_BUSY: database is locked'),
    );

    const result = await listWorkoutHistory({
      workoutRepository: repository,
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'workout',
          code: 'workout.load.failed',
          message:
            'No se pudieron cargar los entrenamientos. Inténtalo de nuevo.',
        },
      ],
    });
  });
});

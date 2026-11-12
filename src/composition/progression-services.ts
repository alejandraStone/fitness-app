import { randomUUID } from 'expo-crypto';

import {
  getWorkoutProgression as getWorkoutProgressionUseCase,
  type GetWorkoutProgressionResult,
} from '../application/progression/get-workout-progression';
import {
  keepCurrentWeight as keepCurrentWeightUseCase,
  type KeepCurrentWeightResult,
} from '../application/progression/keep-current-weight';
import type { SqliteDatabase } from '../data/database/sqlite-database';
import { SqliteProgressionDecisionRepository } from '../data/progression/sqlite-progression-decision-repository';
import { SqliteRoutineRepository } from '../data/routines/sqlite-routine-repository';
import { SqliteWorkoutRepository } from '../data/workouts/sqlite-workout-repository';
import type { Timestamp } from '../domain/routines';
import type {
  WorkoutExerciseId,
  WorkoutId,
} from '../domain/workouts';

/**
 * Application-facing operations used by the Workout Detail progression card.
 *
 * This is the composition boundary between presentation and the application
 * layer. Screens never access SQLite or repositories directly.
 */
export interface ProgressionServices {
  getWorkoutProgression: (
    workoutId: WorkoutId,
  ) => Promise<GetWorkoutProgressionResult>;
  keepCurrentWeight: (
    workoutExerciseId: WorkoutExerciseId,
  ) => Promise<KeepCurrentWeightResult>;
}

/**
 * Creates the Progression services for an already-open database.
 *
 * The repositories share the application's single SQLite connection; no
 * second connection is opened.
 */
export function createProgressionServices(
  database: SqliteDatabase,
): ProgressionServices {
  const workoutRepository = new SqliteWorkoutRepository(database);
  const routineRepository = new SqliteRoutineRepository({
    database,
    generateId: randomUUID,
  });
  const progressionDecisionRepository =
    new SqliteProgressionDecisionRepository(database);
  const now = (): Timestamp => new Date().toISOString();

  return {
    getWorkoutProgression: (workoutId) =>
      getWorkoutProgressionUseCase(workoutId, {
        workoutRepository,
        routineRepository,
        progressionDecisionRepository,
      }),
    keepCurrentWeight: (workoutExerciseId) =>
      keepCurrentWeightUseCase(workoutExerciseId, {
        progressionDecisionRepository,
        now,
      }),
  };
}

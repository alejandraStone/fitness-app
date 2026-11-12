import { randomUUID } from 'expo-crypto';

import {
  getWorkoutDetail as getWorkoutDetailUseCase,
  type GetWorkoutDetailResult,
} from '../application/workouts/get-workout-detail';
import {
  getWorkoutEditingContext as getWorkoutEditingContextUseCase,
  type GetWorkoutEditingContextResult,
} from '../application/workouts/get-workout-editing-context';
import {
  listWorkoutHistory as listWorkoutHistoryUseCase,
  type ListWorkoutHistoryResult,
} from '../application/workouts/list-workout-history';
import {
  listWorkoutsByMonth as listWorkoutsByMonthUseCase,
  type ListWorkoutsByMonthResult,
} from '../application/workouts/list-workouts-by-month';
import {
  prepareWorkoutRecording as prepareWorkoutRecordingUseCase,
  type PrepareWorkoutRecordingInput,
  type PrepareWorkoutRecordingResult,
} from '../application/workouts/prepare-workout-recording';
import {
  saveWorkout as saveWorkoutUseCase,
  type SaveWorkoutInput,
  type SaveWorkoutResult,
} from '../application/workouts/save-workout';
import {
  updateWorkoutActuals as updateWorkoutActualsUseCase,
  type UpdateWorkoutActualsInput,
  type UpdateWorkoutActualsResult,
} from '../application/workouts/update-workout-actuals';
import type { SqliteDatabase } from '../data/database/sqlite-database';
import { SqliteRoutineRepository } from '../data/routines/sqlite-routine-repository';
import { SqliteSchedulingRepository } from '../data/routines/sqlite-scheduling-repository';
import { SqliteWorkoutRepository } from '../data/workouts/sqlite-workout-repository';
import {
  todayDateOnly,
  type DateOnly,
  type Timestamp,
} from '../domain/routines';
import type { WorkoutId } from '../domain/workouts';

/**
 * Application-facing operations used by the workout screens.
 *
 * This is the composition boundary between presentation and the application
 * layer. Screens never access SQLite or repositories directly.
 */
export interface WorkoutServices {
  prepareWorkoutRecording: (
    input: PrepareWorkoutRecordingInput,
  ) => Promise<PrepareWorkoutRecordingResult>;
  saveWorkout: (input: SaveWorkoutInput) => Promise<SaveWorkoutResult>;
  getWorkoutDetail: (workoutId: WorkoutId) => Promise<GetWorkoutDetailResult>;
  getWorkoutEditingContext: (
    workoutId: WorkoutId,
  ) => Promise<GetWorkoutEditingContextResult>;
  updateWorkoutActuals: (
    input: UpdateWorkoutActualsInput,
  ) => Promise<UpdateWorkoutActualsResult>;
  listWorkoutHistory: () => Promise<ListWorkoutHistoryResult>;
  listWorkoutsByMonth: (
    monthDate: DateOnly,
  ) => Promise<ListWorkoutsByMonthResult>;
}

/**
 * Creates the Workout Records services for an already-open database.
 *
 * The same routine, scheduling and workout repositories used by the rest of
 * the application back these operations; no second connection is opened.
 */
export function createWorkoutServices(
  database: SqliteDatabase,
): WorkoutServices {
  const routineRepository = new SqliteRoutineRepository({
    database,
    generateId: randomUUID,
  });
  const schedulingRepository = new SqliteSchedulingRepository(database);
  const workoutRepository = new SqliteWorkoutRepository(database);
  const now = (): Timestamp => new Date().toISOString();

  return {
    prepareWorkoutRecording: (input) =>
      prepareWorkoutRecordingUseCase(input, {
        routineRepository,
        schedulingRepository,
        workoutRepository,
        today: todayDateOnly,
      }),
    saveWorkout: (input) =>
      saveWorkoutUseCase(input, {
        routineRepository,
        workoutRepository,
        generateId: randomUUID,
        now,
      }),
    getWorkoutDetail: (workoutId) =>
      getWorkoutDetailUseCase(workoutId, { workoutRepository }),
    getWorkoutEditingContext: (workoutId) =>
      getWorkoutEditingContextUseCase(workoutId, { workoutRepository }),
    updateWorkoutActuals: (input) =>
      updateWorkoutActualsUseCase(input, { workoutRepository }),
    listWorkoutHistory: () =>
      listWorkoutHistoryUseCase({ workoutRepository }),
    listWorkoutsByMonth: (monthDate) =>
      listWorkoutsByMonthUseCase(monthDate, { workoutRepository }),
  };
}

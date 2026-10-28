import { randomUUID } from 'expo-crypto';

import {
  createRoutine as createRoutineUseCase,
  type CreateRoutineInput,
  type CreateRoutineResult,
} from '../application/routines/create-routine';
import {
  deleteRoutineExercise as deleteRoutineExerciseUseCase,
  type DeleteRoutineExerciseResult,
} from '../application/routines/delete-routine-exercise';
import {
  deleteRoutine as deleteRoutineUseCase,
  type DeleteRoutineResult,
} from '../application/routines/delete-routine';
import {
  duplicateRoutine as duplicateRoutineUseCase,
  type DuplicateRoutineResult,
} from '../application/routines/duplicate-routine';
import { getRoutineById } from '../application/routines/get-routine-by-id';
import { listRoutineAssignments as listRoutineAssignmentsUseCase } from '../application/routines/list-routine-assignments';
import { listRoutines } from '../application/routines/list-routines';
import {
  removeRoutineAssignment as removeRoutineAssignmentUseCase,
  type RemoveRoutineAssignmentResult,
} from '../application/routines/remove-routine-assignment';
import {
  resolveMonthlySchedule as resolveMonthlyScheduleUseCase,
  type ResolveMonthlyScheduleResult,
} from '../application/routines/resolve-monthly-schedule';
import {
  resolveScheduledRoutineEntries as resolveScheduledRoutineEntriesUseCase,
  type ResolveScheduledRoutineEntriesResult,
} from '../application/routines/resolve-scheduled-routine-entries';
import {
  scheduleRoutineForDate as scheduleRoutineForDateUseCase,
  type RoutineScheduleMode,
  type ScheduleRoutineForDateResult,
} from '../application/routines/schedule-routine-for-date';
import {
  saveRoutineExercise as saveRoutineExerciseUseCase,
  type SaveRoutineExerciseResult,
} from '../application/routines/save-routine-exercise';
import {
  setRoutineWeekdays as setRoutineWeekdaysUseCase,
  type SetRoutineWeekdaysResult,
} from '../application/routines/set-routine-weekdays';
import {
  updateRoutine as updateRoutineUseCase,
  type UpdateRoutineInput,
  type UpdateRoutineResult,
} from '../application/routines/update-routine';
import { openAppDatabase } from '../data/database/expo-sqlite-database';
import { SqliteRoutineRepository } from '../data/routines/sqlite-routine-repository';
import { SqliteSchedulingRepository } from '../data/routines/sqlite-scheduling-repository';
import type {
  DateOnly,
  IsoWeekday,
  Routine,
  RoutineAssignment,
  RoutineAssignmentId,
  RoutineExerciseId,
  RoutineExerciseInput,
  RoutineId,
} from '../domain/routines';

/**
 * Application-facing operations used by the routines and scheduling screens.
 *
 * This is the composition boundary between presentation and the application
 * layer. Screens never access SQLite or repositories directly.
 */
export interface RoutineServices {
  listRoutines: () => Promise<Routine[]>;
  getRoutine: (routineId: RoutineId) => Promise<Routine | null>;
  createRoutine: (input: CreateRoutineInput) => Promise<CreateRoutineResult>;
  updateRoutine: (
    routineId: RoutineId,
    input: UpdateRoutineInput,
  ) => Promise<UpdateRoutineResult>;
  saveRoutineExercise: (
    routineId: RoutineId,
    exercise: RoutineExerciseInput,
    exerciseId?: RoutineExerciseId,
  ) => Promise<SaveRoutineExerciseResult>;
  deleteRoutineExercise: (
    routineId: RoutineId,
    exerciseId: RoutineExerciseId,
  ) => Promise<DeleteRoutineExerciseResult>;
  duplicateRoutine: (
    routineId: RoutineId,
    date: DateOnly,
  ) => Promise<DuplicateRoutineResult>;
  deleteRoutine: (routineId: RoutineId) => Promise<DeleteRoutineResult>;
  resolveMonthlySchedule: (
    monthStart: DateOnly,
  ) => Promise<ResolveMonthlyScheduleResult>;
  resolveScheduledRoutineEntries: (
    date: DateOnly,
  ) => Promise<ResolveScheduledRoutineEntriesResult>;
  listRoutineAssignments: (
    routineId: RoutineId,
  ) => Promise<RoutineAssignment[]>;
  scheduleRoutineForDate: (
    routineId: RoutineId,
    date: DateOnly,
    mode: RoutineScheduleMode,
    weekdays?: readonly IsoWeekday[],
  ) => Promise<ScheduleRoutineForDateResult>;
  removeRoutineAssignment: (
    assignmentId: RoutineAssignmentId,
  ) => Promise<RemoveRoutineAssignmentResult>;
  setRoutineWeekdays: (
    routineId: RoutineId,
    weekdays: readonly IsoWeekday[],
  ) => Promise<SetRoutineWeekdaysResult>;
}

let servicesPromise: Promise<RoutineServices> | null = null;

/**
 * Opens the local database once and returns the composed routine services.
 *
 * A failed initialization clears the cached promise so the error screen can
 * retry safely.
 */
export function getRoutineServices(): Promise<RoutineServices> {
  if (servicesPromise === null) {
    servicesPromise = createRoutineServices().catch((error: unknown) => {
      servicesPromise = null;
      throw error;
    });
  }

  return servicesPromise;
}

async function createRoutineServices(): Promise<RoutineServices> {
  const database = await openAppDatabase();
  const routineRepository = new SqliteRoutineRepository({
    database,
    generateId: randomUUID,
  });
  const schedulingRepository = new SqliteSchedulingRepository(database);
  const now = () => new Date().toISOString();

  return {
    listRoutines: () => listRoutines({ routineRepository }),
    getRoutine: (routineId) => getRoutineById(routineId, { routineRepository }),
    createRoutine: (input) =>
      createRoutineUseCase(input, {
        routineRepository,
        generateId: randomUUID,
        now,
      }),
    updateRoutine: (routineId, input) =>
      updateRoutineUseCase(routineId, input, {
        routineRepository,
        generateId: randomUUID,
        now,
      }),
    saveRoutineExercise: (routineId, exercise, exerciseId) =>
      saveRoutineExerciseUseCase(
        { routineId, exercise, exerciseId },
        {
          routineRepository,
          generateId: randomUUID,
          now,
        },
      ),
    deleteRoutineExercise: (routineId, exerciseId) =>
      deleteRoutineExerciseUseCase(
        { routineId, exerciseId },
        {
          routineRepository,
          generateId: randomUUID,
          now,
        },
      ),
    duplicateRoutine: (routineId, date) =>
      duplicateRoutineUseCase(
        routineId,
        { date },
        {
          routineRepository,
          generateId: randomUUID,
          now,
        },
      ),
    deleteRoutine: (routineId) =>
      deleteRoutineUseCase(routineId, { routineRepository }),
    resolveMonthlySchedule: (monthStart) =>
      resolveMonthlyScheduleUseCase(monthStart, {
        routineRepository,
        schedulingRepository,
      }),
    resolveScheduledRoutineEntries: (date) =>
      resolveScheduledRoutineEntriesUseCase(date, {
        routineRepository,
        schedulingRepository,
      }),
    listRoutineAssignments: (routineId) =>
      listRoutineAssignmentsUseCase(routineId, { schedulingRepository }),
    scheduleRoutineForDate: (routineId, date, mode, weekdays) =>
      scheduleRoutineForDateUseCase(
        {
          routineId,
          date,
          mode,
          ...(weekdays === undefined ? {} : { weekdays }),
        },
        {
          routineRepository,
          schedulingRepository,
          generateId: randomUUID,
          now,
        },
      ),
    removeRoutineAssignment: (assignmentId) =>
      removeRoutineAssignmentUseCase(assignmentId, { schedulingRepository }),
    setRoutineWeekdays: (routineId, weekdays) =>
      setRoutineWeekdaysUseCase(routineId, weekdays, {
        routineRepository,
        now,
      }),
  };
}

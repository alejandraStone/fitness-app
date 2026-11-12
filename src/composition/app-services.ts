import {
  createRoutineServices,
  type RoutineServices,
} from './routine-services';
import {
  createWorkoutServices,
  type WorkoutServices,
} from './workout-services';
import { openAppDatabase } from '../data/database/expo-sqlite-database';

/** Application services exposed to the presentation layer. */
export interface AppServices {
  routines: RoutineServices;
  workouts: WorkoutServices;
}

let servicesPromise: Promise<AppServices> | null = null;

/**
 * Opens the local database once and composes every feature's services.
 *
 * A failed initialization clears the cached promise so the provider can retry
 * safely without leaving a broken connection behind.
 */
export function getAppServices(): Promise<AppServices> {
  if (servicesPromise === null) {
    servicesPromise = createAppServices().catch((error: unknown) => {
      servicesPromise = null;
      throw error;
    });
  }

  return servicesPromise;
}

async function createAppServices(): Promise<AppServices> {
  const database = await openAppDatabase();

  return {
    routines: createRoutineServices(database),
    workouts: createWorkoutServices(database),
  };
}

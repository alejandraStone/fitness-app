import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  getAppServices,
  type AppServices,
} from '../composition/app-services';
import type { ProgressionServices } from '../composition/progression-services';
import type { RoutineServices } from '../composition/routine-services';
import type { WorkoutServices } from '../composition/workout-services';
import { ErrorState } from '../shared/ui/ErrorState';
import { LoadingState } from '../shared/ui/LoadingState';
import { Screen } from '../shared/ui/Screen';

const AppServicesContext = createContext<AppServices | null>(null);

type ProviderStatus = 'loading' | 'ready' | 'error';

/**
 * Initializes the local database and exposes every application service group
 * to the screens.
 *
 * The navigator is rendered only after initialization succeeds, so screens can
 * rely on the services being available. A failed initialization keeps the same
 * retryable error state as before.
 */
export function RoutineServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<AppServices | null>(null);
  const [status, setStatus] = useState<ProviderStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    getAppServices()
      .then((nextServices) => {
        if (active) {
          setServices(nextServices);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) {
          setServices(null);
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  if (status === 'loading') {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <LoadingState message="Preparando tus datos…" />
      </Screen>
    );
  }

  if (status === 'error' || services === null) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <ErrorState
          message="No se pudo abrir la base de datos local. Tus datos existentes no se han modificado."
          onRetry={() => {
            setStatus('loading');
            setAttempt((current) => current + 1);
          }}
        />
      </Screen>
    );
  }

  return (
    <AppServicesContext.Provider value={services}>
      {children}
    </AppServicesContext.Provider>
  );
}

/** Returns the routines application services; only valid inside the provider. */
export function useRoutineServices(): RoutineServices {
  return useAppServices().routines;
}

/** Returns the workout application services; only valid inside the provider. */
export function useWorkoutServices(): WorkoutServices {
  return useAppServices().workouts;
}

/** Returns the progression application services; only valid inside the provider. */
export function useProgressionServices(): ProgressionServices {
  return useAppServices().progression;
}

function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (services === null) {
    throw new Error(
      'Application services must be used inside RoutineServicesProvider.',
    );
  }

  return services;
}

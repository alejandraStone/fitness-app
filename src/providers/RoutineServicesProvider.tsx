import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  getRoutineServices,
  type RoutineServices,
} from '../composition/routine-services';
import { ErrorState } from '../shared/ui/ErrorState';
import { LoadingState } from '../shared/ui/LoadingState';
import { Screen } from '../shared/ui/Screen';

const RoutineServicesContext = createContext<RoutineServices | null>(null);

type ProviderStatus = 'loading' | 'ready' | 'error';

/**
 * Initializes the local database and exposes the routines application
 * services to the screens.
 *
 * The navigator is rendered only after initialization succeeds, so screens can
 * rely on the services being available.
 */
export function RoutineServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<RoutineServices | null>(null);
  const [status, setStatus] = useState<ProviderStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    getRoutineServices()
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
        <LoadingState message="Preparando tus rutinas…" />
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
    <RoutineServicesContext.Provider value={services}>
      {children}
    </RoutineServicesContext.Provider>
  );
}

/** Returns the routines application services; only valid inside the provider. */
export function useRoutineServices(): RoutineServices {
  const services = useContext(RoutineServicesContext);
  if (services === null) {
    throw new Error(
      'useRoutineServices must be used inside RoutineServicesProvider.',
    );
  }

  return services;
}

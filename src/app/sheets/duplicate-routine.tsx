import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { DateOnly, Routine } from '../../domain/routines';
import { DuplicateRoutineSheet } from '../../features/routine-management/DuplicateRoutineSheet';
import { useRoutineServices } from '../../providers/RoutineServicesProvider';
import { SheetStatus } from '../../shared/ui/SheetStatus';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'error';

/** Route host for S3: choose the date for an independent routine copy. */
export default function DuplicateRoutineSheetRoute() {
  const router = useRouter();
  const services = useRoutineServices();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [status, setStatus] = useState<LoadStatus>(
    routineId === undefined ? 'notFound' : 'loading',
  );
  const [duplicating, setDuplicating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (routineId === undefined) {
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await services.getRoutine(routineId);
      if (result === null) {
        setStatus('notFound');
        return;
      }

      setRoutine(result);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [routineId, services]);

  useEffect(() => {
    if (routineId === undefined) {
      return;
    }

    let active = true;
    services
      .getRoutine(routineId)
      .then((result) => {
        if (!active) {
          return;
        }

        if (result === null) {
          setStatus('notFound');
          return;
        }

        setRoutine(result);
        setStatus('ready');
      })
      .catch(() => {
        if (active) {
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [routineId, services]);

  const close = () => {
    if (!duplicating) {
      router.back();
    }
  };

  const duplicate = async (date: DateOnly) => {
    if (routine === null || duplicating) {
      return;
    }

    setErrorMessage(null);
    setDuplicating(true);
    try {
      const result = await services.duplicateRoutine(routine.id, date);
      if (!result.ok) {
        setErrorMessage(
          result.errors[0]?.message ?? 'No se pudo duplicar la rutina.',
        );
        return;
      }

      router.back();
    } catch {
      setErrorMessage(
        'No se pudo duplicar la rutina. Inténtalo de nuevo.',
      );
    } finally {
      setDuplicating(false);
    }
  };

  if (status === 'loading') {
    return (
      <SheetStatus
        fitToContents
        loading
        message="Cargando la rutina…"
        onClose={close}
        title="Duplicar rutina"
      />
    );
  }

  if (status === 'error') {
    return (
      <SheetStatus
        fitToContents
        message="No se pudo cargar la rutina."
        onClose={close}
        onRetry={() => {
          void load();
        }}
        title="Duplicar rutina"
      />
    );
  }

  if (status === 'notFound' || routine === null) {
    return (
      <SheetStatus
        fitToContents
        message="No se encontró la rutina."
        onClose={close}
        title="Duplicar rutina"
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: !duplicating }} />
      <DuplicateRoutineSheet
        duplicating={duplicating}
        errorMessage={errorMessage}
        onClose={close}
        onConfirm={(date) => {
          void duplicate(date);
        }}
        routineName={routine.name}
      />
    </>
  );
}

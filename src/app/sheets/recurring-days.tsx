import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { IsoWeekday, Routine } from '../../domain/routines';
import { RecurringDaysSheet } from '../../features/scheduling/RecurringDaysSheet';
import { useRoutineServices } from '../../providers/RoutineServicesProvider';
import { SheetStatus } from '../../shared/ui/SheetStatus';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'error';

/** Route host for S4: edit a routine's recurring weekdays. */
export default function RecurringDaysSheetRoute() {
  const router = useRouter();
  const services = useRoutineServices();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [status, setStatus] = useState<LoadStatus>(
    routineId === undefined ? 'notFound' : 'loading',
  );
  const [saving, setSaving] = useState(false);
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
    if (!saving) {
      router.back();
    }
  };

  const save = async (weekdays: IsoWeekday[]) => {
    if (routine === null || saving) {
      return;
    }

    setErrorMessage(null);
    setSaving(true);
    try {
      const result = await services.setRoutineWeekdays(routine.id, weekdays);
      if (!result.ok) {
        setErrorMessage(
          result.errors[0]?.message ??
            'No se pudieron guardar los días recurrentes.',
        );
        return;
      }

      router.back();
    } catch {
      setErrorMessage(
        'No se pudieron guardar los días recurrentes. Inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <SheetStatus
        fitToContents
        loading
        message="Cargando la rutina…"
        onClose={close}
        title="Días recurrentes"
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
        title="Días recurrentes"
      />
    );
  }

  if (status === 'notFound' || routine === null) {
    return (
      <SheetStatus
        fitToContents
        message="No se encontró la rutina."
        onClose={close}
        title="Días recurrentes"
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: !saving }} />
      <RecurringDaysSheet
        errorMessage={errorMessage}
        onClose={close}
        onSave={(weekdays) => {
          void save(weekdays);
        }}
        routineName={routine.name}
        saving={saving}
        weekdays={routine.weekdays}
      />
    </>
  );
}

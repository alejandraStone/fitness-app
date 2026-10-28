import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import type { ScheduledRoutineEntry } from '../../application/routines/schedule-resolution';
import type {
  DateOnly,
  IsoWeekday,
  Routine,
  RoutineId,
} from '../../domain/routines';
import { validateDateOnly } from '../../domain/routines';
import {
  AssignRoutineSheet,
  type RoutineScheduleChoice,
} from '../../features/scheduling/AssignRoutineSheet';
import { useRoutineServices } from '../../providers/RoutineServicesProvider';
import { AppButton } from '../../shared/ui/AppButton';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { SheetFooter, SheetScaffold } from '../../shared/ui/SheetScaffold';

/** Route host for S2: choose a routine and schedule it on a date. */
export default function AssignRoutineSheetRoute() {
  const router = useRouter();
  const services = useRoutineServices();
  const params = useLocalSearchParams<{ date?: string }>();
  const validation =
    params.date === undefined ? null : validateDateOnly(params.date);
  const date: DateOnly | null =
    validation !== null && validation.ok ? validation.value : null;

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [entries, setEntries] = useState<ScheduledRoutineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assigningRoutineId, setAssigningRoutineId] =
    useState<RoutineId | null>(null);

  useEffect(() => {
    if (date === null) {
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const [routineList, schedule] = await Promise.all([
          services.listRoutines(),
          services.resolveScheduledRoutineEntries(date),
        ]);
        if (!active) {
          return;
        }

        setRoutines(routineList);
        if (schedule.ok) {
          setEntries(schedule.entries);
        } else {
          setErrorMessage(
            schedule.errors[0]?.message ??
              'No se pudo cargar la planificación de esta fecha.',
          );
        }
      } catch {
        if (active) {
          setErrorMessage(
            'No se pudo cargar la planificación de esta fecha.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [date, services]);

  const close = () => {
    if (assigningRoutineId === null) {
      router.back();
    }
  };

  const createRoutine = () => {
    if (assigningRoutineId !== null) {
      return;
    }

    router.replace('/routines/new');
  };

  const assign = async (
    routineId: RoutineId,
    mode: RoutineScheduleChoice,
    weekdays: readonly IsoWeekday[],
  ) => {
    if (date === null || assigningRoutineId !== null) {
      return;
    }

    setErrorMessage(null);
    setAssigningRoutineId(routineId);
    try {
      const result = await services.scheduleRoutineForDate(
        routineId,
        date,
        mode,
        weekdays,
      );
      if (!result.ok) {
        setErrorMessage(
          result.errors[0]?.message ?? 'No se pudo planificar la rutina.',
        );
        return;
      }

      router.back();
    } catch {
      setErrorMessage(
        'No se pudo planificar la rutina. Inténtalo de nuevo.',
      );
    } finally {
      setAssigningRoutineId(null);
    }
  };

  const assignedRoutineIds = new Set(
    entries
      .filter((entry) => entry.assignment !== undefined)
      .map((entry) => entry.routine.id),
  );
  const recurringRoutineIds = new Set(
    entries
      .filter((entry) => entry.recurring)
      .map((entry) => entry.routine.id),
  );

  if (date === null) {
    return (
      <SheetScaffold
        footer={
          <SheetFooter>
            <AppButton label="Cerrar" onPress={() => router.back()} />
          </SheetFooter>
        }
        onClose={() => router.back()}
        title="Planificar rutina"
      >
        <ErrorBanner message="No se pudo abrir la planificación de esta fecha." />
      </SheetScaffold>
    );
  }

  return (
    <AssignRoutineSheet
      assignedRoutineIds={assignedRoutineIds}
      assigningRoutineId={assigningRoutineId}
      date={date}
      errorMessage={errorMessage}
      loading={loading}
      onAssign={(routineId, mode, weekdays) => {
        void assign(routineId, mode, weekdays);
      }}
      onClearError={() => setErrorMessage(null)}
      onClose={close}
      onCreateRoutine={createRoutine}
      recurringRoutineIds={recurringRoutineIds}
      routines={routines}
    />
  );
}

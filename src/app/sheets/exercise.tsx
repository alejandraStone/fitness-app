import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Portal } from 'react-native-paper';

import type {
  Routine,
  RoutineExerciseId,
  ValidatedRoutineExercise,
} from '../../domain/routines';
import { ExerciseSheet } from '../../features/routine-management/ExerciseSheet';
import { routineToFormValues } from '../../features/routine-management/routine-form-values';
import type { RoutineFormExercise } from '../../features/routine-management/types';
import { useRoutineServices } from '../../providers/RoutineServicesProvider';
import { SheetStatus } from '../../shared/ui/SheetStatus';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'exerciseNotFound' | 'error';

/** Route host for S1: add or edit one exercise entry in a routine. */
export default function ExerciseSheetRoute() {
  const router = useRouter();
  const services = useRoutineServices();
  const params = useLocalSearchParams<{
    routineId?: string;
    exerciseId?: string;
  }>();
  const routineId = params.routineId;
  const exerciseId = params.exerciseId;
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [initialValue, setInitialValue] = useState<
    RoutineFormExercise | undefined
  >(undefined);
  const [status, setStatus] = useState<LoadStatus>(
    routineId === undefined ? 'notFound' : 'loading',
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      if (exerciseId === undefined) {
        setInitialValue(undefined);
        setStatus('ready');
        return;
      }

      const exercise = routineToFormValues(result).exercises.find(
        (item) => item.id === exerciseId,
      );
      if (exercise === undefined) {
        setStatus('exerciseNotFound');
        return;
      }

      setInitialValue(exercise);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [exerciseId, routineId, services]);

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
        if (exerciseId === undefined) {
          setInitialValue(undefined);
          setStatus('ready');
          return;
        }

        const exercise = routineToFormValues(result).exercises.find(
          (item) => item.id === exerciseId,
        );
        if (exercise === undefined) {
          setStatus('exerciseNotFound');
          return;
        }

        setInitialValue(exercise);
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
  }, [exerciseId, routineId, services]);

  const busy = saving || deleting;

  const close = () => {
    if (!busy) {
      router.back();
    }
  };

  const save = async (exercise: ValidatedRoutineExercise) => {
    if (routine === null || busy) {
      return;
    }

    setErrorMessage(null);
    setSaving(true);
    try {
      const result = await services.saveRoutineExercise(
        routine.id,
        exercise,
        exerciseId,
      );
      if (!result.ok) {
        setErrorMessage(
          result.errors[0]?.message ?? 'No se pudo guardar el ejercicio.',
        );
        return;
      }

      router.back();
    } catch {
      setErrorMessage(
        'No se pudo guardar el ejercicio. Inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (routine === null || exerciseId === undefined || busy) {
      return;
    }

    const typedExerciseId: RoutineExerciseId = exerciseId;
    setErrorMessage(null);
    setDeleting(true);
    try {
      const result = await services.deleteRoutineExercise(
        routine.id,
        typedExerciseId,
      );
      if (!result.ok) {
        setErrorMessage(
          result.errors[0]?.message ?? 'No se pudo eliminar el ejercicio.',
        );
        return;
      }

      router.back();
    } catch {
      setErrorMessage(
        'No se pudo eliminar el ejercicio. Inténtalo de nuevo.',
      );
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading') {
    return (
      <SheetStatus
        loading
        message="Cargando el ejercicio…"
        onClose={close}
        title="Ejercicio"
      />
    );
  }

  if (status === 'error') {
    return (
      <SheetStatus
        message="No se pudo cargar la rutina."
        onClose={close}
        onRetry={() => {
          void load();
        }}
        title="Ejercicio"
      />
    );
  }

  if (status === 'notFound' || routine === null) {
    return (
      <SheetStatus
        message="No se encontró la rutina."
        onClose={close}
        title="Ejercicio"
      />
    );
  }

  if (status === 'exerciseNotFound') {
    return (
      <SheetStatus
        message="No se encontró el ejercicio."
        onClose={close}
        title="Editar ejercicio"
      />
    );
  }

  const sheet = (
    <ExerciseSheet
      busy={saving}
      deleteLoading={deleting}
      errorMessage={errorMessage}
      initialValue={initialValue}
      onClose={close}
      onDelete={
        exerciseId === undefined
          ? undefined
          : () => {
              void remove();
            }
      }
      onSubmit={(exercise) => {
        void save(exercise);
      }}
      routineName={routine.name}
    />
  );

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: !busy }} />
      {Platform.OS === 'web' ? (
        sheet
      ) : (
        // The root Paper portal sits behind a native formSheet. Hosting the
        // portal inside S1 keeps destructive confirmations above the sheet.
        <Portal.Host>{sheet}</Portal.Host>
      )}
    </>
  );
}

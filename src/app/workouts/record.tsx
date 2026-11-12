import {
  Stack,
  useLocalSearchParams,
  usePreventRemove,
  useRouter,
} from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  PreviousExercisePerformance,
  ValidatedWorkoutPerformance,
  WorkoutRecordingContext,
} from '../../domain/workouts';
import {
  WorkoutRecordingForm,
  type WorkoutRecordingFormHandle,
} from '../../features/workout-recording';
import { useWorkoutServices } from '../../providers/RoutineServicesProvider';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { LoadingState } from '../../shared/ui/LoadingState';
import { Screen } from '../../shared/ui/Screen';
import { SheetHeaderAction } from '../../shared/ui/SheetHeaderAction';

type RecordingStatus =
  | 'loading'
  | 'ready'
  | 'invalidDate'
  | 'notScheduled'
  | 'routineNotFound'
  | 'error'
  | 'cancelled';

interface RecordingDraft {
  context: WorkoutRecordingContext;
  previousPerformances: (PreviousExercisePerformance | null)[];
}

const PREPARE_ERROR = 'No se pudo iniciar el registro del entrenamiento.';
const SAVE_ERROR =
  'No se pudo guardar el entrenamiento. Inténtalo de nuevo.';
const CANCELLED_ERROR =
  'La rutina se eliminó mientras registrabas el entrenamiento. El registro se canceló.';
const MISSING_ROUTINE_ERROR = 'No se indicó la rutina que quieres registrar.';
const MISSING_DATE_ERROR =
  'No se indicó una fecha válida para el entrenamiento.';

/**
 * Recording route for a routine scheduled on the Home-selected date.
 *
 * The date comes from navigation parameters and cannot be changed here. The
 * draft lives only in this route's component memory; leaving discards it
 * immediately without confirmation.
 */
export default function RecordWorkoutScreen() {
  const router = useRouter();
  const services = useWorkoutServices();
  const { routineId, date } = useLocalSearchParams<{
    routineId?: string;
    date?: string;
  }>();
  const hasRoutineId = routineId !== undefined && routineId.trim() !== '';
  const hasDate = date !== undefined && date.trim() !== '';
  const initialStatus: RecordingStatus = !hasRoutineId
    ? 'routineNotFound'
    : !hasDate
      ? 'invalidDate'
      : 'loading';
  const [status, setStatus] = useState<RecordingStatus>(initialStatus);
  const [draft, setDraft] = useState<RecordingDraft | null>(null);
  const [message, setMessage] = useState(
    !hasRoutineId
      ? MISSING_ROUTINE_ERROR
      : !hasDate
        ? MISSING_DATE_ERROR
        : PREPARE_ERROR,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const formRef = useRef<WorkoutRecordingFormHandle>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (
      routineId === undefined ||
      routineId.trim() === '' ||
      date === undefined ||
      date.trim() === ''
    ) {
      return;
    }

    let active = true;

    services
      .prepareWorkoutRecording({ routineId, date })
      .then((result) => {
        if (!active) {
          return;
        }

        if (result.ok) {
          if (result.mode === 'existing') {
            router.replace({
              pathname: '/workouts/[id]',
              params: { id: result.workout.id },
            });
            return;
          }

          setDraft({
            context: result.context,
            previousPerformances: result.previousPerformances,
          });
          setSaveError(null);
          setStatus('ready');
          return;
        }

        const firstError = result.errors[0];
        setMessage(firstError?.message ?? PREPARE_ERROR);

        if (
          firstError?.code === 'schedule.date.invalid' ||
          firstError?.code === 'workout.date.future'
        ) {
          setStatus('invalidDate');
        } else if (firstError?.code === 'workout.routine.notScheduled') {
          setStatus('notScheduled');
        } else if (firstError?.code === 'workout.routine.notFound') {
          setStatus('routineNotFound');
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        if (active) {
          setMessage(PREPARE_ERROR);
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [date, reloadToken, routineId, router, services]);

  const retryLoad = useCallback(() => {
    setStatus('loading');
    setReloadToken((current) => current + 1);
  }, []);

  usePreventRemove(saving, () => {});

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const saveWorkout = useCallback(
    async (performance: ValidatedWorkoutPerformance) => {
      if (savingRef.current || draft === null || savedWorkoutId !== null) {
        return;
      }

      savingRef.current = true;
      setSaving(true);
      setSaveError(null);

      try {
        const result = await services.saveWorkout({
          context: draft.context,
          actuals: performance,
        });

        if (result.ok) {
          setSavedWorkoutId(result.workout.id);
          return;
        }

        if (result.reason === 'routineDeleted') {
          setDraft(null);
          setMessage(result.errors[0]?.message ?? CANCELLED_ERROR);
          setStatus('cancelled');
          return;
        }

        setSaveError(
          result.errors.length === 0
            ? SAVE_ERROR
            : result.errors.map((error) => `• ${error.message}`).join('\n'),
        );
      } catch {
        setSaveError(SAVE_ERROR);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [draft, savedWorkoutId, services],
  );

  useEffect(() => {
    if (savedWorkoutId === null || saving) {
      return;
    }

    router.replace({
      pathname: '/workouts/[id]',
      params: { id: savedWorkoutId },
    });
  }, [router, savedWorkoutId, saving]);

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState message="Preparando el registro…" />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <ErrorState message={message} onRetry={retryLoad} />
      </Screen>
    );
  }

  if (status === 'invalidDate') {
    return (
      <Screen>
        <EmptyState
          actionLabel="Volver"
          message={message}
          onAction={leave}
          title="Fecha no válida"
        />
      </Screen>
    );
  }

  if (status === 'notScheduled') {
    return (
      <Screen>
        <EmptyState
          actionLabel="Volver"
          message={message}
          onAction={leave}
          title="Rutina no programada"
        />
      </Screen>
    );
  }

  if (status === 'routineNotFound') {
    return (
      <Screen>
        <EmptyState
          actionLabel="Volver"
          message={message}
          onAction={leave}
          title="Rutina no encontrada"
        />
      </Screen>
    );
  }

  if (status === 'cancelled') {
    return (
      <Screen>
        <EmptyState
          actionLabel="Volver"
          message={message}
          onAction={leave}
          title="Registro cancelado"
        />
      </Screen>
    );
  }

  if (draft === null) {
    return (
      <Screen>
        <ErrorState message={PREPARE_ERROR} onRetry={retryLoad} />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: !saving,
          headerRight: () => (
            <SheetHeaderAction
              disabled={saving}
              label="Guardar"
              loading={saving}
              onPress={() => {
                formRef.current?.submit();
              }}
              primary
            />
          ),
        }}
      />
      <Screen>
        <WorkoutRecordingForm
          context={draft.context}
          onSubmit={(performance) => {
            void saveWorkout(performance);
          }}
          previousPerformances={draft.previousPerformances}
          ref={formRef}
          submitError={saveError}
          submitting={saving}
        />
      </Screen>
    </>
  );
}

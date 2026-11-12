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
  Workout,
  WorkoutRecordingContext,
} from '../../../domain/workouts';
import {
  createEditingContext,
  createEditingFormValues,
  WorkoutRecordingForm,
  type WorkoutFormValues,
  type WorkoutRecordingFormHandle,
} from '../../../features/workout-recording';
import { useWorkoutServices } from '../../../providers/RoutineServicesProvider';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { Screen } from '../../../shared/ui/Screen';
import { SheetHeaderAction } from '../../../shared/ui/SheetHeaderAction';

type EditStatus = 'loading' | 'ready' | 'notFound' | 'error';

interface WorkoutEditDraft {
  workout: Workout;
  context: WorkoutRecordingContext;
  initialValues: WorkoutFormValues;
  previousPerformances: (PreviousExercisePerformance | null)[];
}

const LOAD_ERROR = 'No se pudo cargar el entrenamiento para editarlo.';
const SAVE_ERROR =
  'No se pudo guardar el entrenamiento. Inténtalo de nuevo.';

/**
 * Edits only the actual weights and repetitions of a saved workout.
 *
 * The form uses the persisted snapshot, so the date, routine and exercise
 * configuration, planned values and set count cannot change here.
 */
export default function EditWorkoutScreen() {
  const router = useRouter();
  const services = useWorkoutServices();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [status, setStatus] = useState<EditStatus>(
    id === undefined ? 'notFound' : 'loading',
  );
  const [draft, setDraft] = useState<WorkoutEditDraft | null>(null);
  const [loadError, setLoadError] = useState(LOAD_ERROR);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const formRef = useRef<WorkoutRecordingFormHandle>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (id === undefined) {
      return;
    }

    let active = true;

    services
      .getWorkoutEditingContext(id)
      .then((result) => {
        if (!active) {
          return;
        }

        if (result.ok) {
          setDraft({
            workout: result.workout,
            context: createEditingContext(result.workout),
            initialValues: createEditingFormValues(result.workout),
            previousPerformances: result.previousPerformances,
          });
          setSaveError(null);
          setStatus('ready');
          return;
        }

        if (result.errors.some((error) => error.code === 'workout.notFound')) {
          setDraft(null);
          setStatus('notFound');
          return;
        }

        setLoadError(result.errors[0]?.message ?? LOAD_ERROR);
        setStatus('error');
      })
      .catch(() => {
        if (active) {
          setLoadError(LOAD_ERROR);
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [id, reloadToken, services]);

  usePreventRemove(saving, () => {});

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/workouts/history');
    }
  }, [router]);

  const saveChanges = useCallback(
    async (performance: ValidatedWorkoutPerformance) => {
      if (savingRef.current || draft === null || saved) {
        return;
      }

      savingRef.current = true;
      setSaving(true);
      setSaveError(null);

      const candidate: Workout = {
        ...draft.workout,
        exercises: draft.workout.exercises.map((exercise, exerciseIndex) => ({
          ...exercise,
          sets: exercise.sets.map((set, setIndex) => ({
            ...set,
            weightKg: performance[exerciseIndex].sets[setIndex].weightKg,
            reps: performance[exerciseIndex].sets[setIndex].reps,
          })),
        })),
      };

      try {
        const result = await services.updateWorkoutActuals({
          workout: candidate,
        });

        if (result.ok) {
          setSaved(true);
          return;
        }

        if (result.reason === 'notFound') {
          setDraft(null);
          setStatus('notFound');
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
    [draft, saved, services],
  );

  useEffect(() => {
    if (!saved || saving || id === undefined) {
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/workouts/[id]',
        params: { id },
      });
    }
  }, [id, router, saved, saving]);

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState message="Cargando entrenamiento…" />
      </Screen>
    );
  }

  if (status === 'notFound') {
    return (
      <Screen>
        <EmptyState
          actionLabel="Volver"
          message="Este entrenamiento ya no existe."
          onAction={leave}
          title="Entrenamiento no encontrado"
        />
      </Screen>
    );
  }

  if (status === 'error' || draft === null) {
    return (
      <Screen>
        <ErrorState
          message={loadError}
          onRetry={() => {
            setStatus('loading');
            setReloadToken((current) => current + 1);
          }}
        />
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
          initialValues={draft.initialValues}
          onSubmit={(performance) => {
            void saveChanges(performance);
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

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Workout } from '../../../domain/workouts';
import { WorkoutDetailView } from '../../../features/workout-detail';
import { useWorkoutServices } from '../../../providers/RoutineServicesProvider';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { Screen } from '../../../shared/ui/Screen';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'error';

const LOAD_ERROR = 'No se pudo cargar el entrenamiento.';

/**
 * Route for a saved workout's historical record.
 *
 * Detail reloads on focus so a future edit flow can return here with updated
 * actual values. The screen is readable even when the source routine no longer
 * exists because it only reads the saved snapshot.
 */
export default function WorkoutDetailScreen() {
  const router = useRouter();
  const services = useWorkoutServices();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState(LOAD_ERROR);

  const loadWorkout = useCallback(async () => {
    if (id === undefined) {
      setStatus('notFound');
      return;
    }

    setStatus((current) => (current === 'ready' ? current : 'loading'));

    try {
      const result = await services.getWorkoutDetail(id);
      if (result.ok) {
        setWorkout(result.workout);
        setStatus('ready');
        return;
      }

      if (result.errors.some((error) => error.code === 'workout.notFound')) {
        setWorkout(null);
        setStatus('notFound');
        return;
      }

      setErrorMessage(result.errors[0]?.message ?? LOAD_ERROR);
      setStatus('error');
    } catch {
      setErrorMessage(LOAD_ERROR);
      setStatus('error');
    }
  }, [id, services]);

  useFocusEffect(
    useCallback(() => {
      void loadWorkout();
    }, [loadWorkout]),
  );

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/workouts/history');
    }
  }, [router]);

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

  if (status === 'error' || workout === null) {
    return (
      <Screen>
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void loadWorkout();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <WorkoutDetailView
        onEdit={() => {
          router.push({
            pathname: '/workouts/[id]/edit',
            params: { id: workout.id },
          });
        }}
        workout={workout}
      />
    </Screen>
  );
}

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import type { WorkoutSummary } from '../../domain/workouts';
import { WorkoutHistoryList } from '../../features/workout-history';
import { useWorkoutServices } from '../../providers/RoutineServicesProvider';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { LoadingState } from '../../shared/ui/LoadingState';
import { Screen } from '../../shared/ui/Screen';

type LoadStatus = 'loading' | 'ready' | 'error';

const LOAD_ERROR =
  'No se pudieron cargar los entrenamientos. Inténtalo de nuevo.';

/**
 * Workout History secondary screen.
 *
 * Lists saved workouts grouped by month, newest first. Scheduled routines that
 * were never recorded are never part of this data.
 */
export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const services = useWorkoutServices();
  const [summaries, setSummaries] = useState<WorkoutSummary[] | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState(LOAD_ERROR);

  const loadHistory = useCallback(async () => {
    setStatus((current) => (current === 'ready' ? current : 'loading'));

    try {
      const result = await services.listWorkoutHistory();
      if (result.ok) {
        setSummaries(result.summaries);
        setStatus('ready');
        return;
      }

      setErrorMessage(result.errors[0]?.message ?? LOAD_ERROR);
      setStatus('error');
    } catch {
      setErrorMessage(LOAD_ERROR);
      setStatus('error');
    }
  }, [services]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState message="Cargando historial…" />
      </Screen>
    );
  }

  if (status === 'error' || summaries === null) {
    return (
      <Screen>
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void loadHistory();
          }}
        />
      </Screen>
    );
  }

  if (summaries.length === 0) {
    return (
      <Screen>
        <EmptyState
          message="Cuando guardes un entrenamiento, aparecerá aquí agrupado por mes."
          title="Sin entrenamientos"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <WorkoutHistoryList
        onOpenWorkout={(workoutId) => {
          router.push({
            pathname: '/workouts/[id]',
            params: { id: workoutId },
          });
        }}
        summaries={summaries}
      />
    </Screen>
  );
}

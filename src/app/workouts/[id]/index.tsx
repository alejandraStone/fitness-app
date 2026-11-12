import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { ProgressionRecommendation } from '../../../domain/progression';
import type { Workout, WorkoutExerciseId } from '../../../domain/workouts';
import { ProgressionRecommendationCard } from '../../../features/progression';
import { WorkoutDetailView } from '../../../features/workout-detail';
import {
  useProgressionServices,
  useWorkoutServices,
} from '../../../providers/RoutineServicesProvider';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { Screen } from '../../../shared/ui/Screen';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'error';

const LOAD_ERROR = 'No se pudo cargar el entrenamiento.';
const DECISION_ERROR =
  'No se pudo guardar tu decisión. Inténtalo de nuevo.';

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
  const progressionServices = useProgressionServices();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState(LOAD_ERROR);
  const [recommendations, setRecommendations] = useState<
    ProgressionRecommendation[]
  >([]);
  const [savingWorkoutExerciseId, setSavingWorkoutExerciseId] =
    useState<WorkoutExerciseId | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const progressionRequest = useRef(0);

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

  const loadProgression = useCallback(async () => {
    const requestId = progressionRequest.current + 1;
    progressionRequest.current = requestId;
    setRecommendations([]);
    setDecisionError(null);

    if (id === undefined) {
      return;
    }

    try {
      const result = await progressionServices.getWorkoutProgression(id);
      if (progressionRequest.current !== requestId) {
        return;
      }

      setRecommendations(result.ok ? result.recommendations : []);
    } catch {
      if (progressionRequest.current === requestId) {
        setRecommendations([]);
      }
    }
  }, [id, progressionServices]);

  const keepWeight = useCallback(
    async (workoutExerciseId: WorkoutExerciseId) => {
      if (savingWorkoutExerciseId !== null) {
        return;
      }

      setSavingWorkoutExerciseId(workoutExerciseId);
      setDecisionError(null);

      try {
        const result =
          await progressionServices.keepCurrentWeight(workoutExerciseId);

        if (result.ok) {
          setRecommendations((current) =>
            current.filter(
              (recommendation) =>
                recommendation.workoutExerciseId !== workoutExerciseId,
            ),
          );
          return;
        }

        setDecisionError(result.errors[0]?.message ?? DECISION_ERROR);
      } catch {
        setDecisionError(DECISION_ERROR);
      } finally {
        setSavingWorkoutExerciseId(null);
      }
    },
    [progressionServices, savingWorkoutExerciseId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadWorkout();
      void loadProgression();
    }, [loadProgression, loadWorkout]),
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
        progressionCard={
          <ProgressionRecommendationCard
            errorMessage={decisionError}
            onKeepWeight={keepWeight}
            onReviewWeight={() => {
              router.push({
                pathname: '/routines/[id]',
                params: { id: workout.routineId },
              });
            }}
            recommendations={recommendations}
            savingWorkoutExerciseId={savingWorkoutExerciseId}
          />
        }
        workout={workout}
      />
    </Screen>
  );
}

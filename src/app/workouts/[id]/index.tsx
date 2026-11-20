import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ProgressionRecommendation } from '../../../domain/progression';
import type { Workout, WorkoutExerciseId } from '../../../domain/workouts';
import {
  IncreaseWeightDialog,
  ProgressionSection,
  type ProgressionStatus,
} from '../../../features/progression';
import {
  WorkoutDetailHeader,
  WorkoutDetailView,
  WorkoutSummaryBackdrop,
} from '../../../features/workout-detail';
import {
  useProgressionServices,
  useRoutineServices,
  useWorkoutServices,
} from '../../../providers/RoutineServicesProvider';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { workoutSummaryColors } from '../../../shared/ui/theme';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'error';

const LOAD_ERROR = 'No se pudo cargar el entrenamiento.';
const DECISION_ERROR =
  'No se pudo guardar tu decisión. Inténtalo de nuevo.';
const INCREASE_ERROR =
  'No se pudo actualizar el peso. Inténtalo de nuevo.';

/**
 * Route for a saved workout's historical record.
 *
 * Detail reloads on focus so edits, routine changes and progression decisions
 * appear immediately. The screen is readable even when the source routine no
 * longer exists because it only reads the saved snapshot.
 */
export default function WorkoutDetailScreen() {
  const router = useRouter();
  const services = useWorkoutServices();
  const routineServices = useRoutineServices();
  const progressionServices = useProgressionServices();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState(LOAD_ERROR);
  const [recommendations, setRecommendations] = useState<
    ProgressionRecommendation[]
  >([]);
  const [progressionStatus, setProgressionStatus] =
    useState<ProgressionStatus>('loading');
  const [savingWorkoutExerciseId, setSavingWorkoutExerciseId] =
    useState<WorkoutExerciseId | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [increaseTarget, setIncreaseTarget] =
    useState<ProgressionRecommendation | null>(null);
  const [increaseError, setIncreaseError] = useState<string | null>(null);
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
    setProgressionStatus('loading');
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

      if (result.ok) {
        setRecommendations(result.recommendations);
        setProgressionStatus('ready');
        return;
      }

      setRecommendations([]);
      setProgressionStatus('error');
    } catch {
      if (progressionRequest.current === requestId) {
        setRecommendations([]);
        setProgressionStatus('error');
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

  const openIncreaseWeight = useCallback(
    (recommendation: ProgressionRecommendation) => {
      setIncreaseTarget(recommendation);
      setIncreaseError(null);
    },
    [],
  );

  const closeIncreaseWeight = useCallback(() => {
    setIncreaseTarget(null);
    setIncreaseError(null);
  }, []);

  const increaseWeight = useCallback(
    async (weightKg: number) => {
      if (
        increaseTarget === null ||
        workout === null ||
        savingWorkoutExerciseId !== null
      ) {
        return;
      }

      const target = increaseTarget;
      setSavingWorkoutExerciseId(target.workoutExerciseId);
      setIncreaseError(null);

      try {
        const routine = await routineServices.getRoutine(workout.routineId);
        if (routine === null) {
          setIncreaseError(INCREASE_ERROR);
          return;
        }

        const routineExercise = routine.exercises.find(
          (exercise) => exercise.id === target.routineExerciseId,
        );
        if (routineExercise === undefined) {
          setIncreaseError(INCREASE_ERROR);
          return;
        }

        const result = await routineServices.saveRoutineExercise(
          routine.id,
          {
            name: routineExercise.name,
            targetSets: routineExercise.targetSets,
            targetRepsMin: routineExercise.targetRepsMin,
            targetRepsMax: routineExercise.targetRepsMax,
            targetWeightKg: weightKg,
            ...(routineExercise.notes === undefined
              ? {}
              : { notes: routineExercise.notes }),
          },
          routineExercise.id,
        );

        if (!result.ok) {
          setIncreaseError(INCREASE_ERROR);
          return;
        }

        setRecommendations((current) =>
          current.filter(
            (recommendation) =>
              recommendation.workoutExerciseId !== target.workoutExerciseId,
          ),
        );
        setIncreaseTarget(null);
      } catch {
        setIncreaseError(INCREASE_ERROR);
      } finally {
        setSavingWorkoutExerciseId(null);
      }
    },
    [increaseTarget, routineServices, savingWorkoutExerciseId, workout],
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

  const openEdit = useCallback(() => {
    if (workout === null) {
      return;
    }

    router.push({
      pathname: '/workouts/[id]/edit',
      params: { id: workout.id },
    });
  }, [router, workout]);

  const content =
    status === 'loading' ? (
      <View style={styles.state}>
        <LoadingState message="Cargando entrenamiento…" />
      </View>
    ) : status === 'notFound' ? (
      <View style={styles.state}>
        <EmptyState
          actionLabel="Volver"
          message="Este entrenamiento ya no existe."
          onAction={leave}
          title="Entrenamiento no encontrado"
        />
      </View>
    ) : status === 'error' || workout === null ? (
      <View style={styles.state}>
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void loadWorkout();
          }}
        />
      </View>
    ) : (
      <WorkoutDetailView
        onFinish={leave}
        progressionSection={
          <ProgressionSection
            errorMessage={decisionError}
            onIncreaseWeight={openIncreaseWeight}
            onKeepWeight={keepWeight}
            recommendations={recommendations}
            savingWorkoutExerciseId={savingWorkoutExerciseId}
            status={progressionStatus}
          />
        }
        workout={workout}
      />
    );

  return (
    <View style={styles.root}>
      <WorkoutSummaryBackdrop />
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.safe}
      >
        <WorkoutDetailHeader
          onBack={leave}
          onEdit={status === 'ready' && workout !== null ? openEdit : undefined}
        />
        {content}
      </SafeAreaView>

      {increaseTarget === null ? null : (
        <IncreaseWeightDialog
          errorMessage={increaseError}
          key={increaseTarget.workoutExerciseId}
          loading={
            savingWorkoutExerciseId === increaseTarget.workoutExerciseId
          }
          onCancel={closeIncreaseWeight}
          onClearError={() => {
            setIncreaseError(null);
          }}
          onConfirm={(weightKg) => {
            void increaseWeight(weightKg);
          }}
          recommendation={increaseTarget}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: workoutSummaryColors.background,
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  state: {
    flex: 1,
  },
});

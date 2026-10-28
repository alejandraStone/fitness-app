import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import type { Routine } from '../../../domain/routines';
import { RoutineSummaryCard } from '../../../entities/routine/RoutineSummaryCard';
import { useRoutineServices } from '../../../providers/RoutineServicesProvider';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { Screen } from '../../../shared/ui/Screen';
import { spacing } from '../../../shared/ui/theme';

type LoadStatus = 'loading' | 'ready' | 'error';

/** Routines main screen: list, empty state and creation entry point. */
export default function RoutinesScreen() {
  const router = useRouter();
  const services = useRoutineServices();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');

  const loadRoutines = useCallback(async () => {
    setStatus('loading');
    try {
      const items = await services.listRoutines();
      setRoutines(items);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [services]);

  useFocusEffect(
    useCallback(() => {
      void loadRoutines();
    }, [loadRoutines]),
  );

  const openCreate = () => router.push('/routines/new');

  const openDuplicate = (routineId: string) => {
    router.push({
      pathname: '/sheets/duplicate-routine',
      params: { routineId },
    });
  };

  const openEditName = (routineId: string) => {
    router.push({
      pathname: '/routines/[id]/edit',
      params: { id: routineId },
    });
  };

  if (status === 'loading') {
    return (
      <Screen edges={['left', 'right']}>
        <LoadingState message="Cargando rutinas…" />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen edges={['left', 'right']}>
        <ErrorState
          message="No se pudieron cargar tus rutinas."
          onRetry={() => {
            void loadRoutines();
          }}
        />
      </Screen>
    );
  }

  if (routines.length === 0) {
    return (
      <Screen edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.emptyContent}>
          <EmptyState
            actionLabel="Crear rutina"
            message="Crea tu primera rutina y añade los ejercicios que quieres entrenar."
            onAction={openCreate}
            title="Aún no hay rutinas"
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {routines.map((routine) => (
          <RoutineSummaryCard
            key={routine.id}
            onDuplicate={() => openDuplicate(routine.id)}
            onEditName={() => openEditName(routine.id)}
            onPress={() =>
              router.push({
                pathname: '/routines/[id]',
                params: { id: routine.id },
              })
            }
            routine={routine}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
});

import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import type { ValidatedRoutineExercise } from '../../domain/routines';
import { SheetHeaderAction } from '../../shared/ui/SheetHeaderAction';
import { SheetScaffold } from '../../shared/ui/SheetScaffold';
import { colors } from '../../shared/ui/theme';
import { ExerciseForm, type ExerciseFormHandle } from './ExerciseForm';
import type { RoutineFormExercise } from './types';

export interface ExerciseSheetProps {
  routineName: string;
  initialValue?: RoutineFormExercise;
  busy?: boolean;
  deleteLoading?: boolean;
  errorMessage?: string | null;
  embedded?: boolean;
  /** Omit it when creating a new entry. */
  onDelete?: () => void;
  onSubmit: (exercise: ValidatedRoutineExercise) => void;
  onClose: () => void;
}

/** S1: shared exercise editor for route and embedded routine-draft flows. */
export function ExerciseSheet({
  routineName,
  initialValue,
  busy = false,
  deleteLoading = false,
  errorMessage = null,
  embedded = false,
  onDelete,
  onSubmit,
  onClose,
}: ExerciseSheetProps) {
  const formRef = useRef<ExerciseFormHandle>(null);
  const isBusy = busy || deleteLoading;
  const dismissable = !isBusy;

  return (
    <SheetScaffold
      dismissable={dismissable}
      embedded={embedded}
      headerLeft={
        <SheetHeaderAction
          disabled={!dismissable}
          label="Cancelar"
          onPress={onClose}
        />
      }
      headerRight={
        <SheetHeaderAction
          disabled={!dismissable}
          label="Guardar"
          loading={isBusy}
          onPress={() => formRef.current?.submit()}
          primary
        />
      }
      onClose={onClose}
      title={initialValue === undefined ? 'Añadir ejercicio' : 'Editar ejercicio'}
    >
      <Text style={styles.context} variant="bodySmall">
        {routineName}
      </Text>
      <ExerciseForm
        autoFocus={embedded}
        busy={busy}
        deleteLoading={deleteLoading}
        errorMessage={errorMessage}
        initialValue={initialValue}
        onDelete={onDelete}
        onSubmit={onSubmit}
        ref={formRef}
      />
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  context: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});

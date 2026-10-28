import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

import type {
  ValidatedRoutineExercise,
  ValidationError,
} from '../../domain/routines';
import { AppTextInput } from '../../shared/ui/AppTextInput';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { colors, spacing } from '../../shared/ui/theme';
import { validateExerciseFormValues } from './exercise-form-values';
import type { RoutineFormExercise } from './types';

export interface ExerciseFormHandle {
  submit: () => void;
}

export interface ExerciseFormProps {
  initialValue?: RoutineFormExercise;
  busy?: boolean;
  /** Operation-level failure that is not attached to one field. */
  errorMessage?: string | null;
  autoFocus?: boolean;
  /** Existing entry to remove. Omit it when creating a new entry. */
  onDelete?: () => void;
  deleteLoading?: boolean;
  onSubmit: (exercise: ValidatedRoutineExercise) => void;
}

/**
 * Shared exercise fields and local validation.
 *
 * The parent owns persistence. This component keeps the immediate field
 * validation, pending state and destructive confirmation consistent between
 * the embedded routine draft and the standalone route sheet.
 */
export const ExerciseForm = forwardRef<ExerciseFormHandle, ExerciseFormProps>(
  function ExerciseForm(
    {
      initialValue,
      busy = false,
      errorMessage,
      autoFocus = false,
      onDelete,
      deleteLoading = false,
      onSubmit,
    }: ExerciseFormProps,
    ref,
  ) {
    const [name, setName] = useState(initialValue?.name ?? '');
    const [notes, setNotes] = useState(initialValue?.notes ?? '');
    const [targetSets, setTargetSets] = useState(
      initialValue === undefined ? '3' : String(initialValue.targetSets),
    );
    const [targetRepsMin, setTargetRepsMin] = useState(
      initialValue === undefined ? '8' : String(initialValue.targetRepsMin),
    );
    const [targetRepsMax, setTargetRepsMax] = useState(
      initialValue === undefined ? '12' : String(initialValue.targetRepsMax),
    );
    const [targetWeightKg, setTargetWeightKg] = useState(
      initialValue === undefined ? '0' : String(initialValue.targetWeightKg),
    );
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [deleteVisible, setDeleteVisible] = useState(false);

    const fieldError = (field: string): string | undefined =>
      errors.find((error) => error.field === field)?.message;

    const isBusy = busy || deleteLoading;

    const handleSave = useCallback(() => {
      const result = validateExerciseFormValues({
        name,
        notes,
        targetSets,
        targetRepsMin,
        targetRepsMax,
        targetWeightKg,
      });

      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      setErrors([]);
      onSubmit(result.value);
    }, [
      name,
      notes,
      onSubmit,
      targetRepsMax,
      targetRepsMin,
      targetSets,
      targetWeightKg,
    ]);

    useImperativeHandle(ref, () => ({ submit: handleSave }), [handleSave]);

    return (
      <View style={styles.form}>
        {errorMessage !== undefined && errorMessage !== null ? (
          <ErrorBanner message={errorMessage} />
        ) : null}

        <AppTextInput
          autoFocus={autoFocus}
          editable={!isBusy}
          error={fieldError('name')}
          label="Nombre del ejercicio"
          onChangeText={(value) => {
            setName(value);
            setErrors([]);
          }}
          placeholder="p. ej. Sentadilla"
          value={name}
        />

        <View style={styles.row}>
          <View style={styles.column}>
            <AppTextInput
              editable={!isBusy}
              error={fieldError('targetSets')}
              keyboardType="number-pad"
              label="Series"
              onChangeText={(value) => {
                setTargetSets(value);
                setErrors([]);
              }}
              value={targetSets}
            />
          </View>
          <View style={styles.column}>
            <AppTextInput
              editable={!isBusy}
              error={fieldError('targetWeightKg')}
              keyboardType="decimal-pad"
              label="Peso (kg)"
              onChangeText={(value) => {
                setTargetWeightKg(value);
                setErrors([]);
              }}
              value={targetWeightKg}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <AppTextInput
              editable={!isBusy}
              error={fieldError('targetRepsMin')}
              keyboardType="number-pad"
              label="Reps mínimas"
              onChangeText={(value) => {
                setTargetRepsMin(value);
                setErrors([]);
              }}
              value={targetRepsMin}
            />
          </View>
          <View style={styles.column}>
            <AppTextInput
              editable={!isBusy}
              error={fieldError('targetRepsMax')}
              keyboardType="number-pad"
              label="Reps máximas"
              onChangeText={(value) => {
                setTargetRepsMax(value);
                setErrors([]);
              }}
              value={targetRepsMax}
            />
          </View>
        </View>

        <AppTextInput
          editable={!isBusy}
          error={fieldError('notes')}
          label="Nota (opcional)"
          multiline
          onChangeText={(value) => {
            setNotes(value);
            setErrors([]);
          }}
          placeholder="Técnica, tempo, etc."
          value={notes}
        />

        {onDelete !== undefined ? (
          <View style={styles.deleteSection}>
            <Button
              disabled={isBusy}
              icon="trash-can-outline"
              loading={deleteLoading}
              mode="text"
              onPress={() => {
                Keyboard.dismiss();
                setDeleteVisible(true);
              }}
              textColor={colors.danger}
            >
              Eliminar ejercicio
            </Button>
          </View>
        ) : null}

        <ConfirmDialog
          confirmLabel="Eliminar"
          loading={deleteLoading}
          message="Se quitará de esta rutina. Los entrenamientos guardados no cambian."
          onCancel={() => setDeleteVisible(false)}
          onConfirm={() => {
            setDeleteVisible(false);
            onDelete?.();
          }}
          title="¿Eliminar este ejercicio?"
          visible={deleteVisible}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  column: {
    flex: 1,
  },
  deleteSection: {
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
});

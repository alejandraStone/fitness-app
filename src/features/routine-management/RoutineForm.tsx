import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';

import {
  validateRoutineName,
  type IsoWeekday,
  type ValidatedRoutineExercise,
} from '../../domain/routines';
import {
  formatRepRange,
  formatSetCount,
  formatWeightKg,
} from '../../entities/routine/format';
import { WeekdaySelector } from '../../entities/routine/WeekdaySelector';
import { AppButton } from '../../shared/ui/AppButton';
import { AppTextInput } from '../../shared/ui/AppTextInput';
import { Card } from '../../shared/ui/Card';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { colors, fontSizes, spacing } from '../../shared/ui/theme';
import { ExerciseSheet } from './ExerciseSheet';
import type {
  RoutineFormError,
  RoutineFormExercise,
  RoutineFormSubmitResult,
  RoutineFormValues,
} from './types';

export type RoutineFormPresentation = 'screen' | 'sheet';

export interface RoutineFormHandle {
  submit: () => void;
}

export interface RoutineFormProps {
  submitLabel: string;
  initialValues?: RoutineFormValues;
  /**
   * Creation mode shows only the routine name and optional planning. Saving the
   * first exercise persists the routine with that exercise; the exercise draft
   * is never rendered in the creation form.
   */
  creationMode?: boolean;
  /**
   * Screen forms scroll their own content and keep actions at the bottom.
   * Sheet forms leave scrolling and header actions to the sheet host. The
   * creation sheet uses this mode.
   */
  presentation?: RoutineFormPresentation;
  onSubmit: (values: RoutineFormValues) => Promise<RoutineFormSubmitResult>;
  onCancel: () => void;
  /** Reports the final-save busy state so the route can lock dismissal. */
  onSubmittingChange?: (submitting: boolean) => void;
}

type EditorState = { mode: 'add' } | { mode: 'edit'; index: number };

/**
 * Create/edit form for a routine and its configured exercises.
 *
 * Creation mode collects the name and optional planning only. The first
 * exercise is captured through the embedded S1 and persisted together with the
 * routine; editing keeps the full exercise configuration in the form.
 *
 * All business validation is delegated to the application layer when saving.
 * The nested exercise form uses the domain validator for immediate feedback
 * and never replaces the final validation performed by the use case.
 */
export const RoutineForm = forwardRef<RoutineFormHandle, RoutineFormProps>(
  function RoutineForm(
    {
      submitLabel,
      initialValues,
      creationMode = false,
      presentation = 'screen',
      onSubmit,
      onCancel,
      onSubmittingChange,
    }: RoutineFormProps,
    ref,
  ) {
    const [name, setName] = useState(initialValues?.name ?? '');
    const [weekdays, setWeekdays] = useState<IsoWeekday[]>(
      initialValues?.weekdays ?? [],
    );
    const [exercises, setExercises] = useState<RoutineFormExercise[]>(
      initialValues?.exercises ?? [],
    );
    const [errors, setErrors] = useState<RoutineFormError[]>([]);
    const [exerciseError, setExerciseError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editor, setEditor] = useState<EditorState | null>(null);
    const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(
      null,
    );

    const nameError = errors.find((error) => error.field === 'name')?.message;
    const generalErrors = errors.filter(
      (error) =>
        error.field !== 'name' &&
        !error.field.startsWith('exercises[') &&
        !(creationMode && error.field === 'exercises'),
    );
    const generalErrorMessage =
      generalErrors.length > 0
        ? generalErrors.map((error) => `• ${error.message}`).join('\n')
        : null;

    const clearErrors = () => {
      setErrors((current) => (current.length === 0 ? current : []));
    };

    const closeEditor = () => {
      Keyboard.dismiss();
      setExerciseError(null);
      setEditor(null);
    };

    const saveFirstExercise = async (exercise: ValidatedRoutineExercise) => {
      if (isSubmitting) {
        return;
      }

      setErrors([]);
      setExerciseError(null);
      setIsSubmitting(true);
      onSubmittingChange?.(true);

      try {
        const result = await onSubmit({
          name,
          weekdays,
          exercises: [exercise],
        });
        if (!result.ok) {
          setErrors(result.errors);
          setExerciseError(
            result.errors.map((error) => error.message).join('\n'),
          );
          return;
        }

        closeEditor();
      } catch {
        const message =
          'No se pudo guardar la rutina. Inténtalo de nuevo.';
        setErrors([{ field: 'form', message }]);
        setExerciseError(message);
      } finally {
        setIsSubmitting(false);
        onSubmittingChange?.(false);
      }
    };

    const handleSaveExercise = (exercise: ValidatedRoutineExercise) => {
      if (editor === null) {
        return;
      }

      if (creationMode) {
        void saveFirstExercise(exercise);
        return;
      }

      clearErrors();
      setExercises((current) => {
        if (editor.mode === 'add') {
          return [...current, exercise];
        }

        return current.map((existing, index) => {
          if (index !== editor.index) {
            return existing;
          }

          const updated: RoutineFormExercise = { ...exercise };
          if (existing.id !== undefined) {
            updated.id = existing.id;
          }
          return updated;
        });
      });

      closeEditor();
    };

    const removeExercise = (index: number) => {
      clearErrors();
      setExercises((current) =>
        current.filter((_, entryIndex) => entryIndex !== index),
      );
    };

    const handleSubmit = useCallback(async () => {
      if (isSubmitting) {
        return;
      }

      setErrors([]);
      setExerciseError(null);

      if (creationMode) {
        const nameResult = validateRoutineName(name);
        if (!nameResult.ok) {
          setErrors(
            nameResult.errors.map((error) => ({
              field: error.field,
              message: error.message,
            })),
          );
          return;
        }

        setEditor({ mode: 'add' });
        return;
      }

      setIsSubmitting(true);
      onSubmittingChange?.(true);
      try {
        const result = await onSubmit({ name, weekdays, exercises });
        if (!result.ok) {
          setErrors(result.errors);
        }
      } catch {
        setErrors([
          {
            field: 'form',
            message: 'No se pudo guardar la rutina. Inténtalo de nuevo.',
          },
        ]);
      } finally {
        setIsSubmitting(false);
        onSubmittingChange?.(false);
      }
    }, [
      creationMode,
      exercises,
      isSubmitting,
      name,
      onSubmit,
      onSubmittingChange,
      weekdays,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          void handleSubmit();
        },
      }),
      [handleSubmit],
    );

    const formBody = (
      <>
        {generalErrorMessage !== null ? (
          <ErrorBanner message={generalErrorMessage} />
        ) : null}

        <AppTextInput
          editable={!isSubmitting}
          error={nameError}
          label="Nombre de la rutina"
          onChangeText={(value) => {
            setName(value);
            clearErrors();
          }}
          placeholder="p. ej. Piernas A"
          value={name}
        />

        <Card>
          <Text style={styles.sectionTitle}>
            {creationMode ? 'Planificación' : 'Días recurrentes'}
          </Text>
          <Text style={styles.sectionHint}>
            {creationMode
              ? 'Opcional. Elige los días en que quieres repetir esta rutina. Si no eliges ninguno, quedará sin programar y podrás asignarla más adelante desde Inicio.'
              : 'Opcional. Estos días se repiten cada semana. También puedes añadir días al planificar una fecha desde Inicio.'}
          </Text>
          <WeekdaySelector
            disabled={isSubmitting}
            onChange={(nextWeekdays) => {
              clearErrors();
              setWeekdays(nextWeekdays);
            }}
            value={weekdays}
          />
        </Card>

        {creationMode ? null : (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Ejercicios</Text>
                <Text style={styles.sectionHint}>
                  {presentation === 'sheet'
                    ? exercises.length === 0
                      ? 'Al guardar se abrirá el formulario del primer ejercicio.'
                      : 'Añade otro o guarda la rutina.'
                    : 'Se necesita al menos un ejercicio para guardar.'}
                </Text>
              </View>
              {presentation === 'screen' ? (
                <AppButton
                  accessibilityLabel="Añadir ejercicio"
                  disabled={isSubmitting}
                  label="Añadir"
                  onPress={() => setEditor({ mode: 'add' })}
                  style={styles.addButton}
                  variant="secondary"
                />
              ) : exercises.length > 0 ? (
                <Button
                  accessibilityLabel="Añadir ejercicio"
                  compact
                  contentStyle={styles.addTextButtonContent}
                  disabled={isSubmitting}
                  icon="plus"
                  mode="text"
                  onPress={() => setEditor({ mode: 'add' })}
                  textColor={colors.primary}
                >
                  Añadir otro
                </Button>
              ) : null}
            </View>

            {exercises.map((exercise, index) => (
              <ExerciseDraftCard
                disabled={isSubmitting}
                errors={errors.filter((error) =>
                  error.field.startsWith(`exercises[${index}]`),
                )}
                exercise={exercise}
                index={index}
                key={exercise.id ?? `new-${index}`}
                onEdit={() => setEditor({ mode: 'edit', index })}
                onRemove={() => setPendingRemoveIndex(index)}
              />
            ))}
          </>
        )}

        {presentation === 'screen' ? (
          <View style={styles.actions}>
            <AppButton
              label={submitLabel}
              loading={isSubmitting}
              onPress={() => {
                void handleSubmit();
              }}
            />
            <AppButton
              disabled={isSubmitting}
              label="Cancelar"
              onPress={onCancel}
              variant="secondary"
            />
          </View>
        ) : null}
      </>
    );

    const overlays = (
      <>
        {editor !== null ? (
          <ExerciseSheet
            key={editor.mode === 'edit' ? `edit-${editor.index}` : 'add'}
            busy={isSubmitting}
            embedded
            errorMessage={exerciseError}
            initialValue={
              editor.mode === 'edit' ? exercises[editor.index] : undefined
            }
            onClose={closeEditor}
            onSubmit={handleSaveExercise}
            routineName={name.trim() === '' ? 'Nueva rutina' : name.trim()}
          />
        ) : null}

        <ConfirmDialog
          confirmLabel="Quitar"
          message="Se quitará de la rutina que estás creando."
          onCancel={() => setPendingRemoveIndex(null)}
          onConfirm={() => {
            if (pendingRemoveIndex !== null) {
              removeExercise(pendingRemoveIndex);
            }
            setPendingRemoveIndex(null);
          }}
          title="¿Quitar este ejercicio?"
          visible={pendingRemoveIndex !== null}
        />
      </>
    );

    if (presentation === 'sheet') {
      return (
        <View style={styles.sheetContent}>
          {formBody}
          {overlays}
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {formBody}
        </ScrollView>
        {overlays}
      </KeyboardAvoidingView>
    );
  },
);

interface ExerciseDraftCardProps {
  exercise: RoutineFormExercise;
  index: number;
  disabled: boolean;
  errors: RoutineFormError[];
  onEdit: () => void;
  onRemove: () => void;
}

function ExerciseDraftCard({
  exercise,
  index,
  disabled,
  errors,
  onEdit,
  onRemove,
}: ExerciseDraftCardProps) {
  return (
    <Card>
      <Text style={styles.exerciseName}>
        {index + 1}. {exercise.name}
      </Text>
      <Text style={styles.exerciseMeta}>
        {formatSetCount(exercise.targetSets)} ·{' '}
        {formatRepRange(exercise.targetRepsMin, exercise.targetRepsMax)} ·{' '}
        {formatWeightKg(exercise.targetWeightKg)}
      </Text>
      {errors.map((error) => (
        <Text key={`${error.field}-${error.message}`} style={styles.errorText}>
          {error.message}
        </Text>
      ))}
      <View style={styles.cardActions}>
        <AppButton
          accessibilityLabel={`Editar ${exercise.name}`}
          disabled={disabled}
          label="Editar"
          onPress={onEdit}
          style={styles.cardAction}
          variant="secondary"
        />
        <AppButton
          accessibilityLabel={`Eliminar ${exercise.name}`}
          disabled={disabled}
          label="Eliminar"
          onPress={onRemove}
          style={styles.cardAction}
          variant="danger"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sheetContent: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  sectionHeading: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSizes.subheading,
    fontWeight: '600',
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: fontSizes.small,
    lineHeight: 20,
  },
  addButton: {
    paddingHorizontal: spacing.lg,
  },
  addTextButtonContent: {
    minHeight: 44,
  },
  exerciseName: {
    color: colors.text,
    fontSize: fontSizes.subheading,
    fontWeight: '600',
  },
  exerciseMeta: {
    color: colors.text,
    fontSize: fontSizes.small,
    lineHeight: 20,
  },
  errorText: {
    color: colors.errorText,
    fontSize: fontSizes.tiny,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cardAction: {
    minHeight: 40,
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});

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
import { Text } from 'react-native-paper';

import type {
  PreviousExercisePerformance,
  ValidatedWorkoutPerformance,
  WorkoutRecordingContext,
  WorkoutValidationError,
} from '../../domain/workouts';
import { formatWorkoutDate } from '../../entities/workout';
import { Card } from '../../shared/ui/Card';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { colors, spacing } from '../../shared/ui/theme';
import { ExerciseRecordingCard } from './ExerciseRecordingCard';
import {
  createRecordingFormValues,
  validateWorkoutFormValues,
  type WorkoutFormValues,
  type WorkoutSetFormValues,
} from './workout-form-values';

export interface WorkoutRecordingFormHandle {
  submit: () => void;
}

export interface WorkoutRecordingFormProps {
  /** Immutable snapshot captured when recording began. */
  context: WorkoutRecordingContext;
  /** Previous result per exercise, aligned with `context.exercises`. */
  previousPerformances: readonly (PreviousExercisePerformance | null)[];
  /** Optional prefilled values; defaults to planned weights and empty reps. */
  initialValues?: WorkoutFormValues;
  /** Locks every input while a save is in progress. */
  submitting?: boolean;
  /** Recoverable persistence or duplicate message shown above the form. */
  submitError?: string | null;
  onSubmit: (performance: ValidatedWorkoutPerformance) => void;
}

/**
 * Shared recording and editing form.
 *
 * The form owns the in-memory draft and validates raw text only on submit.
 * It renders exactly one row per planned set and cannot add, remove or skip
 * exercises or sets. The parent owns persistence and navigation.
 */
export const WorkoutRecordingForm = forwardRef<
  WorkoutRecordingFormHandle,
  WorkoutRecordingFormProps
>(function WorkoutRecordingForm(
  {
    context,
    previousPerformances,
    initialValues,
    submitting = false,
    submitError = null,
    onSubmit,
  },
  ref,
) {
  const [values, setValues] = useState<WorkoutFormValues>(
    () => initialValues ?? createRecordingFormValues(context),
  );
  const [errors, setErrors] = useState<WorkoutValidationError[]>([]);

  const clearFieldError = useCallback(
    (exerciseIndex: number, setIndex: number, field: 'weightKg' | 'reps') => {
      const fieldPath = `exercises[${exerciseIndex}].sets[${setIndex}].${field}`;
      setErrors((current) =>
        current.filter((error) => error.field !== fieldPath),
      );
    },
    [],
  );

  const updateSet = useCallback(
    (
      exerciseIndex: number,
      setIndex: number,
      field: 'weightKg' | 'reps',
      value: string,
    ) => {
      setValues((current) =>
        current.map((exercise, currentExerciseIndex) => {
          if (currentExerciseIndex !== exerciseIndex) {
            return exercise;
          }

          return {
            sets: exercise.sets.map((set, currentSetIndex) => {
              if (currentSetIndex !== setIndex) {
                return set;
              }

              const updated: WorkoutSetFormValues = { ...set, [field]: value };
              return updated;
            }),
          };
        }),
      );
      clearFieldError(exerciseIndex, setIndex, field);
    },
    [clearFieldError],
  );

  const handleSubmit = useCallback(() => {
    if (submitting) {
      return;
    }

    Keyboard.dismiss();
    const result = validateWorkoutFormValues(context, values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors([]);
    onSubmit(result.value);
  }, [context, onSubmit, submitting, values]);

  useImperativeHandle(
    ref,
    () => ({
      submit: handleSubmit,
    }),
    [handleSubmit],
  );

  const generalErrors = errors.filter(
    (error) =>
      !/^exercises\[\d+\]\.sets\[\d+\]\.(weightKg|reps)$/.test(error.field),
  );
  const generalErrorMessage =
    generalErrors.length === 0
      ? null
      : generalErrors.map((error) => `• ${error.message}`).join('\n');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {submitError !== null ? <ErrorBanner message={submitError} /> : null}
        {generalErrorMessage !== null ? (
          <ErrorBanner message={generalErrorMessage} />
        ) : null}

        <Card>
          <Text
            accessibilityRole="header"
            style={styles.name}
            variant="titleLarge"
          >
            {context.routineNameSnapshot}
          </Text>
          <Text
            accessibilityLabel={`Fecha del entrenamiento: ${formatWorkoutDate(
              context.date,
            )}`}
            style={styles.date}
            variant="bodyMedium"
          >
            {formatWorkoutDate(context.date)}
          </Text>
          <Text style={styles.hint} variant="bodySmall">
            Registra el peso y las repeticiones de cada serie. Las repeticiones
            son obligatorias para poder guardar.
          </Text>
        </Card>

        <View style={styles.exercises}>
          {context.exercises.map((exercise, exerciseIndex) => (
            <ExerciseRecordingCard
              editable={!submitting}
              errors={errors}
              exercise={exercise}
              index={exerciseIndex}
              key={exercise.order}
              onChangeReps={(setIndex, value) =>
                updateSet(exerciseIndex, setIndex, 'reps', value)
              }
              onChangeWeightKg={(setIndex, value) =>
                updateSet(exerciseIndex, setIndex, 'weightKg', value)
              }
              previousPerformance={previousPerformances[exerciseIndex] ?? null}
              sets={values[exerciseIndex]?.sets ?? []}
            />
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  name: {
    color: colors.text,
    fontWeight: '800',
  },
  date: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  exercises: {
    gap: spacing.md,
  },
});

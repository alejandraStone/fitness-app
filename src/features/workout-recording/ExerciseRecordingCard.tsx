import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type {
  PreviousExercisePerformance,
  WorkoutExerciseSnapshot,
  WorkoutValidationError,
} from '../../domain/workouts';
import {
  formatRepRange,
  formatSetCount,
  formatWeightKg,
} from '../../entities/routine/format';
import { Card } from '../../shared/ui/Card';
import { colors, spacing } from '../../shared/ui/theme';
import { PreviousPerformanceView } from './PreviousPerformanceView';
import { SetInputRow } from './SetInputRow';
import type { WorkoutSetFormValues } from './workout-form-values';

export interface ExerciseRecordingCardProps {
  exercise: WorkoutExerciseSnapshot;
  /** Zero-based position in the captured snapshot. */
  index: number;
  /** Raw text values for each planned set, aligned by set position. */
  sets: readonly WorkoutSetFormValues[];
  previousPerformance?: PreviousExercisePerformance | null;
  errors?: readonly WorkoutValidationError[];
  editable?: boolean;
  onChangeWeightKg: (setIndex: number, value: string) => void;
  onChangeReps: (setIndex: number, value: string) => void;
}

/**
 * Recording card for one planned exercise.
 *
 * Shows the captured plan, the previous result when available and exactly one
 * input row per planned set. The parent owns the draft, validation and
 * persistence; this component cannot add, remove or skip sets.
 */
export function ExerciseRecordingCard({
  exercise,
  index,
  sets,
  previousPerformance = null,
  errors = [],
  editable = true,
  onChangeWeightKg,
  onChangeReps,
}: ExerciseRecordingCardProps) {
  const fieldError = (
    setIndex: number,
    field: 'weightKg' | 'reps',
  ): string | undefined =>
    errors.find(
      (error) =>
        error.field === `exercises[${index}].sets[${setIndex}].${field}`,
    )?.message;

  return (
    <Card>
      <Text style={styles.name} variant="titleMedium">
        {index + 1}. {exercise.nameSnapshot}
      </Text>
      <Text style={styles.meta} variant="bodySmall">
        Planificado: {formatSetCount(exercise.plannedSets)} ·{' '}
        {formatRepRange(exercise.plannedRepsMin, exercise.plannedRepsMax)} ·{' '}
        {formatWeightKg(exercise.plannedWeightKg)}
      </Text>
      {exercise.notesSnapshot !== undefined ? (
        <Text style={styles.notes} variant="bodySmall">
          Nota: {exercise.notesSnapshot}
        </Text>
      ) : null}

      <PreviousPerformanceView performance={previousPerformance} />

      <View style={styles.sets}>
        {Array.from({ length: exercise.plannedSets }, (_, setIndex) => {
          const set = sets[setIndex] ?? { weightKg: '', reps: '' };

          return (
            <SetInputRow
              editable={editable}
              key={setIndex}
              onChangeReps={(value) => onChangeReps(setIndex, value)}
              onChangeWeightKg={(value) => onChangeWeightKg(setIndex, value)}
              reps={set.reps}
              repsError={fieldError(setIndex, 'reps')}
              setNumber={setIndex + 1}
              weightError={fieldError(setIndex, 'weightKg')}
              weightKg={set.weightKg}
            />
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    color: colors.text,
    lineHeight: 20,
  },
  notes: {
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sets: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
});

import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { WorkoutExercise, WorkoutSet } from '../../domain/workouts';
import { Card } from '../../shared/ui/Card';
import { colors, spacing } from '../../shared/ui/theme';
import { formatRepRange, formatSetCount, formatWeightKg } from '../routine/format';
import { formatRepCount, formatSetPerformance } from './format';

export interface WorkoutExerciseViewProps {
  exercise: WorkoutExercise;
  index: number;
}

/** Read-only presentation of one exercise from a saved workout. */
export function WorkoutExerciseView({
  exercise,
  index,
}: WorkoutExerciseViewProps) {
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
      <View style={styles.sets}>
        {exercise.sets.map((set) => (
          <WorkoutSetView key={set.id} set={set} />
        ))}
      </View>
    </Card>
  );
}

export interface WorkoutSetViewProps {
  set: WorkoutSet;
}

/** Read-only row with the actual weight and repetitions of one set. */
export function WorkoutSetView({ set }: WorkoutSetViewProps) {
  const performance = formatSetPerformance(set.weightKg, set.reps);

  return (
    <View
      accessibilityLabel={`Serie ${set.setNumber}: ${formatWeightKg(
        set.weightKg,
      )}, ${formatRepCount(set.reps)}`}
      accessible
      style={styles.setRow}
    >
      <Text style={styles.setNumber} variant="labelLarge">
        Serie {set.setNumber}
      </Text>
      <Text style={styles.setPerformance} variant="bodyMedium">
        {performance}
      </Text>
    </View>
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 32,
  },
  setNumber: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  setPerformance: {
    color: colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
});

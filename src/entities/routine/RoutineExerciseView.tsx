import { StyleSheet, View } from 'react-native';
import { List, Text } from 'react-native-paper';

import type { RoutineExercise } from '../../domain/routines';
import { Card } from '../../shared/ui/Card';
import { colors, spacing } from '../../shared/ui/theme';
import { formatRepRange, formatSetCount, formatWeightKg } from './format';

export interface RoutineExerciseViewProps {
  exercise: RoutineExercise;
  index: number;
  /** When provided, the card opens the exercise editor. */
  onPress?: () => void;
}

/** Read-only presentation of one configured exercise entry. */
export function RoutineExerciseView({
  exercise,
  index,
  onPress,
}: RoutineExerciseViewProps) {
  return (
    <Card
      accessibilityLabel={
        onPress === undefined ? undefined : `Editar ${exercise.name}`
      }
      onPress={onPress}
    >
      <View style={styles.heading}>
        <Text style={styles.name} variant="titleMedium">
          {index + 1}. {exercise.name}
        </Text>
        <Text style={styles.weight} variant="labelLarge">
          {formatWeightKg(exercise.targetWeightKg)}
        </Text>
        {onPress !== undefined ? (
          <List.Icon
            color={colors.textMuted}
            icon="chevron-right"
            style={styles.chevron}
          />
        ) : null}
      </View>
      <Text style={styles.meta} variant="bodySmall">
        {formatSetCount(exercise.targetSets)} ·{' '}
        {formatRepRange(exercise.targetRepsMin, exercise.targetRepsMax)}
      </Text>
      {exercise.notes !== undefined ? (
        <Text style={styles.notes} variant="bodySmall">
          Nota: {exercise.notes}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
  },
  weight: {
    color: colors.text,
    fontWeight: '700',
  },
  chevron: {
    margin: 0,
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
});

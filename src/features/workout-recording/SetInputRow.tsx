import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AppTextInput } from '../../shared/ui/AppTextInput';
import { colors, spacing } from '../../shared/ui/theme';

export interface SetInputRowProps {
  setNumber: number;
  weightKg: string;
  reps: string;
  weightError?: string;
  repsError?: string;
  editable?: boolean;
  onChangeWeightKg: (value: string) => void;
  onChangeReps: (value: string) => void;
}

/**
 * One planned set with independent weight and repetition inputs.
 *
 * The component is controlled and never changes the number of planned sets.
 */
export function SetInputRow({
  setNumber,
  weightKg,
  reps,
  weightError,
  repsError,
  editable = true,
  onChangeWeightKg,
  onChangeReps,
}: SetInputRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.number} variant="labelLarge">
        Serie {setNumber}
      </Text>
      <View style={styles.field}>
        <AppTextInput
          accessibilityLabel={`Peso de la serie ${setNumber} en kilogramos`}
          editable={editable}
          error={weightError}
          keyboardType="decimal-pad"
          label="Peso (kg)"
          onChangeText={onChangeWeightKg}
          value={weightKg}
        />
      </View>
      <View style={styles.field}>
        <AppTextInput
          accessibilityLabel={`Repeticiones de la serie ${setNumber}`}
          editable={editable}
          error={repsError}
          keyboardType="number-pad"
          label="Reps"
          onChangeText={onChangeReps}
          value={reps}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  number: {
    width: 58,
    color: colors.textMuted,
    fontWeight: '700',
  },
  field: {
    flex: 1,
  },
});

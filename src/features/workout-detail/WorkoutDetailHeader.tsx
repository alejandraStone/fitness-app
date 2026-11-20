import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import {
  fonts,
  radii,
  spacing,
  workoutSummaryColors,
} from '../../shared/ui/theme';

export interface WorkoutDetailHeaderProps {
  onBack: () => void;
  onEdit?: () => void;
}

/**
 * In-screen header for the workout summary.
 *
 * Cream circles keep the back action comfortable over the illustrated
 * backdrop, while the edit action uses the lime action color on the opposite
 * side.
 */
export function WorkoutDetailHeader({
  onBack,
  onEdit,
}: WorkoutDetailHeaderProps) {
  return (
    <View style={styles.header}>
      <CircleIconButton
        accessibilityLabel="Volver"
        icon="chevron-left"
        onPress={onBack}
      />
      <Text accessibilityRole="header" style={styles.title}>
        Resumen
      </Text>
      {onEdit === undefined ? (
        <View style={styles.placeholder} />
      ) : (
        <CircleIconButton
          accessibilityLabel="Editar entrenamiento"
          emphasis
          icon="pencil-outline"
          onPress={onEdit}
        />
      )}
    </View>
  );
}

interface CircleIconButtonProps {
  accessibilityLabel: string;
  icon: string;
  onPress: () => void;
  emphasis?: boolean;
}

function CircleIconButton({
  accessibilityLabel,
  icon,
  onPress,
  emphasis = false,
}: CircleIconButtonProps) {
  return (
    <View style={styles.circleShadow}>
      <TouchableRipple
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        borderless={false}
        onPress={onPress}
        rippleColor={workoutSummaryColors.accentSoft}
        style={[styles.circle, emphasis && styles.circleEmphasis]}
      >
        <Icon
          color={
            emphasis
              ? workoutSummaryColors.onAction
              : workoutSummaryColors.text
          }
          size={22}
          source={icon}
        />
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  title: {
    color: workoutSummaryColors.text,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    fontWeight: 'normal',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  circleShadow: {
    borderRadius: radii.pill,
    elevation: 2,
    shadowColor: workoutSummaryColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: workoutSummaryColors.surface,
    borderColor: workoutSummaryColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  circleEmphasis: {
    backgroundColor: workoutSummaryColors.action,
    borderColor: workoutSummaryColors.action,
  },
  placeholder: {
    height: 44,
    width: 44,
  },
});

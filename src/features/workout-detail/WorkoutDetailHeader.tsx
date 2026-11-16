import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colors, fonts, radii, spacing } from '../../shared/ui/theme';

export interface WorkoutDetailHeaderProps {
  onBack: () => void;
  onEdit?: () => void;
}

/**
 * In-screen header for the workout summary.
 *
 * A translucent white circle keeps the back action comfortable over the
 * illustration, while the edit action stays discreet on the opposite side.
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
}

function CircleIconButton({
  accessibilityLabel,
  icon,
  onPress,
}: CircleIconButtonProps) {
  return (
    <View style={styles.circleShadow}>
      <TouchableRipple
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        borderless={false}
        onPress={onPress}
        rippleColor={colors.primarySoft}
        style={styles.circle}
      >
        <Icon color={colors.text} size={22} source={icon} />
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
    color: colors.text,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    fontWeight: 'normal',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  circleShadow: {
    borderRadius: radii.pill,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 2,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radii.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  placeholder: {
    height: 44,
    width: 44,
  },
});

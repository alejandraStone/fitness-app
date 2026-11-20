import {
  Button,
  type ButtonProps,
} from 'react-native-paper';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, fonts, radii, workoutSummaryColors } from './theme';

export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'progress'
  | 'dark'
  | 'danger'
  | 'summaryAction'
  | 'summaryAccent';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ButtonProps['icon'];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const variantProps: Record<
  AppButtonVariant,
  Pick<ButtonProps, 'mode' | 'buttonColor' | 'textColor'>
> = {
  primary: {
    mode: 'contained',
    buttonColor: colors.primary,
    textColor: colors.onPrimary,
  },
  secondary: {
    mode: 'contained-tonal',
    buttonColor: colors.secondary,
    textColor: colors.onSecondary,
  },
  outline: {
    mode: 'outlined',
    buttonColor: 'transparent',
    textColor: colors.primary,
  },
  progress: {
    mode: 'contained',
    buttonColor: colors.sage,
    textColor: colors.onPrimary,
  },
  dark: {
    mode: 'contained',
    buttonColor: colors.ink,
    textColor: colors.onInk,
  },
  danger: {
    mode: 'contained',
    buttonColor: colors.danger,
    textColor: colors.onDanger,
  },
  summaryAction: {
    mode: 'contained',
    buttonColor: workoutSummaryColors.action,
    textColor: workoutSummaryColors.onAction,
  },
  summaryAccent: {
    mode: 'contained',
    buttonColor: workoutSummaryColors.accent,
    textColor: workoutSummaryColors.onAccent,
  },
};

/**
 * Shared button built on React Native Paper.
 *
 * Disabled and loading states prevent duplicate submissions while an
 * asynchronous operation is in progress.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  contentStyle,
  accessibilityLabel,
}: AppButtonProps) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel ?? label}
      contentStyle={[{ minHeight: 44 }, contentStyle]}
      disabled={disabled || loading}
      icon={icon}
      labelStyle={{
        fontFamily: fonts.bold,
        fontWeight: 'normal',
        letterSpacing: 0.1,
      }}
      loading={loading}
      onPress={onPress}
      style={[
        { borderRadius: radii.pill },
        variant === 'outline' && { borderColor: colors.primary },
        style,
      ]}
      {...variantProps[variant]}
    >
      {label}
    </Button>
  );
}

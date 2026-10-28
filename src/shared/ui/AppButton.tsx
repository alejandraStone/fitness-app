import {
  Button,
  type ButtonProps,
} from 'react-native-paper';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radii } from './theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ButtonProps['icon'];
  style?: StyleProp<ViewStyle>;
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
  danger: {
    mode: 'contained',
    buttonColor: colors.danger,
    textColor: colors.onDanger,
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
  accessibilityLabel,
}: AppButtonProps) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel ?? label}
      contentStyle={{ minHeight: 44 }}
      disabled={disabled || loading}
      icon={icon}
      labelStyle={{ fontWeight: '700', letterSpacing: 0.1 }}
      loading={loading}
      onPress={onPress}
      style={[{ borderRadius: radii.pill }, style]}
      {...variantProps[variant]}
    >
      {label}
    </Button>
  );
}

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';

import { colors, radii, spacing } from './theme';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** Shared surface used to group related content. */
export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: CardProps) {
  return (
    <PaperCard
      accessibilityLabel={accessibilityLabel}
      mode="contained"
      onPress={onPress}
      style={[
        {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
        },
        style,
      ]}
    >
      <PaperCard.Content style={{ padding: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>{children}</View>
      </PaperCard.Content>
    </PaperCard>
  );
}

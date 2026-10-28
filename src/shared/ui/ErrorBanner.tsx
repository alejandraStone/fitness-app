import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors, radii, spacing } from './theme';

export interface ErrorBannerProps {
  message: string;
}

/** Inline error used when an operation fails but the screen remains usable. */
export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.message} variant="bodySmall">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radii.md,
    backgroundColor: colors.errorBackground,
    padding: spacing.md,
  },
  message: {
    color: colors.errorText,
    lineHeight: 20,
  },
});

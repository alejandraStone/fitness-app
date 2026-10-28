import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from './theme';

type ScreenEdge = 'top' | 'right' | 'bottom' | 'left';

export interface ScreenProps {
  children: ReactNode;
  /**
   * Defaults to the edges not covered by the native navigation header.
   * Screens outside the navigator (for example startup failures) should include
   * all four edges.
   */
  edges?: ScreenEdge[];
  style?: StyleProp<ViewStyle>;
}

/** Full-screen container using the application background token. */
export function Screen({
  children,
  edges = ['left', 'right', 'bottom'],
  style,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

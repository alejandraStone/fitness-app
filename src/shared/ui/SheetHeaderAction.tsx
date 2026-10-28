import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

import { colors } from './theme';

export interface SheetHeaderActionProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  primary?: boolean;
}

/**
 * Compact action used in a navigation header or on either side of a sheet title.
 *
 * Text actions keep the title centred on narrow phones while retaining a
 * 44 px touch target. Cancel uses body text; the primary action uses the accent.
 */
export function SheetHeaderAction({
  label,
  onPress,
  disabled = false,
  loading = false,
  primary = false,
}: SheetHeaderActionProps) {
  return (
    <Button
      compact
      contentStyle={styles.content}
      disabled={disabled}
      loading={loading}
      mode="text"
      onPress={onPress}
      style={styles.button}
      textColor={primary ? colors.primary : colors.text}
      labelStyle={styles.label}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    margin: 0,
    minWidth: 0,
  },
  content: {
    minHeight: 44,
    paddingHorizontal: 0,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 0,
  },
});

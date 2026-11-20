import type {
  StyleProp,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { View } from 'react-native';
import { HelperText, TextInput, useTheme } from 'react-native-paper';

import { fonts, radii, spacing } from './theme';

type SupportedTextInputProps = Pick<
  TextInputProps,
  | 'accessibilityLabel'
  | 'autoFocus'
  | 'editable'
  | 'keyboardType'
  | 'maxLength'
  | 'onBlur'
  | 'onChangeText'
  | 'onFocus'
  | 'placeholder'
  | 'returnKeyType'
  | 'value'
>;

export interface AppTextInputProps extends SupportedTextInputProps {
  label: string;
  error?: string;
  multiline?: boolean;
  style?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<TextStyle>;
}

/** Shared outlined text input with Paper styling and field-level feedback. */
export function AppTextInput({
  label,
  error,
  style,
  contentStyle,
  multiline = false,
  ...inputProps
}: AppTextInputProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      <TextInput
        activeOutlineColor={theme.colors.primary}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        contentStyle={[{ fontFamily: fonts.regular }, contentStyle]}
        error={error !== undefined}
        label={label}
        mode="outlined"
        multiline={multiline}
        outlineColor={theme.colors.outlineVariant}
        outlineStyle={{ borderRadius: radii.md }}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={[
          { backgroundColor: theme.colors.surface },
          multiline && { minHeight: 112 },
          style,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
        textColor={theme.colors.onSurface}
        {...inputProps}
      />
      {error !== undefined ? (
        <HelperText padding="none" type="error" visible>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

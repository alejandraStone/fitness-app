import type {
  StyleProp,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { colors, radii, spacing } from './theme';

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
}

/** Shared outlined text input with Paper styling and field-level feedback. */
export function AppTextInput({
  label,
  error,
  style,
  multiline = false,
  ...inputProps
}: AppTextInputProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <TextInput
        activeOutlineColor={colors.primary}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        error={error !== undefined}
        label={label}
        mode="outlined"
        multiline={multiline}
        outlineColor={colors.border}
        outlineStyle={{ borderRadius: radii.md }}
        placeholderTextColor={colors.textMuted}
        style={[
          { backgroundColor: colors.inputBackground },
          multiline && { minHeight: 112 },
          style,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
        textColor={colors.text}
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

import { Platform, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { fonts, radius } from '../../theme';
import { useThemeColors } from '../../theme';
import { useState } from 'react';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...rest }: Props) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && (
        <Text style={[styles.label, { color: focused ? c.primary : c.textSecondary }]}>{label}</Text>
      )}
      <TextInput
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        placeholderTextColor={c.textTertiary}
        style={[
          styles.input,
          {
            backgroundColor: c.inputBg,
            borderColor: error ? c.danger : focused ? c.inputFocusBorder : c.inputBorder,
            color: c.textPrimary,
          },
          Platform.OS === 'web' && ({ outlineWidth: 0 } as any),
          style,
        ]}
      />
      {!!error && (
        <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  error: {
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
  },
});

import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { fonts, radius } from '../../theme';
import { useThemeColors } from '../../theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active, onPress, style }: Props) {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? c.primarySurface : c.bgMuted,
          borderColor: active ? c.primaryBorder : c.surfaceBorder,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[
        styles.label,
        { color: active ? c.primary : c.textSecondary },
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
  },
});

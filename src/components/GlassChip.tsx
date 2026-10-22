/**
 * Selectable glass chip — used for filters, tags, country pills, etc.
 */
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeColors, radius, fonts } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: string;
};

export function GlassChip({ label, active, onPress, icon }: Props) {
  const c = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), [scale]);

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        active
          ? { backgroundColor: c.primarySurface, borderColor: c.primaryBorder, shadowColor: c.primary }
          : { backgroundColor: c.surface, borderColor: c.surfaceBorder },
        active && styles.chipActiveGlow,
        animStyle,
      ]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.text, { color: active ? c.primary : c.textPrimary }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  chipActiveGlow: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  icon: { fontSize: 14 },
  text: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
  },
});

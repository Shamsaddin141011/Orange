import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { fonts, radius, shadow, spring } from '../../theme';
import { useThemeColors } from '../../theme';

const AnimPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style, fullWidth = true }: Props) {
  const c = useThemeColors();
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg = {
    primary:   c.primary,
    secondary: 'transparent',
    ghost:     'transparent',
    danger:    c.dangerSurface,
  }[variant];

  const borderColor = {
    primary:   'transparent',
    secondary: c.primary,
    ghost:     c.surfaceBorder,
    danger:    c.dangerBorder,
  }[variant];

  const textColor = {
    primary:   '#FFFFFF',
    secondary: c.primary,
    ghost:     c.textSecondary,
    danger:    c.danger,
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[anim, fullWidth && { alignSelf: 'stretch' }, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => { scale.value = withSpring(0.96, spring.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, spring.snappy); }}
        style={[
          styles.btn,
          { backgroundColor: bg, borderColor },
          isDisabled && { opacity: 0.45 },
          variant === 'primary' && shadow.orange,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled }}
      >
        {loading
          ? <ActivityIndicator color={textColor} size="small" />
          : <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        }
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.1,
  },
});

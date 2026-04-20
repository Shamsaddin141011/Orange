/**
 * Primary (orange gradient) and secondary (glass) buttons.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, gradients, radius, shadow } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'lg';
  style?: any;
};

export function GlassButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'lg',
  style,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), [scale]);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const isDisabled = disabled || loading;
  const paddingV = size === 'lg' ? 15 : 11;
  const paddingH = size === 'lg' ? 28 : 22;

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        style={[animStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        <LinearGradient
          colors={isDisabled ? ['#555', '#444'] : gradients.orangeButton as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            { paddingVertical: paddingV, paddingHorizontal: paddingH, borderRadius: radius.md },
            !isDisabled && shadow.orange,
          ]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryText}>{label}</Text>}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  if (variant === 'danger') {
    return (
      <AnimatedPressable
        style={[animStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        <View style={[
          styles.base,
          styles.dangerBtn,
          { paddingVertical: paddingV, paddingHorizontal: paddingH, borderRadius: radius.md },
        ]}>
          <Text style={styles.dangerText}>{label}</Text>
        </View>
      </AnimatedPressable>
    );
  }

  // secondary / glass
  return (
    <AnimatedPressable
      style={[animStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      <View style={[
        styles.base,
        styles.secondaryBtn,
        { paddingVertical: paddingV, paddingHorizontal: paddingH, borderRadius: radius.md },
        isDisabled && styles.disabled,
      ]}>
        <Text style={[styles.secondaryText, isDisabled && styles.disabledText]}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: colors.glassCard,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  secondaryText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  dangerBtn: {
    backgroundColor: colors.dangerDim,
    borderWidth: 1.5,
    borderColor: 'rgba(248,113,113,0.4)',
  },
  dangerText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
  disabled: { opacity: 0.5 },
  disabledText: { color: colors.textTertiary },
});

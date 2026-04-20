/**
 * Frosted glass card — the primary surface component.
 * Uses expo-blur for cross-platform blur support.
 */
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadow } from '../theme';

type Props = ViewProps & {
  children: React.ReactNode;
  intensity?: number;
  /** Add an orange glow shadow */
  glow?: boolean;
  padding?: number;
  borderRadius?: number;
  style?: any;
};

export function GlassCard({
  children,
  intensity = 20,
  glow = false,
  padding = 16,
  borderRadius = radius.lg,
  style,
  ...rest
}: Props) {
  const glowStyle = glow ? shadow.orangeSubtle : shadow.darkSubtle;

  if (Platform.OS === 'web') {
    // Web: use CSS backdrop-filter directly
    return (
      <View
        style={[
          styles.card,
          { padding, borderRadius },
          glowStyle,
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.outerCard,
        { borderRadius },
        glowStyle,
        style,
      ]}
      {...rest}
    >
      <BlurView intensity={intensity} tint="dark" style={[styles.blur, { borderRadius, padding }]}>
        <View style={[styles.border, { borderRadius }]} pointerEvents="none" />
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerCard: {
    overflow: 'hidden',
  },
  blur: {
    overflow: 'hidden',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  // Web fallback
  card: {
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    alignSelf: 'stretch',
    // @ts-ignore web only
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
});

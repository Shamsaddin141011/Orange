/**
 * Full-screen gradient background used on every screen.
 * Wrap each screen's root view with this.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, ViewProps } from 'react-native';
import { gradients } from '../theme';

type Props = ViewProps & { children: React.ReactNode };

export function GlassBackground({ children, style, ...rest }: Props) {
  return (
    <LinearGradient
      colors={gradients.background as [string, string, ...string[]]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.fill, style]}
      {...rest}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

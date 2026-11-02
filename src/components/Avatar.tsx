import { useEffect, useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemeColors } from '../theme';

interface Props {
  /** Public photo URL; falls back to the initial when missing or it fails to load. */
  uri?: string | null;
  /** Name used for the fallback initial (display name or username). */
  name?: string | null;
  size: number;
  /** Draw the thin orange border used in lists and headers. */
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** A user's profile picture, or their initial on an orange-tinted circle. */
export function Avatar({ uri, name, size, bordered = true, style }: Props) {
  const c = useThemeColors();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  const initial = (name?.trim() || '?').charAt(0).toUpperCase();
  const showPhoto = !!uri && !failed;

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: c.primarySurface },
        bordered && { borderWidth: 1.5, borderColor: c.primaryBorder },
        style,
      ]}
    >
      {showPhoto ? (
        <Image
          source={{ uri: uri! }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[styles.initial, { color: c.primary, fontSize: Math.round(size * 0.42) }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  initial: { fontFamily: 'Syne_700Bold' },
});

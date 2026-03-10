/**
 * Reusable styled banner header used wherever we previously showed a university image.
 * No external fetches — purely deterministic based on university index.
 */
import { StyleSheet, Text, View } from 'react-native';

const PALETTES: [string, string][] = [
  ['#0f172a', '#1e3a5f'],
  ['#1a0a2e', '#3b0764'],
  ['#0c2a1a', '#14532d'],
  ['#2a0a0a', '#7c2d12'],
  ['#0a1a2a', '#0c4a6e'],
  ['#1a1a0a', '#713f12'],
  ['#1a0a1a', '#4c1d95'],
  ['#0a0a1a', '#1e3a5f'],
  ['#2a1a0a', '#92400e'],
  ['#0a2a2a', '#134e4a'],
];

const COUNTRY_FLAG: Record<string, string> = { USA: '🇺🇸', UK: '🇬🇧' };

export function getPalette(idx: number): [string, string] {
  return PALETTES[Math.abs(idx) % PALETTES.length] as [string, string];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((w) => w.length > 2 && !/^(of|the|at|and)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

type Props = {
  name: string;
  city: string;
  state?: string;
  country: string;
  idx: number;
  height?: number;
  /** Show name/city text inside the banner (default true) */
  showText?: boolean;
};

export function CardBanner({ name, city, state, country, idx, height = 120, showText = true }: Props) {
  const [bgA, bgB] = getPalette(idx);
  const initials = getInitials(name);

  return (
    <View style={[styles.banner, { backgroundColor: bgA, height }]}>
      <View style={[styles.accent, { backgroundColor: bgB }]} />
      <Text style={[styles.bgInitials, { fontSize: height * 0.75 }]}>{initials}</Text>
      {showText && (
        <View style={styles.content}>
          <Text style={styles.flag}>{COUNTRY_FLAG[country] ?? ''}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.city}>{city}{state ? `, ${state}` : ''}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { overflow: 'hidden', justifyContent: 'flex-end' },
  accent: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -70,
    right: -40,
    opacity: 0.55,
  },
  bgInitials: {
    position: 'absolute',
    fontWeight: '900',
    color: 'rgba(255,255,255,0.06)',
    bottom: -14,
    left: 12,
    letterSpacing: -2,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 14 },
  flag: { fontSize: 26 },
  name: { fontSize: 15, fontWeight: '700', color: '#fff' },
  city: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colorIdx } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';
import { MatchResult } from '../types';

type Props = {
  item: MatchResult;
  onPress: () => void;
  onSave: () => void;
  onCompare: () => void;
};

// Each university gets a unique but consistent color pair based on its index
const PALETTES = [
  ['#0f172a', '#1e3a5f'],  // navy
  ['#1a0a2e', '#3b0764'],  // deep purple
  ['#0c2a1a', '#14532d'],  // forest
  ['#2a0a0a', '#7c2d12'],  // burgundy
  ['#0a1a2a', '#0c4a6e'],  // ocean
  ['#1a1a0a', '#713f12'],  // amber-dark
  ['#1a0a1a', '#4c1d95'],  // violet
  ['#0a0a1a', '#1e3a5f'],  // midnight
  ['#2a1a0a', '#92400e'],  // walnut
  ['#0a2a2a', '#134e4a'],  // teal
];

function getPalette(idx: number): [string, string] {
  return PALETTES[idx % PALETTES.length] as [string, string];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((w) => w.length > 2 && !/^(of|the|at|and)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

const COUNTRY_FLAG: Record<string, string> = { USA: '🇺🇸', UK: '🇬🇧', EU: '🇪🇺', China: '🇨🇳' };

export function UniversityCard({ item, onPress, onSave, onCompare }: Props) {
  const saved = useAppStore((s) => !!s.shortlist[item.university.id]);
  const compared = useAppStore((s) => s.compareIds.includes(item.university.id));
  const { university } = item;
  const scoreColor = item.score >= 80 ? '#16a34a' : item.score >= 60 ? '#f97316' : '#6b7280';
  const [bgA, bgB] = getPalette(colorIdx(university.id));
  const initials = getInitials(university.name);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Banner header */}
      <View style={[styles.banner, { backgroundColor: bgA }]}>
        {/* Decorative second layer */}
        <View style={[styles.bannerAccent, { backgroundColor: bgB }]} />
        {/* Large background initials */}
        <Text style={styles.bannerBg}>{initials}</Text>
        {/* Foreground content */}
        <View style={styles.bannerContent}>
          <Text style={styles.bannerFlag}>{COUNTRY_FLAG[university.country] ?? ''}</Text>
          <View>
            <Text style={styles.bannerName} numberOfLines={1}>{university.name}</Text>
            <Text style={styles.bannerCity}>{university.city}{university.state ? `, ${university.state}` : ''}</Text>
          </View>
        </View>
        {/* Score badge */}
        <View style={styles.scoreBadge}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{item.score}% match</Text>
        </View>
      </View>

      {/* Card body */}
      <View style={styles.body}>
        <View style={styles.chips}>
          {item.reasons.slice(0, 2).map((r) => (
            <View key={r} style={styles.chip}>
              <Text style={styles.chipText}>{r}</Text>
            </View>
          ))}
        </View>
        <View style={styles.footer}>
          <View>
            <Text style={styles.tuition}>${university.tuition_estimate.toLocaleString()}/yr</Text>
            {university.student_size != null && (
              <Text style={styles.studentSize}>👥 {university.student_size.toLocaleString()}</Text>
            )}
          </View>
          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, saved && styles.actionBtnActive]} onPress={onSave}>
              <Text style={[styles.actionText, saved && styles.actionTextActive]}>{saved ? '♥ Saved' : '♡ Save'}</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, compared && styles.actionBtnActive]} onPress={onCompare}>
              <Text style={[styles.actionText, compared && styles.actionTextActive]}>{compared ? '✓ Added' : '+ Compare'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  banner: {
    height: 120,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bannerAccent: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -60,
    right: -30,
    opacity: 0.6,
  },
  bannerBg: {
    position: 'absolute',
    fontSize: 96,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.06)',
    bottom: -16,
    left: 16,
    letterSpacing: -2,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingBottom: 14,
  },
  bannerFlag: { fontSize: 28 },
  bannerName: { fontSize: 15, fontWeight: '700', color: '#fff', maxWidth: 280 },
  bannerCity: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  scoreBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  scoreText: { fontSize: 13, fontWeight: '700' },
  body: { padding: 14, paddingTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { backgroundColor: '#fff7ed', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, color: '#ea580c', fontWeight: '500' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tuition: { fontSize: 14, fontWeight: '700', color: '#111827' },
  studentSize: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5, borderColor: '#e5e7eb' },
  actionBtnActive: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  actionTextActive: { color: '#f97316' },
});

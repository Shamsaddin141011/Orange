import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colorIdx } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';
import { MatchResult, University } from '../types';

type Props = {
  item: MatchResult;
  onPress: () => void;
  onSave: () => void;
  onCompare: () => void;
};

const PALETTES = [
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

function formatTuition(t: number): string {
  if (t >= 1000) return `$${Math.round(t / 1000)}K`;
  return `$${t}`;
}

function getTypeStr(u: University): string {
  const parts: string[] = [];
  if (u.tags.includes('public')) parts.push('Public');
  else if (u.tags.includes('private')) parts.push('Private');
  if (u.student_size) {
    if (u.student_size >= 30000) parts.push('Large');
    else if (u.student_size >= 10000) parts.push('Medium');
    else parts.push('Small');
  }
  const locale = u.tags.find(t => ['urban', 'suburban', 'rural'].includes(t));
  if (locale) parts.push(locale.charAt(0).toUpperCase() + locale.slice(1));
  return parts.join(' · ') || 'University';
}

export function UniversityCard({ item, onPress, onSave, onCompare }: Props) {
  const saved = useAppStore((s) => !!s.shortlist[item.university.id]);
  const compared = useAppStore((s) => s.compareIds.includes(item.university.id));
  const { university } = item;
  const scoreColor = item.score >= 80 ? '#16a34a' : item.score >= 60 ? '#f97316' : '#6b7280';
  const [bgA, bgB] = getPalette(colorIdx(university.id));
  const initials = getInitials(university.name);
  const typeStr = getTypeStr(university);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.inner}>

        {/* ── Left: text content ─────────────────────── */}
        <View style={styles.left}>
          <Text style={styles.name} numberOfLines={2}>{university.name} →</Text>
          <Text style={styles.location}>
            {university.city}{university.state ? `, ${university.state}` : ''}
          </Text>

          <View style={styles.divider} />

          {/* Type row */}
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={13} color="#9ca3af" />
            <Text style={styles.infoText} numberOfLines={1}>{typeStr}</Text>
          </View>

          {/* Acceptance rate */}
          {university.acceptance_rate !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={13} color="#9ca3af" />
              <Text style={styles.infoText}>
                {Math.round(university.acceptance_rate * 100)}% acceptance rate
              </Text>
            </View>
          )}

          {/* Tuition */}
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={13} color="#9ca3af" />
            <Text style={styles.infoText}>{formatTuition(university.tuition_estimate)}/yr</Text>
          </View>

          {/* SAT range */}
          <View style={styles.infoRow}>
            <Text style={styles.satTag}>SAT</Text>
            <Text style={styles.infoText}>
              {university.sat_middle_50.min}–{university.sat_middle_50.max}
            </Text>
          </View>

          {/* Footer: score + compare */}
          <View style={styles.cardFooter}>
            <View style={[styles.scorePill, { backgroundColor: scoreColor + '18' }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>{item.score}% match</Text>
            </View>
            <Pressable
              style={[styles.compareBtn, compared && styles.compareBtnActive]}
              onPress={onCompare}
            >
              <Text style={[styles.compareBtnText, compared && styles.compareBtnTextActive]}>
                {compared ? '✓ Added' : '+ Compare'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Right: visual panel ───────────────────── */}
        <View style={[styles.right, { backgroundColor: bgA }]}>
          <View style={[styles.rightAccent, { backgroundColor: bgB }]} />
          <Text style={styles.rightInitials}>{initials}</Text>

          <View style={styles.rightBottom}>
            <Pressable
              style={[styles.saveBtn, saved && styles.saveBtnActive]}
              onPress={onSave}
            >
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={13}
                color={saved ? '#f97316' : '#374151'}
              />
              <Text style={[styles.saveBtnText, saved && styles.saveBtnTextActive]}>
                {saved ? 'Saved' : 'Save'}
              </Text>
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
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  inner: {
    flexDirection: 'row',
    minHeight: 210,
  },

  // Left panel
  left: {
    flex: 1.5,
    padding: 14,
    paddingTop: 15,
    justifyContent: 'flex-start',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 21,
    marginBottom: 3,
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  satTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.5,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  scorePill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  compareBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  compareBtnActive: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  compareBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  compareBtnTextActive: { color: '#f97316' },

  // Right panel
  right: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 12,
  },
  rightAccent: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -40,
    right: -30,
    opacity: 0.45,
  },
  rightInitials: {
    position: 'absolute',
    fontSize: 72,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.07)',
    bottom: 24,
    left: -4,
    letterSpacing: -2,
  },
  rightBottom: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    left: 12,
    alignItems: 'flex-end',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  saveBtnActive: {
    backgroundColor: '#fff7ed',
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  saveBtnTextActive: { color: '#f97316' },
});

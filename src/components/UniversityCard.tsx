import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colorIdx } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';
import { MatchResult, University } from '../types';
import { colors, radius, shadow } from '../theme';
import { GlassCard } from './GlassCard';

type Props = {
  item: MatchResult;
  onPress: () => void;
  onSave: () => void;
  onCompare: () => void;
  index?: number;
};

const PALETTES: [string, string][] = [
  ['#1A0A00', '#7c2d12'],
  ['#0A0A1A', '#3b0764'],
  ['#0A1A0A', '#14532d'],
  ['#1A0A0A', '#7c2d12'],
  ['#0A1A2A', '#0c4a6e'],
  ['#1A1A0A', '#713f12'],
  ['#1A0A1A', '#4c1d95'],
  ['#0A0A1A', '#1e3a5f'],
  ['#2A1A0A', '#92400e'],
  ['#0A2A2A', '#134e4a'],
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function UniversityCard({ item, onPress, onSave, onCompare, index = 0 }: Props) {
  const saved = useAppStore((s) => !!s.shortlist[item.university.id]);
  const compared = useAppStore((s) => s.compareIds.includes(item.university.id));
  const { university } = item;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), [scale]);

  const scoreColor =
    item.score >= 80 ? colors.success :
    item.score >= 60 ? colors.orange :
    colors.textTertiary;

  const [bgA, bgB] = getPalette(colorIdx(university.id));
  const initials = getInitials(university.name);
  const typeStr = getTypeStr(university);

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60).springify()}
    >
      <AnimatedPressable
        style={[styles.card, animStyle]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      >
        <GlassCard padding={0} borderRadius={radius.lg} style={styles.inner}>
          {/* ── Left: color/visual panel (image placeholder) ── */}
          <View style={[styles.left, { backgroundColor: bgA }]}>
            <LinearGradient
              colors={[bgB, bgA]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Accent blob */}
            <View style={[styles.accentBlob, { backgroundColor: bgB }]} />
            {/* Big initials watermark */}
            <Text style={styles.bigInitials}>{initials}</Text>

            {/* Save button at bottom */}
            <View style={styles.leftBottom}>
              <Pressable
                style={[styles.saveBtn, saved && styles.saveBtnActive]}
                onPress={onSave}
                hitSlop={6}
              >
                <Ionicons
                  name={saved ? 'heart' : 'heart-outline'}
                  size={13}
                  color={saved ? colors.orange : 'rgba(255,255,255,0.8)'}
                />
                <Text style={[styles.saveBtnText, saved && styles.saveBtnTextActive]}>
                  {saved ? 'Saved' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── Right: text content ── */}
          <View style={styles.right}>
            <Text style={styles.name} numberOfLines={2}>{university.name}</Text>
            <Text style={styles.location}>
              {university.city}{university.state ? `, ${university.state}` : ''}
            </Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.infoText} numberOfLines={1}>{typeStr}</Text>
            </View>

            {university.acceptance_rate !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons name="school-outline" size={13} color={colors.textTertiary} />
                <Text style={styles.infoText}>
                  {Math.round(university.acceptance_rate * 100)}% acceptance
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.infoText}>{formatTuition(university.tuition_estimate)}/yr</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.satTag}><Text style={styles.satTagText}>SAT</Text></View>
              <Text style={styles.infoText}>
                {university.sat_middle_50.min}–{university.sat_middle_50.max}
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={[styles.scorePill, { backgroundColor: scoreColor + '22' }]}>
                <Text style={[styles.scoreText, { color: scoreColor }]}>{item.score}% match</Text>
              </View>
              <Pressable
                style={[styles.compareBtn, compared && styles.compareBtnActive]}
                onPress={onCompare}
                hitSlop={4}
              >
                <Text style={[styles.compareBtnText, compared && styles.compareBtnTextActive]}>
                  {compared ? '✓ Added' : '+ Compare'}
                </Text>
              </Pressable>
            </View>
          </View>
        </GlassCard>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    borderRadius: radius.lg,
    ...shadow.dark,
  },
  inner: {
    flexDirection: 'row',
    minHeight: 200,
    overflow: 'hidden',
  },

  // Left visual panel
  left: {
    width: 110,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 10,
  },
  accentBlob: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -40,
    left: -30,
    opacity: 0.5,
  },
  bigInitials: {
    position: 'absolute',
    fontSize: 80,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.06)',
    bottom: 20,
    right: -10,
    letterSpacing: -3,
  },
  leftBottom: {
    position: 'absolute',
    bottom: 10,
    left: 8,
    right: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  saveBtnActive: {
    backgroundColor: colors.orangeDim,
    borderColor: colors.orangeBorder,
  },
  saveBtnText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  saveBtnTextActive: { color: colors.orange },

  // Right text panel
  right: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-start',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 3,
  },
  location: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  satTag: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  satTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scorePill: {
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  scoreText: { fontSize: 11, fontWeight: '700' },
  compareBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  compareBtnActive: {
    borderColor: colors.orangeBorder,
    backgroundColor: colors.orangeDim,
  },
  compareBtnText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
  compareBtnTextActive: { color: colors.orange },
});

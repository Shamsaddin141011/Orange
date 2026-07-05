import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Heart, MapPin, Percent, DollarSign, BookOpen, GraduationCap, Globe, Scale } from 'lucide-react-native';
import { MatchBadge } from './ui/MatchBadge';
import { radius, shadow, spring, iconSize } from '../theme';
import { useThemeColors } from '../theme';
import { MatchResult } from '../types';

interface Props {
  item: MatchResult;
  saved: boolean;
  onPress: () => void;
  onSave: () => void;
  onCompare?: () => void;
  isCompared?: boolean;
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.statRow}>
      {icon}
      <Text style={[styles.statLabel, { color: c.textTertiary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: c.textPrimary }]}>{value}</Text>
    </View>
  );
}

export function UniCard({ item, saved, onPress, onSave, onCompare, isCompared }: Props) {
  const c = useThemeColors();
  const { university: uni, score } = item;
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const imageUri = uni.image_url || null;

  return (
    <Animated.View style={[anim, styles.cardWrap]}>
      <View style={[styles.card, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }, shadow.sm]}>

        {/* Layer 1 — navigate Pressable, absoluteFill, rendered FIRST so it's beneath everything */}
        <Pressable
          onPressIn={() => { scale.value = withSpring(0.98, spring.snappy); }}
          onPressOut={() => { scale.value = withSpring(1, spring.snappy); }}
          onPress={onPress}
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={`${uni.name}, ${score}% match`}
        />

        {/* Layer 2 — visual content, pointerEvents none so clicks fall through to navigate */}
        <View style={styles.content} pointerEvents="none">
          <View style={[styles.imageWrap, { backgroundColor: c.primarySurface }]}>
            {imageUri
              ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              : <View style={[styles.imagePlaceholder, { backgroundColor: c.primarySurface }]}>
                  <Text style={[styles.placeholderInitial, { color: c.primary }]}>{uni.name.charAt(0)}</Text>
                </View>
            }
          </View>

          <View style={styles.textArea}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: c.textPrimary }]} numberOfLines={1}>{uni.name}</Text>
              <MatchBadge score={score} />
            </View>
            <View style={styles.locationRow}>
              <MapPin size={10} color={c.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.location, { color: c.textTertiary }]} numberOfLines={1}>
                {uni.city}{uni.state ? `, ${uni.state}` : ''} · {uni.country}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.divider }]} />
            {uni.acceptance_rate != null && (
              <StatRow icon={<Percent size={11} color={c.accent} strokeWidth={1.5} />} label="Accept" value={`${Math.round(uni.acceptance_rate * 100)}%`} />
            )}
            <StatRow icon={<DollarSign size={11} color={c.accent} strokeWidth={1.5} />} label="Tuition" value={`$${(uni.tuition_estimate / 1000).toFixed(0)}k/yr`} />
            {uni.sat_middle_50 && (
              <StatRow icon={<BookOpen size={11} color={c.accent} strokeWidth={1.5} />} label="SAT" value={`${uni.sat_middle_50.min}–${uni.sat_middle_50.max}`} />
            )}
            {uni.intl_aid && (
              <StatRow icon={<Globe size={11} color={c.accent} strokeWidth={1.5} />} label="Intl Aid" value={uni.intl_aid} />
            )}
            {uni.majors?.length > 0 && (
              <StatRow icon={<GraduationCap size={11} color={c.accent} strokeWidth={1.5} />} label="Top major" value={uni.majors[0]} />
            )}
          </View>
        </View>

        {/* Layer 3 — action buttons, rendered LAST so they sit on top of navigate */}
        <View style={styles.btnRow}>
          {onCompare && (
            <Pressable
              onPress={onCompare}
              style={[styles.actionBtn, { backgroundColor: isCompared ? c.primarySurface : c.bgMuted }]}
              accessibilityRole="button"
              accessibilityLabel={isCompared ? 'Remove from compare' : 'Add to compare'}
            >
              <Scale size={14} color={isCompared ? c.primary : c.textTertiary} strokeWidth={1.5} />
            </Pressable>
          )}
          <Pressable
            onPress={onSave}
            style={[styles.actionBtn, { backgroundColor: saved ? c.primarySurface : c.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from shortlist' : 'Add to shortlist'}
          >
            <Heart size={14} color={saved ? c.primary : c.textTertiary} fill={saved ? c.primary : 'none'} strokeWidth={1.5} />
          </Pressable>
        </View>

      </View>
    </Animated.View>
  );
}

const IMAGE_SIZE = 220;

const styles = StyleSheet.create({
  cardWrap: { marginBottom: 12 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    height: IMAGE_SIZE,
  },

  // Layer 2: visual content
  content: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    flexShrink: 0,
  },
  image:              { width: '100%', height: '100%' },
  imagePlaceholder:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderInitial: { fontSize: 56, fontFamily: 'Syne_800ExtraBold', opacity: 0.35 },

  textArea: { flex: 1, padding: 14, gap: 4 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name:     { flex: 1, fontSize: 15, fontFamily: 'Syne_700Bold', lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location:    { fontSize: 11, fontFamily: 'SpaceGrotesk_400Regular' },
  divider:     { height: 1, marginVertical: 3 },
  statRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel:   { fontSize: 11, fontFamily: 'SpaceGrotesk_500Medium', marginRight: 2 },
  statValue:   { fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold' },

  // Layer 3: action buttons
  btnRow: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 44,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

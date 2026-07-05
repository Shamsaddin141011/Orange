import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, BarChart3 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colorIdx, rowToUniversity } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';
import { University } from '../types';
import { UniImage } from '../components/UniImage';
import { MatchBadge } from '../components/ui/MatchBadge';
import { Button } from '../components/ui/Button';
import { useThemeColors, radius, iconSize, shadow, layout } from '../theme';

type Props = {
  route: { params: { id: string } };
  navigation: { goBack: () => void };
};

export function UniversityDetailScreen({ route, navigation }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { shortlist, toggleShortlist, compareIds, toggleCompare, matches } = useAppStore();
  const [fetchedUni, setFetchedUni] = useState<University | null>(null);

  const matchResult = matches.find((m) => m.university.id === route.params.id);
  const matchedUni = matchResult?.university;

  useEffect(() => {
    if (matchedUni) return;
    supabase.from('universities').select('*').eq('id', route.params.id).single().then(({ data }) => {
      if (data) setFetchedUni(rowToUniversity(data as any));
    });
  }, [route.params.id]);

  const uni = matchedUni ?? fetchedUni;

  if (!uni) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  const saved = !!shortlist[uni.id];
  const compared = compareIds.includes(uni.id);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <UniImage
            name={uni.name}
            imageUrl={uni.image_url}
            idx={colorIdx(uni.id)}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Floating actions */}
          <View style={[styles.actionBar, { top: insets.top + 8 }]}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.floatBtn}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={8}
            >
              <ChevronLeft size={iconSize.md} color="#fff" strokeWidth={2} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => toggleShortlist(uni.id)}
              style={[styles.floatBtn, saved && styles.floatBtnActive]}
              accessibilityLabel={saved ? 'Remove from shortlist' : 'Add to shortlist'}
            >
              <Heart
                size={iconSize.md}
                color={saved ? c.primary : '#fff'}
                fill={saved ? c.primary : 'none'}
                strokeWidth={1.5}
              />
            </Pressable>
            <Pressable
              onPress={() => toggleCompare(uni.id)}
              style={[styles.floatBtn, compared && styles.floatBtnActive]}
              accessibilityLabel="Toggle compare"
            >
              <BarChart3 size={iconSize.md} color={compared ? c.primary : '#fff'} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Hero title */}
          <View style={styles.heroBottom}>
            <Text style={styles.heroName}>{uni.name}</Text>
            <Text style={styles.heroLocation}>
              {uni.city}{uni.state ? `, ${uni.state}` : ''} · {uni.country}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Match badge + tags */}
          <View style={styles.badgeRow}>
            {matchResult && <MatchBadge score={matchResult.score} />}
            {uni.tags.map((t) => (
              <View key={t} style={[styles.tag, { backgroundColor: c.primarySurface, borderColor: c.primaryBorder }]}>
                <Text style={[styles.tagText, { color: c.primary }]}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {[
              { value: `$${uni.tuition_estimate.toLocaleString()}`, label: 'Tuition/yr' },
              { value: uni.acceptance_rate ? `${Math.round(uni.acceptance_rate * 100)}%` : 'N/A', label: 'Acceptance' },
              { value: `${uni.sat_middle_50.min}–${uni.sat_middle_50.max}`, label: 'SAT Mid-50' },
              { value: uni.intl_aid, label: 'Intl Aid' },
            ].map(({ value, label }) => (
              <View key={label} style={[styles.statCard, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
                <Text style={[styles.statValue, { color: c.primary }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: c.textTertiary }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* About */}
          <View style={[styles.section, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>About</Text>
            <Text style={[styles.bodyText, { color: c.textSecondary }]}>{uni.brief_description}</Text>
          </View>

          {/* Programs */}
          {uni.majors.length > 0 && (
            <View style={[styles.section, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Programs</Text>
              <View style={styles.pillRow}>
                {uni.majors.map((m) => (
                  <View key={m} style={[styles.pill, { backgroundColor: c.bgMuted, borderColor: c.surfaceBorder }]}>
                    <Text style={[styles.pillText, { color: c.textSecondary }]}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Deadlines */}
          {uni.deadlines.length > 0 && (
            <View style={[styles.section, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Deadlines</Text>
              {uni.deadlines.map((d) => (
                <View key={d.label} style={[styles.deadlineRow, { borderBottomColor: c.divider }]}>
                  <Text style={[styles.deadlineLabel, { color: c.textSecondary }]}>{d.label}</Text>
                  <Text style={[styles.deadlineDate, { color: c.textTertiary }]}>{d.date}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Requirements */}
          <View style={[styles.section, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Requirements</Text>
            <Text style={[styles.bodyText, { color: c.textSecondary }]}>
              SAT/ACT optional by policy; check official site for the latest requirements.
            </Text>
            <Text style={[styles.bodyText, { color: c.textSecondary }]}>
              International applicants: English proficiency test + visa documents required.
            </Text>
          </View>

          <Button label="Visit Official Website" onPress={() => Linking.openURL(uni.website)} variant="secondary" />
          <View style={{ height: 8 }} />
          <Button
            label={saved ? 'Saved to Shortlist ✓' : 'Add to Shortlist'}
            onPress={() => toggleShortlist(uni.id)}
            variant={saved ? 'secondary' : 'primary'}
          />

          <View style={{ height: insets.bottom + layout.tabBarHeight + layout.tabBarBottomOffset + 16 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { height: 260, overflow: 'hidden', justifyContent: 'flex-end' },
  actionBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 8, alignItems: 'center' },
  floatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatBtnActive: { backgroundColor: 'rgba(255,85,0,0.25)', borderColor: 'rgba(255,85,0,0.50)' },
  heroBottom: { padding: 20, gap: 4 },
  heroName: { fontSize: 22, fontFamily: 'Syne_800ExtraBold', color: '#fff', lineHeight: 28 },
  heroLocation: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular', color: 'rgba(255,255,255,0.65)' },

  content: { padding: 16, gap: 12 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 17, fontFamily: 'Syne_700Bold', marginBottom: 3 },
  statLabel: { fontSize: 11, fontFamily: 'SpaceGrotesk_500Medium' },

  section: { borderRadius: radius.lg, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 14, fontFamily: 'Syne_700Bold' },
  bodyText: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 22 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  pillText: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular' },

  deadlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  deadlineLabel: { fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' },
  deadlineDate: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' },
});

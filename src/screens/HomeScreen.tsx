import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Heart, BarChart3, CheckSquare } from 'lucide-react-native';
import { CardBanner } from '../components/CardBanner';
import { colorIdx } from '../lib/transform';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useThemeColors, radius, iconSize, shadow, layout } from '../theme';

const FEATURES = [
  { Icon: Search,     label: 'Discover', desc: 'Matched by scores & budget',   tab: 'Discover' },
  { Icon: Heart,      label: 'Shortlist', desc: 'Save and tag your favourites', tab: 'Shortlist' },
  { Icon: BarChart3,  label: 'Compare',  desc: 'Side-by-side stats for 3 unis',tab: 'Compare' },
  { Icon: CheckSquare,label: 'Tracker',  desc: 'Track deadlines & applications',tab: 'Tracker' },
];

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { shortlist, matches } = useAppStore();
  const savedCount = Object.keys(shortlist).length;
  const matchCount = matches.length;
  const featured = matches.slice(0, 6);
  const [totalSchools, setTotalSchools] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('universities').select('*', { count: 'exact', head: true }).then(({ count }) => {
      if (count !== null) setTotalSchools(count);
    });
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      >
        {/* Greeting */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.greetingSection}>
          <Text style={[styles.eyebrow, { color: c.textTertiary }]}>Good morning 👋</Text>
          <Text style={[styles.greeting, { color: c.textPrimary }]}>Your Dashboard</Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.statsRow}>
          {[
            { value: matchCount || '—', label: 'Matches' },
            { value: savedCount || '—', label: 'Saved' },
            { value: totalSchools ?? '—', label: 'Universities' },
          ].map(({ value, label }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
              <Text style={[styles.statNum, { color: c.primary }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: c.textTertiary }]}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Top matches */}
        {featured.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(160)}>
            <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>TOP MATCHES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              snapToInterval={212}
              decelerationRate="fast"
            >
              {featured.map((m) => (
                <Pressable
                  key={m.university.id}
                  style={[styles.featuredCard, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}
                  onPress={() => navigation.navigate('Discover')}
                >
                  <View style={styles.featuredImageWrap}>
                    <CardBanner
                      name={m.university.name}
                      city={m.university.city}
                      state={m.university.state}
                      country={m.university.country}
                      idx={colorIdx(m.university.id)}
                      height={110}
                      showText={false}
                    />
                  </View>
                  <View style={styles.featuredInfo}>
                    <Text style={[styles.featuredName, { color: c.textPrimary }]} numberOfLines={1}>
                      {m.university.name}
                    </Text>
                    <Text style={[styles.featuredMeta, { color: c.textTertiary }]}>
                      {m.university.city} · {m.score}% match
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.duration(500).delay(240)}>
          <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>QUICK ACTIONS</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map(({ Icon, label, desc, tab }, i) => (
              <Animated.View
                key={label}
                entering={FadeInDown.duration(400).delay(240 + i * 60)}
                style={styles.featureWrap}
              >
                <Pressable
                  style={[styles.featureCard, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}
                  onPress={() => navigation.navigate(tab)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Icon size={iconSize.xl} color={c.primary} strokeWidth={1.5} />
                  <Text style={[styles.featureLabel, { color: c.textPrimary }]}>{label}</Text>
                  <Text style={[styles.featureDesc, { color: c.textSecondary }]}>{desc}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: insets.bottom + layout.tabBarHeight + layout.tabBarBottomOffset + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadding, gap: 0 },

  greetingSection: { marginBottom: 20 },
  eyebrow: { fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium', marginBottom: 4 },
  greeting: { fontSize: 28, fontFamily: 'Syne_800ExtraBold' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statNum: { fontSize: 24, fontFamily: 'Syne_700Bold', marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'SpaceGrotesk_500Medium' },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  featuredList: { gap: 12, paddingBottom: 4, marginBottom: 28 },
  featuredCard: {
    width: 200,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featuredImageWrap: { height: 110 },
  featuredInfo: { padding: 10 },
  featuredName: { fontSize: 13, fontFamily: 'Syne_700Bold', marginBottom: 2 },
  featuredMeta: { fontSize: 11, fontFamily: 'SpaceGrotesk_400Regular' },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  featureWrap: { width: '47.5%' },
  featureCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  featureLabel: { fontSize: 14, fontFamily: 'Syne_700Bold' },
  featureDesc: { fontSize: 12, fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 17 },
});

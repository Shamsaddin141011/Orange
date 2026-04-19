import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CardBanner } from '../components/CardBanner';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { colorIdx } from '../lib/transform';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { colors, gradients, radius, shadow } from '../theme';

const FEATURES = [
  { icon: '🔍', label: 'Discover', desc: 'Matched by SAT, interests & budget', tab: 'Discover' },
  { icon: '❤️', label: 'Shortlist', desc: 'Tag schools as reach, match or safety', tab: 'Shortlist' },
  { icon: '⚖️', label: 'Compare', desc: 'Side-by-side stats for up to 3 schools', tab: 'Compare' },
  { icon: '📋', label: 'Tracker', desc: 'Track essays, deadlines & status', tab: 'Tracker' },
];

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { shortlist, matches } = useAppStore();
  const savedCount = Object.keys(shortlist).length;
  const matchCount = matches.length;
  const featured = matches.slice(0, 4);
  const [totalSchools, setTotalSchools] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('universities').select('*', { count: 'exact', head: true }).then(({ count }) => {
      if (count !== null) setTotalSchools(count);
    });
  }, []);

  return (
    <GlassBackground>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <View style={styles.hero}>
            <LinearGradient
              colors={['rgba(255,122,47,0.18)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroBlobTR} />
            <Text style={styles.heroEyebrow}>Welcome to</Text>
            <Text style={styles.heroTitle}>OrangeUni</Text>
            <Text style={styles.heroSub}>Find universities that fit you — transparently.</Text>
            <GlassButton
              label="Start Discovering →"
              onPress={() => navigation.navigate('Discover')}
              size="md"
              style={styles.heroCta}
            />
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statsRow}>
          <GlassCard padding={16} glow style={styles.statCard}>
            <Text style={styles.statNum}>{matchCount || '—'}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </GlassCard>
          <GlassCard padding={16} style={styles.statCard}>
            <Text style={styles.statNum}>{savedCount || '—'}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </GlassCard>
          <GlassCard padding={16} style={styles.statCard}>
            <Text style={styles.statNum}>{totalSchools ?? '—'}</Text>
            <Text style={styles.statLabel}>Schools</Text>
          </GlassCard>
        </Animated.View>

        {/* Features */}
        <Text style={styles.sectionTitle}>What you can do</Text>
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <Animated.View key={f.label} entering={FadeInDown.duration(400).delay(200 + i * 60)} style={styles.featureCardWrap}>
              <Pressable
                style={styles.featureCardPress}
                onPress={() => navigation.navigate(f.tab)}
              >
                <GlassCard padding={16} style={styles.featureCard}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Top Matches */}
        {featured.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <Text style={styles.sectionTitle}>Top Matches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
              {featured.map((m) => (
                <Pressable key={m.university.id} onPress={() => navigation.navigate('Discover')}>
                  <GlassCard padding={0} style={styles.featuredCard} borderRadius={radius.lg}>
                    <CardBanner
                      name={m.university.name}
                      city={m.university.city}
                      state={m.university.state}
                      country={m.university.country}
                      idx={colorIdx(m.university.id)}
                      height={110}
                    />
                    <View style={styles.featuredInfo}>
                      <Text style={styles.featuredName} numberOfLines={1}>{m.university.name}</Text>
                      <Text style={styles.featuredMeta}>{m.university.city} · {m.score}% match</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },

  hero: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 36,
    overflow: 'hidden',
  },
  heroBlobTR: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.orange,
    opacity: 0.08,
  },
  heroEyebrow: {
    color: colors.orange,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 280,
  },
  heroCta: { alignSelf: 'flex-start' },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 24,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '800', color: colors.orange },
  statLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2, fontWeight: '500' },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 24 },
  featureCardWrap: { width: '47%' },
  featureCardPress: { flex: 1 },
  featureCard: {},
  featureIcon: { fontSize: 26, marginBottom: 8 },
  featureLabel: { fontWeight: '700', fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  featureDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },

  featuredList: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  featuredCard: { width: 200, overflow: 'hidden' },
  featuredInfo: { padding: 10 },
  featuredName: { fontWeight: '700', fontSize: 13, color: colors.textPrimary, marginBottom: 2 },
  featuredMeta: { fontSize: 11, color: colors.textTertiary },
});

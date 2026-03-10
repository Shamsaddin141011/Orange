import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CardBanner } from '../components/CardBanner';
import { colorIdx } from '../lib/transform';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Welcome to</Text>
        <Text style={styles.heroTitle}>OrangeUni</Text>
        <Text style={styles.heroSub}>Find universities that fit you — transparently.</Text>
        <Pressable style={styles.heroCta} onPress={() => navigation.navigate('Discover')}>
          <Text style={styles.heroCtaText}>Start Discovering →</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{matchCount || '—'}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{savedCount || '—'}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalSchools ?? '—'}</Text>
          <Text style={styles.statLabel}>Schools</Text>
        </View>
      </View>

      {/* Feature cards */}
      <Text style={styles.sectionTitle}>What you can do</Text>
      <View style={styles.featureGrid}>
        {FEATURES.map((f) => (
          <Pressable key={f.label} style={styles.featureCard} onPress={() => navigation.navigate(f.tab)}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureLabel}>{f.label}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </Pressable>
        ))}
      </View>

      {/* Featured schools — only shown after a search */}
      {featured.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Matches</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {featured.map((m) => (
              <Pressable key={m.university.id} style={styles.featuredCard} onPress={() => navigation.navigate('Discover')}>
                <CardBanner name={m.university.name} city={m.university.city} state={m.university.state} country={m.university.country} idx={colorIdx(m.university.id)} height={110} />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredName} numberOfLines={1}>{m.university.name}</Text>
                  <Text style={styles.featuredMeta}>{m.university.city} · {m.score}% match</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const FEATURES = [
  { icon: '🔍', label: 'Discover', desc: 'Get matched by SAT, interests & budget', tab: 'Discover' },
  { icon: '❤️', label: 'Shortlist', desc: 'Tag schools as reach, match or safety', tab: 'Shortlist' },
  { icon: '⚖️', label: 'Compare', desc: 'Side-by-side stats for up to 3 schools', tab: 'Compare' },
  { icon: '📋', label: 'Tracker', desc: 'Track essays, deadlines & status', tab: 'Tracker' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  hero: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  heroEyebrow: { color: '#f97316', fontWeight: '600', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  heroSub: { color: '#9ca3af', fontSize: 16, lineHeight: 24, marginBottom: 24 },
  heroCta: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  heroCtaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statNum: { fontSize: 28, fontWeight: '800', color: '#f97316' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', paddingHorizontal: 20, marginTop: 28, marginBottom: 12 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  featureCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featureIcon: { fontSize: 28, marginBottom: 8 },
  featureLabel: { fontWeight: '700', fontSize: 15, color: '#111827', marginBottom: 4 },
  featureDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  featuredList: { paddingHorizontal: 20, gap: 14 },
  featuredCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  featuredImage: { width: 220, height: 120 },
  featuredInfo: { padding: 12 },
  featuredName: { fontWeight: '700', fontSize: 14, color: '#111827', marginBottom: 2 },
  featuredMeta: { fontSize: 12, color: '#6b7280' },
});

import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CardBanner } from '../components/CardBanner';
import { colorIdx } from '../lib/transform';
import { DiscoverStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';

export function UniversityDetailScreen({ route, navigation }: NativeStackScreenProps<DiscoverStackParamList, 'UniversityDetail'>) {
  const { shortlist, toggleShortlist, compareIds, toggleCompare, matches } = useAppStore();
  const uni = matches.find((m) => m.university.id === route.params.id)?.university;
  if (!uni) return <View style={styles.center}><Text>University not found.</Text></View>;

  const saved = !!shortlist[uni.id];
  const compared = compareIds.includes(uni.id);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero banner */}
      <CardBanner name={uni.name} city={uni.city} state={uni.state} country={uni.country} idx={colorIdx(uni.id)} height={220} />

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => toggleShortlist(uni.id)} style={[styles.iconBtn, saved && styles.iconBtnActive]}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? '#f97316' : '#111827'} />
        </Pressable>
        <Pressable onPress={() => toggleCompare(uni.id)} style={[styles.iconBtn, compared && styles.iconBtnActive]}>
          <Ionicons name="git-compare-outline" size={20} color={compared ? '#f97316' : '#111827'} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>{uni.name}</Text>
        <Text style={styles.location}>{uni.city}{uni.state ? `, ${uni.state}` : ''} · {uni.country}</Text>
        <View style={styles.tagRow}>
          {uni.tags.map((t) => (
            <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
          ))}
        </View>
        <Text style={styles.description}>{uni.brief_description}</Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Tuition/yr" value={`$${uni.tuition_estimate.toLocaleString()}`} />
          <StatCard label="Acceptance" value={uni.acceptance_rate ? `${Math.round(uni.acceptance_rate * 100)}%` : 'N/A'} />
          <StatCard label="SAT Mid-50" value={`${uni.sat_middle_50.min}–${uni.sat_middle_50.max}`} />
          <StatCard label="Intl Aid" value={uni.intl_aid} />
        </View>

        <Section title="Programs">
          <View style={styles.pillRow}>
            {uni.majors.map((m) => (
              <View key={m} style={styles.majorPill}><Text style={styles.majorPillText}>{m}</Text></View>
            ))}
          </View>
        </Section>

        <Section title="Deadlines">
          {uni.deadlines.map((d) => (
            <View key={d.label} style={styles.deadlineRow}>
              <Text style={styles.deadlineLabel}>{d.label}</Text>
              <Text style={styles.deadlineDate}>{d.date}</Text>
            </View>
          ))}
        </Section>

        <Section title="Requirements">
          <Text style={styles.bodyText}>SAT/ACT optional by policy; check official site.</Text>
          <Text style={styles.bodyText}>International: English proficiency + visa docs required.</Text>
        </Section>

        <Pressable style={styles.websiteBtn} onPress={() => Linking.openURL(uni.website)}>
          <Ionicons name="globe-outline" size={16} color="#fff" />
          <Text style={styles.websiteBtnText}>Visit Official Website</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: '100%', height: 220 },
  actionBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  iconBtnActive: { backgroundColor: '#fff7ed' },
  content: { padding: 20, backgroundColor: '#f9fafb', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  location: { fontSize: 15, color: '#6b7280', marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tag: { backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontSize: 13, color: '#ea580c', fontWeight: '600' },
  description: { fontSize: 15, color: '#374151', lineHeight: 24, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#f97316', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  majorPill: { backgroundColor: '#f3f4f6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  majorPillText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  deadlineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  deadlineLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  deadlineDate: { fontSize: 14, color: '#6b7280' },
  bodyText: { fontSize: 14, color: '#6b7280', lineHeight: 22, marginBottom: 4 },
  websiteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#f97316', borderRadius: 16, padding: 16, marginTop: 8,
    shadowColor: '#f97316', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  websiteBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

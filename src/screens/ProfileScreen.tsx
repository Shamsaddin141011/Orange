import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export function ProfileScreen() {
  const { profile, shortlist, matches } = useAppStore();
  const savedCount = Object.keys(shortlist).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🎓</Text>
        </View>
        <Text style={styles.name}>My Profile</Text>
        <Text style={styles.subtitle}>{profile.country} · {profile.interests[0] ?? 'No interest set'}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{matches.length}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{savedCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{profile.satTotal ?? '—'}</Text>
          <Text style={styles.statLabel}>SAT</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Academic Info</Text>
        <InfoRow icon="school-outline" label="Country" value={profile.country} />
        <InfoRow icon="ribbon-outline" label="SAT Total" value={profile.satTotal?.toString() ?? 'Not set'} />
        <InfoRow icon="trophy-outline" label="GPA" value={profile.gpa?.toString() ?? 'Not set'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <InfoRow icon="cash-outline" label="Max Budget" value={profile.budgetMax ? `$${profile.budgetMax.toLocaleString()}` : 'Not set'} />
        <InfoRow icon="location-outline" label="Preferred Location" value={profile.preferredLocation ?? 'Not set'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.pillRow}>
          {profile.interests.length ? profile.interests.map((i) => (
            <View key={i} style={styles.pill}><Text style={styles.pillText}>{i}</Text></View>
          )) : <Text style={styles.none}>None selected</Text>}
        </View>
      </View>

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
        <Text style={styles.noticeText}>Data is approximate and for guidance only. Re-run Discover to update your profile.</Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#f97316" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 14 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#f97316', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  avatarText: { fontSize: 36 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  statNum: { fontSize: 24, fontWeight: '800', color: '#f97316' },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500', marginTop: 2 },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    gap: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { flex: 1, fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 13, color: '#f97316', fontWeight: '600' },
  none: { fontSize: 14, color: '#9ca3af' },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 12, color: '#9ca3af', lineHeight: 18 },
});

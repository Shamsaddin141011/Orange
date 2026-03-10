import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CardBanner } from '../components/CardBanner';
import { colorIdx } from '../lib/transform';
import { universities } from '../data/universities';
import { useAppStore } from '../store/useAppStore';

const ROWS: { label: string; key: (u: (typeof universities)[0]) => string }[] = [
  { label: 'Location',    key: (u) => `${u.city}, ${u.country}` },
  { label: 'Tuition/yr', key: (u) => `$${u.tuition_estimate.toLocaleString()}` },
  { label: 'Acceptance', key: (u) => u.acceptance_rate ? `${Math.round(u.acceptance_rate * 100)}%` : 'N/A' },
  { label: 'SAT mid-50', key: (u) => `${u.sat_middle_50.min}–${u.sat_middle_50.max}` },
  { label: 'Intl Aid',   key: (u) => u.intl_aid },
  { label: 'Deadlines',  key: (u) => u.deadlines.map((d) => `${d.label}: ${d.date}`).join('\n') },
  { label: 'Programs',   key: (u) => u.majors.join(', ') },
];

export function CompareScreen() {
  const { compareIds } = useAppStore();
  const items = universities.filter((u) => compareIds.includes(u.id));

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⚖️</Text>
        <Text style={styles.emptyTitle}>Nothing to compare</Text>
        <Text style={styles.emptyText}>Add up to 3 schools from Discover or Shortlist.</Text>
      </View>
    );
  }

  const colWidth = Math.max(200, 340 / items.length);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* School headers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.row, { alignItems: 'stretch' }]}>
            <View style={styles.labelCol} />
            {items.map((u) => (
              <View key={u.id} style={[styles.dataCol, { width: colWidth }]}>
                <CardBanner name={u.name} city={u.city} state={u.state} country={u.country} idx={colorIdx(u.id)} height={80} showText={false} />
                <Text style={styles.schoolName} numberOfLines={2}>{u.name}</Text>
              </View>
            ))}
          </View>

          {ROWS.map((rowDef, i) => (
            <View key={rowDef.label} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
              <View style={styles.labelCol}>
                <Text style={styles.rowLabel}>{rowDef.label}</Text>
              </View>
              {items.map((u) => (
                <View key={u.id} style={[styles.dataCol, { width: colWidth }]}>
                  <Text style={styles.cellText}>{rowDef.key(u)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f9fafb' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowAlt: { backgroundColor: '#fff' },
  labelCol: { width: 90, padding: 12, justifyContent: 'center' },
  rowLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  dataCol: { padding: 12, borderLeftWidth: 1, borderLeftColor: '#f3f4f6' },
  schoolImage: { width: '100%', height: 80, borderRadius: 10, marginBottom: 8 },
  schoolName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cellText: { fontSize: 13, color: '#374151', lineHeight: 20 },
});

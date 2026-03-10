import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CardBanner } from '../components/CardBanner';
import { colorIdx } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';

const STATUS_OPTIONS = ['not_started', 'in_progress', 'submitted'] as const;
const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  not_started: { bg: '#f3f4f6', text: '#6b7280' },
  in_progress: { bg: '#fff7ed', text: '#f97316' },
  submitted:   { bg: '#f0fdf4', text: '#16a34a' },
};

const CHECKLIST_ITEMS = [
  { key: 'essays',          label: 'Essays',          icon: 'document-text-outline' },
  { key: 'recommendations', label: 'Recommendations', icon: 'people-outline' },
  { key: 'testScores',      label: 'Test Scores',     icon: 'ribbon-outline' },
  { key: 'feeWaiver',       label: 'Fee Waiver',      icon: 'cash-outline' },
  { key: 'visaDocs',        label: 'Visa Docs',       icon: 'airplane-outline' },
] as const;

const base = { essays: false, recommendations: false, testScores: false, feeWaiver: false, visaDocs: false, status: 'not_started' as const, reminder: '' };

export function TrackerScreen() {
  const { shortlist, tracker, setTracker, matches } = useAppStore();
  const items = useMemo(
    () => matches.filter((m) => shortlist[m.university.id]).map((m) => m.university),
    [matches, shortlist],
  );

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No schools tracked yet</Text>
        <Text style={styles.emptyText}>Save schools to your shortlist to start tracking.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      data={items}
      keyExtractor={(i) => i.id}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const t = tracker[item.id] ?? base;
        const toggle = (key: keyof typeof base) => setTracker(item.id, { ...t, [key]: !t[key as keyof typeof t] });
        const doneCount = CHECKLIST_ITEMS.filter((c) => t[c.key]).length;
        const statusColors = STATUS_COLORS[t.status] ?? STATUS_COLORS['not_started'];

        return (
          <View style={styles.card}>
            <CardBanner name={item.name} city={item.city} state={item.state} country={item.country} idx={colorIdx(item.id)} height={80} showText={false} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.location}>{item.city} · {item.country}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.statusText, { color: statusColors.text }]}>{STATUS_LABELS[t.status]}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%` as any }]} />
                </View>
                <Text style={styles.progressText}>{doneCount}/{CHECKLIST_ITEMS.length}</Text>
              </View>

              {/* Checklist */}
              <View style={styles.checklist}>
                {CHECKLIST_ITEMS.map((c) => (
                  <Pressable key={c.key} onPress={() => toggle(c.key)} style={styles.checkItem}>
                    <Ionicons
                      name={t[c.key] ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={t[c.key] ? '#16a34a' : '#d1d5db'}
                    />
                    <Text style={[styles.checkLabel, t[c.key] && styles.checkLabelDone]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Status selector */}
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((s) => {
                  const colors = STATUS_COLORS[s];
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setTracker(item.id, { ...t, status: s })}
                      style={[styles.statusOption, t.status === s && { backgroundColor: colors.bg, borderColor: colors.text }]}
                    >
                      <Text style={[styles.statusOptionText, t.status === s && { color: colors.text }]}>
                        {STATUS_LABELS[s]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                placeholder="Reminder note or date…"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                value={t.reminder}
                onChangeText={(reminder) => setTracker(item.id, { ...t, reminder })}
              />
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f9fafb' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardImage: { width: '100%', height: 90 },
  cardBody: { padding: 14, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  location: { fontSize: 13, color: '#6b7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#f3f4f6', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 999 },
  progressText: { fontSize: 12, color: '#6b7280', fontWeight: '600', minWidth: 28 },
  checklist: { gap: 8 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkLabel: { fontSize: 14, color: '#374151' },
  checkLabelDone: { color: '#9ca3af', textDecorationLine: 'line-through' },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusOption: { flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  statusOptionText: { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});

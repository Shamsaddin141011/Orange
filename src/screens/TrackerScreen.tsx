import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CardBanner } from '../components/CardBanner';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { supabase } from '../lib/supabase';
import { colorIdx, rowToUniversity } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';
import { University } from '../types';
import { colors, radius } from '../theme';

const STATUS_OPTIONS = ['not_started', 'in_progress', 'submitted'] as const;
const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
};
const STATUS_CONFIG: Record<string, { color: string; dimColor: string; borderColor: string }> = {
  not_started: { color: colors.textTertiary, dimColor: colors.glassCard, borderColor: colors.glassBorder },
  in_progress: { color: colors.orange, dimColor: colors.orangeDim, borderColor: colors.orangeBorder },
  submitted:   { color: colors.success, dimColor: colors.successDim, borderColor: 'rgba(34,197,94,0.45)' },
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
  const [fetchedUnis, setFetchedUnis] = useState<Record<string, University>>({});

  const shortlistIds = Object.keys(shortlist);
  const matchedUnis = useMemo(() => {
    const map: Record<string, University> = {};
    for (const m of matches) map[m.university.id] = m.university;
    return map;
  }, [matches]);

  useEffect(() => {
    const missingIds = shortlistIds.filter((id) => !matchedUnis[id] && !fetchedUnis[id]);
    if (!missingIds.length) return;
    supabase.from('universities').select('*').in('id', missingIds).then(({ data }) => {
      if (!data) return;
      setFetchedUnis((prev) => {
        const next = { ...prev };
        for (const row of data) next[row.id] = rowToUniversity(row as any);
        return next;
      });
    });
  }, [shortlistIds.join(',')]);

  const items = useMemo(
    () => shortlistIds.map((id) => matchedUnis[id] ?? fetchedUnis[id]).filter(Boolean) as University[],
    [shortlistIds.join(','), matchedUnis, fetchedUnis],
  );

  if (!items.length) {
    return (
      <GlassBackground style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No schools tracked yet</Text>
        <Text style={styles.emptyText}>Save schools to your shortlist to start tracking.</Text>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const t = tracker[item.id] ?? base;
          const toggle = (key: keyof typeof base) => setTracker(item.id, { ...t, [key]: !t[key as keyof typeof t] });
          const doneCount = CHECKLIST_ITEMS.filter((c) => t[c.key]).length;
          const statusCfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG['not_started'];

          return (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 60)}>
              <GlassCard padding={0} style={styles.card} borderRadius={radius.lg}>
                <CardBanner name={item.name} city={item.city} state={item.state} country={item.country} idx={colorIdx(item.id)} height={80} showText={false} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.location}>{item.city} · {item.country}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.dimColor, borderColor: statusCfg.borderColor }]}>
                      <Text style={[styles.statusText, { color: statusCfg.color }]}>{STATUS_LABELS[t.status]}</Text>
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
                          color={t[c.key] ? colors.success : colors.textTertiary}
                        />
                        <Text style={[styles.checkLabel, t[c.key] && styles.checkLabelDone]}>{c.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Status selector */}
                  <View style={styles.statusRow}>
                    {STATUS_OPTIONS.map((s) => {
                      const cfg = STATUS_CONFIG[s];
                      const active = t.status === s;
                      return (
                        <Pressable
                          key={s}
                          onPress={() => setTracker(item.id, { ...t, status: s })}
                          style={[
                            styles.statusOption,
                            active && { backgroundColor: cfg.dimColor, borderColor: cfg.borderColor },
                          ]}
                        >
                          <Text style={[styles.statusOptionText, active && { color: cfg.color }]}>
                            {STATUS_LABELS[s]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    placeholder="Reminder note or date…"
                    placeholderTextColor={colors.textTertiary}
                    style={styles.input}
                    value={t.reminder}
                    onChangeText={(reminder) => setTracker(item.id, { ...t, reminder })}
                  />
                </View>
              </GlassCard>
            </Animated.View>
          );
        }}
      />
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 56, gap: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  card: { overflow: 'hidden' },
  cardBody: { padding: 14, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  location: { fontSize: 12, color: colors.textTertiary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1.5 },
  statusText: { fontSize: 11, fontWeight: '600' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 5, backgroundColor: colors.glassCard, borderRadius: radius.full, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder },
  progressFill: { height: '100%', backgroundColor: colors.orange, borderRadius: radius.full },
  progressText: { fontSize: 12, color: colors.textTertiary, fontWeight: '600', minWidth: 28 },

  checklist: { gap: 8 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkLabel: { fontSize: 14, color: colors.textSecondary },
  checkLabelDone: { color: colors.textTertiary, textDecorationLine: 'line-through' },

  statusRow: { flexDirection: 'row', gap: 6 },
  statusOption: { flex: 1, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.glassBorder, alignItems: 'center' },
  statusOptionText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },

  input: {
    backgroundColor: colors.glassInput,
    borderRadius: radius.sm,
    padding: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.glassInputBorder,
  },
});

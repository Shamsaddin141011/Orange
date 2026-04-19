import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getPalette, getInitials } from '../components/CardBanner';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { supabase } from '../lib/supabase';
import { colorIdx, rowToUniversity } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';
import { MatchResult, University } from '../types';
import { colors, radius } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const COUNTRY_FLAG: Record<string, string> = { USA: '🇺🇸', UK: '🇬🇧', EU: '🇪🇺', China: '🇨🇳' };

type MetricDef = {
  label: string;
  icon: string;
  getValue: (u: University) => string;
  getNumeric?: (u: University) => number;
  lowerIsBetter?: boolean;
  winLabel?: string;
  chipValues?: boolean;
};

const METRICS: MetricDef[] = [
  { label: 'Location', icon: '📍', getValue: (u) => `${u.city}${u.state ? `, ${u.state}` : ''}` },
  { label: 'Tuition / Year', icon: '💰', getValue: (u) => `$${u.tuition_estimate.toLocaleString()}`, getNumeric: (u) => u.tuition_estimate, lowerIsBetter: true, winLabel: 'Best value' },
  { label: 'Acceptance Rate', icon: '🎯', getValue: (u) => u.acceptance_rate != null ? `${Math.round(u.acceptance_rate * 100)}%` : 'N/A', getNumeric: (u) => u.acceptance_rate ?? Infinity, lowerIsBetter: true, winLabel: 'More selective' },
  { label: 'SAT Mid-50', icon: '📝', getValue: (u) => `${u.sat_middle_50.min} – ${u.sat_middle_50.max}` },
  { label: 'Intl. Financial Aid', icon: '🎓', getValue: (u) => u.intl_aid === 'yes' ? 'Available' : u.intl_aid === 'no' ? 'Not available' : 'Unknown' },
  { label: 'Student Size', icon: '👥', getValue: (u) => u.student_size ? `${u.student_size.toLocaleString()} students` : 'N/A' },
  { label: 'Programs', icon: '📚', getValue: () => '', chipValues: true },
];

function getWinnerIndices(unis: University[], metric: MetricDef): boolean[] {
  if (!metric.getNumeric) return unis.map(() => false);
  const vals = unis.map(metric.getNumeric);
  const validVals = vals.filter((v) => v !== Infinity && v > 0);
  if (!validVals.length) return unis.map(() => false);
  const target = metric.lowerIsBetter ? Math.min(...validVals) : Math.max(...validVals);
  const allSame = vals.every((v) => v === vals[0]);
  if (allSame) return unis.map(() => false);
  return vals.map((v) => v === target);
}

export function CompareScreen() {
  const { compareIds, matches, toggleCompare } = useAppStore();
  const [fetchedUnis, setFetchedUnis] = useState<Record<string, University>>({});

  const matchedUnis: Record<string, { uni: University; match: MatchResult }> = {};
  for (const m of matches) matchedUnis[m.university.id] = { uni: m.university, match: m };

  useEffect(() => {
    const missingIds = compareIds.filter((id) => !matchedUnis[id] && !fetchedUnis[id]);
    if (!missingIds.length) return;
    supabase.from('universities').select('*').in('id', missingIds).then(({ data }) => {
      if (!data) return;
      setFetchedUnis((prev) => {
        const next = { ...prev };
        for (const row of data) next[row.id] = rowToUniversity(row as any);
        return next;
      });
    });
  }, [compareIds.join(',')]);

  const compareItems: Array<{ university: University; score?: number }> = compareIds
    .map((id) => {
      if (matchedUnis[id]) return matchedUnis[id].match;
      if (fetchedUnis[id]) return { university: fetchedUnis[id], score: undefined };
      return null;
    })
    .filter(Boolean) as Array<{ university: University; score?: number }>;

  const unis = compareItems.map((m) => m.university);

  if (!unis.length) {
    return (
      <GlassBackground style={styles.empty}>
        <Text style={styles.emptyIcon}>⚖️</Text>
        <Text style={styles.emptyTitle}>Nothing to compare</Text>
        <Text style={styles.emptyText}>
          Add up to 3 schools from Discover or Shortlist.
        </Text>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Compare</Text>

        {/* School header cards */}
        <View style={styles.headerRow}>
          {compareItems.map((item, idx) => {
            const u = item.university;
            const [bgA, bgB] = getPalette(colorIdx(u.id));
            const initials = getInitials(u.name);
            const scoreColor = item.score != null
              ? item.score >= 80 ? colors.success : item.score >= 60 ? colors.orange : colors.textTertiary
              : colors.textTertiary;

            return (
              <Animated.View key={u.id} entering={FadeInDown.duration(400).delay(idx * 80)} style={styles.headerCardWrap}>
                <GlassCard padding={0} style={styles.headerCard} borderRadius={radius.lg}>
                  <View style={[styles.headerBanner, { backgroundColor: bgA }]}>
                    <LinearGradient colors={[bgB, bgA]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <Text style={styles.headerBgText}>{initials}</Text>
                    <View style={styles.headerTopRow}>
                      <Text style={styles.headerFlag}>{COUNTRY_FLAG[u.country] ?? '🏫'}</Text>
                      <Pressable onPress={() => toggleCompare(u.id)} style={styles.removeBtn} hitSlop={8}>
                        <Text style={styles.removeBtnText}>✕</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.headerName} numberOfLines={2}>{u.name}</Text>
                    <Text style={styles.headerCity}>{u.city}{u.state ? `, ${u.state}` : ''}</Text>
                    {item.score != null && (
                      <View style={[styles.scorePill, { borderColor: scoreColor + '88' }]}>
                        <Text style={[styles.scorePillText, { color: scoreColor }]}>{item.score}% match</Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              </Animated.View>
            );
          })}
        </View>

        {/* Metric cards */}
        {METRICS.map((metric, mi) => {
          const winners = getWinnerIndices(unis, metric);
          return (
            <Animated.View key={metric.label} entering={FadeInDown.duration(400).delay(300 + mi * 50)}>
              <GlassCard padding={0} style={styles.metricCard}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricLabelText}>{metric.icon}{'  '}{metric.label}</Text>
                </View>
                <View style={styles.metricRow}>
                  {unis.map((u, i) => {
                    const isWinner = winners[i];
                    const isLast = i === unis.length - 1;
                    return (
                      <View
                        key={u.id}
                        style={[
                          styles.metricCell,
                          !isLast && styles.metricCellDivider,
                          isWinner && styles.metricCellWinner,
                        ]}
                      >
                        {metric.chipValues ? (
                          <View style={styles.chipWrap}>
                            {u.majors.map((m) => (
                              <View key={m} style={styles.chip}>
                                <Text style={styles.chipText}>{m}</Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={[styles.metricValue, isWinner && styles.metricValueWinner]}>
                            {metric.getValue(u)}
                          </Text>
                        )}
                        {isWinner && metric.winLabel && (
                          <View style={styles.winBadge}>
                            <Text style={styles.winBadgeText}>✓ {metric.winLabel}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            </Animated.View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 56, gap: 12 },
  pageTitle: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, letterSpacing: -0.5 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  headerRow: { flexDirection: 'row', gap: 10 },
  headerCardWrap: { flex: 1 },
  headerCard: { overflow: 'hidden' },
  headerBanner: { height: 90, overflow: 'hidden', justifyContent: 'flex-end' },
  headerBgText: { position: 'absolute', bottom: -14, left: 8, fontSize: 72, fontWeight: '900', color: 'rgba(255,255,255,0.06)', letterSpacing: -2 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  headerFlag: { fontSize: 20 },
  removeBtn: { padding: 2 },
  removeBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  headerInfo: { padding: 10, gap: 3 },
  headerName: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, lineHeight: 17 },
  headerCity: { fontSize: 10, color: colors.textTertiary },
  scorePill: { alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  scorePillText: { fontSize: 10, fontWeight: '700' },

  metricCard: { overflow: 'hidden' },
  metricLabelRow: { borderBottomWidth: 1, borderBottomColor: colors.glassBorder, paddingHorizontal: 14, paddingVertical: 12 },
  metricLabelText: { fontSize: 12, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  metricRow: { flexDirection: 'row' },
  metricCell: { flex: 1, padding: 12, gap: 6 },
  metricCellDivider: { borderRightWidth: 1, borderRightColor: colors.glassBorder },
  metricCellWinner: { backgroundColor: colors.successDim },
  metricValue: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, lineHeight: 20 },
  metricValueWinner: { color: colors.success },
  winBadge: { alignSelf: 'flex-start', backgroundColor: colors.successDim, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  winBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { backgroundColor: colors.orangeDim, borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 3 },
  chipText: { fontSize: 10, fontWeight: '600', color: colors.orange },
});

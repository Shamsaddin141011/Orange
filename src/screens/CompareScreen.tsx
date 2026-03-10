import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getPalette, getInitials } from '../components/CardBanner';
import { colorIdx } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';
import { MatchResult, University } from '../types';

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
  {
    label: 'Location',
    icon: '📍',
    getValue: (u) => `${u.city}${u.state ? `, ${u.state}` : ''}`,
  },
  {
    label: 'Tuition / Year',
    icon: '💰',
    getValue: (u) => `$${u.tuition_estimate.toLocaleString()}`,
    getNumeric: (u) => u.tuition_estimate,
    lowerIsBetter: true,
    winLabel: 'Best value',
  },
  {
    label: 'Acceptance Rate',
    icon: '🎯',
    getValue: (u) => u.acceptance_rate != null ? `${Math.round(u.acceptance_rate * 100)}%` : 'N/A',
    getNumeric: (u) => u.acceptance_rate ?? Infinity,
    lowerIsBetter: true,
    winLabel: 'More selective',
  },
  {
    label: 'SAT Mid-50',
    icon: '📝',
    getValue: (u) => `${u.sat_middle_50.min} – ${u.sat_middle_50.max}`,
  },
  {
    label: 'Intl. Financial Aid',
    icon: '🎓',
    getValue: (u) =>
      u.intl_aid === 'yes' ? 'Available' : u.intl_aid === 'no' ? 'Not available' : 'Unknown',
  },
  {
    label: 'Student Size',
    icon: '👥',
    getValue: (u) => u.student_size ? `${u.student_size.toLocaleString()} students` : 'N/A',
  },
  {
    label: 'Programs',
    icon: '📚',
    getValue: () => '',
    chipValues: true,
  },
];

function getWinnerIndices(unis: University[], metric: MetricDef): boolean[] {
  if (!metric.getNumeric) return unis.map(() => false);
  const vals = unis.map(metric.getNumeric);
  const validVals = vals.filter((v) => v !== Infinity && v > 0);
  if (!validVals.length) return unis.map(() => false);
  const target = metric.lowerIsBetter ? Math.min(...validVals) : Math.max(...validVals);
  // Only show winner if there's actually a difference
  const allSame = vals.every((v) => v === vals[0]);
  if (allSame) return unis.map(() => false);
  return vals.map((v) => v === target);
}

export function CompareScreen() {
  const { compareIds, matches } = useAppStore();
  const compareItems = matches.filter((m) => compareIds.includes(m.university.id));
  const unis = compareItems.map((m) => m.university);

  if (!unis.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⚖️</Text>
        <Text style={styles.emptyTitle}>Nothing to compare</Text>
        <Text style={styles.emptyText}>
          Add up to 3 schools from Discover or Shortlist to compare them side by side.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── School header cards ── */}
      <View style={styles.headerRow}>
        {compareItems.map((item) => {
          const u = item.university;
          const [bgA, bgB] = getPalette(colorIdx(u.id));
          const initials = getInitials(u.name);
          const scoreColor =
            item.score >= 80 ? '#16a34a' : item.score >= 60 ? '#f97316' : '#6b7280';

          return (
            <View key={u.id} style={styles.headerCard}>
              {/* Coloured banner */}
              <View style={[styles.headerBanner, { backgroundColor: bgA }]}>
                <View style={[styles.headerAccent, { backgroundColor: bgB }]} />
                <Text style={styles.headerBgText}>{initials}</Text>
                <Text style={styles.headerFlag}>{COUNTRY_FLAG[u.country] ?? '🏫'}</Text>
              </View>

              {/* Info below banner */}
              <View style={styles.headerInfo}>
                <Text style={styles.headerName} numberOfLines={2}>{u.name}</Text>
                <Text style={styles.headerCity}>
                  {u.city}{u.state ? `, ${u.state}` : ''}
                </Text>
                <View style={[styles.scorePill, { borderColor: scoreColor }]}>
                  <Text style={[styles.scorePillText, { color: scoreColor }]}>
                    {item.score}% match
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Metric cards ── */}
      {METRICS.map((metric) => {
        const winners = getWinnerIndices(unis, metric);

        return (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>
              {metric.icon}{'  '}{metric.label}
            </Text>

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
                      <Text
                        style={[
                          styles.metricValue,
                          isWinner && styles.metricValueWinner,
                        ]}
                      >
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
          </View>
        );
      })}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, gap: 12 },

  // ── Empty state ──
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f3f4f6',
    padding: 32,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── School headers ──
  headerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  headerCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerBanner: {
    height: 90,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 10,
  },
  headerAccent: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -50,
    right: -30,
    opacity: 0.55,
  },
  headerBgText: {
    position: 'absolute',
    bottom: -10,
    left: 10,
    fontSize: 72,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.07)',
    letterSpacing: -2,
  },
  headerFlag: { fontSize: 24 },
  headerInfo: { padding: 12, gap: 3 },
  headerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 18,
  },
  headerCity: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
  },
  scorePill: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scorePillText: { fontSize: 11, fontWeight: '700' },

  // ── Metric cards ──
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  metricRow: {
    flexDirection: 'row',
  },
  metricCell: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  metricCellDivider: {
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
  },
  metricCellWinner: {
    backgroundColor: '#f0fdf4',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  metricValueWinner: {
    color: '#15803d',
  },
  winBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  winBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },

  // ── Program chips ──
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ea580c',
  },
});

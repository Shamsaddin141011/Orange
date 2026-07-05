import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, Plus, X } from 'lucide-react-native';
import { EmptyState } from '../components/ui/EmptyState';
import { useAppStore } from '../store/useAppStore';
import { useThemeColors, fonts, radius, iconSize, layout } from '../theme';
import { useMemo } from 'react';

const COMPARE_COLORS = ['#FF5500', '#0EA5E9', '#16A34A'];

const STAT_ROWS = [
  { label: 'Location',    getValue: (u: any) => `${u.city}${u.state ? `, ${u.state}` : ''}, ${u.country}` },
  { label: 'QS Rank',     getValue: (u: any) => u.qs_rank ? `#${u.qs_rank}` : 'N/A' },
  { label: 'Acceptance',  getValue: (u: any) => u.acceptance_rate ? `${Math.round(u.acceptance_rate * 100)}%` : 'N/A' },
  { label: 'Tuition/yr',  getValue: (u: any) => `$${u.tuition_estimate?.toLocaleString() ?? 'N/A'}` },
  { label: 'SAT Range',   getValue: (u: any) => u.sat_middle_50 ? `${u.sat_middle_50.min}–${u.sat_middle_50.max}` : 'N/A' },
  { label: 'Intl Aid',    getValue: (u: any) => u.intl_aid ?? 'N/A' },
];

export function CompareScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { compareIds, toggleCompare, matches } = useAppStore();

  const compareUnis = useMemo(
    () => compareIds.map(id => matches.find(m => m.university.id === id)?.university).filter(Boolean),
    [compareIds, matches],
  );

  if (compareIds.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <EmptyState
          icon={BarChart3}
          title="Nothing to compare"
          subtitle="Add up to 3 universities from Discover or your Shortlist to compare them side by side."
          actionLabel="Browse Universities"
          onAction={() => navigation.navigate('Discover')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: c.divider }]}>
        <Text style={[styles.title, { color: c.textPrimary }]}>Compare</Text>
        <Text style={[styles.subtitle, { color: c.textTertiary }]}>
          {compareUnis.length} of 3 selected
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Selected uni chips */}
        <View style={styles.chipsRow}>
          {compareUnis.map((uni, i) => uni && (
            <View key={uni.id} style={[styles.uniChip, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
              <View style={[styles.colorDot, { backgroundColor: COMPARE_COLORS[i] }]} />
              <Text style={[styles.chipText, { color: c.textPrimary }]} numberOfLines={1}>{uni.name}</Text>
              <Pressable onPress={() => toggleCompare(uni.id)} hitSlop={8} accessibilityLabel={`Remove ${uni.name}`}>
                <X size={14} color={c.textTertiary} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
          {compareIds.length < 3 && (
            <Pressable
              style={[styles.addChip, { backgroundColor: c.primarySurface, borderColor: c.primaryBorder }]}
              onPress={() => navigation.navigate('Discover')}
              accessibilityLabel="Add university to compare"
            >
              <Plus size={14} color={c.primary} strokeWidth={2} />
              <Text style={[styles.addChipText, { color: c.primary }]}>Add</Text>
            </Pressable>
          )}
        </View>

        {/* Comparison table */}
        <View style={[styles.table, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
          <View style={[styles.tableHeader, { borderBottomColor: c.divider }]}>
            <View style={styles.labelCell} />
            {compareUnis.map((uni, i) => uni && (
              <View key={uni.id} style={styles.valueCell}>
                <View style={[styles.colorBar, { backgroundColor: COMPARE_COLORS[i] }]} />
                <Text style={[styles.headerName, { color: c.textPrimary }]} numberOfLines={2}>{uni.name}</Text>
              </View>
            ))}
          </View>

          {STAT_ROWS.map((row, rowIdx) => (
            <View
              key={row.label}
              style={[
                styles.tableRow,
                { borderBottomColor: c.divider },
                rowIdx % 2 === 0 && { backgroundColor: c.bgMuted },
              ]}
            >
              <Text style={[styles.rowLabel, { color: c.textTertiary }]}>{row.label}</Text>
              {compareUnis.map((uni) => uni && (
                <Text key={uni.id} style={[styles.rowValue, { color: c.textPrimary }]}>
                  {row.getValue(uni)}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Match scores */}
        {compareUnis.some(u => u && matches.find(m => m.university.id === u.id)) && (
          <View style={[styles.matchSection, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
            <Text style={[styles.matchTitle, { color: c.textPrimary }]}>Match Scores</Text>
            {compareUnis.map((uni, i) => {
              if (!uni) return null;
              const match = matches.find(m => m.university.id === uni.id);
              if (!match) return null;
              return (
                <View key={uni.id} style={styles.matchRow}>
                  <View style={[styles.colorDot, { backgroundColor: COMPARE_COLORS[i] }]} />
                  <Text style={[styles.matchName, { color: c.textSecondary }]} numberOfLines={1}>{uni.name}</Text>
                  <View style={styles.matchBarWrap}>
                    <View style={[styles.matchBarBg, { backgroundColor: c.bgMuted }]}>
                      <View style={[styles.matchBarFill, { width: `${match.score}%` as any, backgroundColor: COMPARE_COLORS[i] }]} />
                    </View>
                  </View>
                  <Text style={[styles.matchScore, { color: COMPARE_COLORS[i] }]}>{match.score}%</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: insets.bottom + layout.tabBarHeight + layout.tabBarBottomOffset + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontFamily: 'Syne_800ExtraBold' },
  subtitle: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 2 },
  scroll: { padding: layout.screenPadding, gap: 16 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  uniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: 180,
  },
  colorDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  chipText: { flex: 1, fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  addChipText: { fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' },

  table: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, padding: 12, gap: 8 },
  colorBar: { height: 3, borderRadius: 2, width: '100%', marginBottom: 4 },
  labelCell: { flex: 1 },
  valueCell: { flex: 1 },
  headerName: { fontSize: 12, fontFamily: 'Syne_700Bold', lineHeight: 16 },

  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  rowLabel: { flex: 1, fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium' },
  rowValue: { flex: 1, fontSize: 12, fontFamily: 'SpaceGrotesk_400Regular' },

  matchSection: { borderRadius: radius.lg, borderWidth: 1, padding: 16, gap: 12 },
  matchTitle: { fontSize: 14, fontFamily: 'Syne_700Bold', marginBottom: 4 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchName: { width: 90, fontSize: 12, fontFamily: 'SpaceGrotesk_400Regular' },
  matchBarWrap: { flex: 1 },
  matchBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  matchBarFill: { height: '100%', borderRadius: 3 },
  matchScore: { width: 36, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'right' },
});

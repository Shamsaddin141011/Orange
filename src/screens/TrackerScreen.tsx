import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckSquare, Check, FileText, Users, Award, CreditCard, Plane } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colorIdx, rowToUniversity } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';
import { University } from '../types';
import { EmptyState } from '../components/ui/EmptyState';
import { useThemeColors, radius, iconSize, layout } from '../theme';

const CHECKLIST_ITEMS = [
  { key: 'essays',          label: 'Essays',          Icon: FileText },
  { key: 'recommendations', label: 'Recommendations', Icon: Users },
  { key: 'testScores',      label: 'Test Scores',     Icon: Award },
  { key: 'feeWaiver',       label: 'Fee Waiver',      Icon: CreditCard },
  { key: 'visaDocs',        label: 'Visa Docs',       Icon: Plane },
] as const;

const base = { essays: false, recommendations: false, testScores: false, feeWaiver: false, visaDocs: false, status: 'not_started' as const, reminder: '' };

function DeadlineBadge({ deadline }: { deadline?: string }) {
  const c = useThemeColors();
  if (!deadline) return null;

  const days = Math.ceil((new Date(deadline + 'T12:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const bg = days > 30 ? c.successSurface : days > 7 ? c.warningSurface : c.dangerSurface;
  const text = days > 30 ? c.success : days > 7 ? c.warning : c.danger;
  const border = days > 30 ? c.successBorder : days > 7 ? c.warningBorder : c.dangerBorder;
  const label = days < 0 ? 'OVERDUE' : days === 0 ? 'TODAY' : `${days}d left`;

  return (
    <View style={[styles.deadlineBadge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.deadlineBadgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const c = useThemeColors();
  const pct = total === 0 ? 0 : done / total;
  const width = useSharedValue(0);

  useEffect(() => { width.value = withTiming(pct, { duration: 600 }); }, [pct]);

  const animStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` as any }));

  return (
    <View>
      <View style={[styles.progressBg, { backgroundColor: c.bgMuted }]}>
        <Animated.View style={[styles.progressFill, { backgroundColor: c.primary }, animStyle]} />
      </View>
      <Text style={[styles.progressLabel, { color: c.textTertiary }]}>{done} of {total} tasks complete</Text>
    </View>
  );
}

export function TrackerScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
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
      <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <EmptyState
          icon={CheckSquare}
          title="No applications tracked"
          subtitle="Add universities to your shortlist first, then track your application progress here."
          actionLabel="Go to Shortlist"
          onAction={() => navigation.navigate('Shortlist')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + layout.tabBarHeight + layout.tabBarBottomOffset + 16 }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.title, { color: c.textPrimary }]}>Applications</Text>
            <View style={[styles.countBadge, { backgroundColor: c.primarySurface }]}>
              <Text style={[styles.countText, { color: c.primary }]}>{items.length}</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const state = tracker[item.id] ?? base;
          const checkboxKeys = CHECKLIST_ITEMS.map(i => i.key) as (keyof typeof state)[];
          const done = checkboxKeys.filter(k => state[k] === true).length;
          const total = checkboxKeys.length;
          const deadline = shortlist[item.id]?.deadline;

          return (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 50)}>
              <View style={[styles.card, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.uniName, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                    {deadline && (
                      <Text style={[styles.deadlineText, { color: c.textTertiary }]}>
                        Due {new Date(deadline + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                  <DeadlineBadge deadline={deadline} />
                </View>

                <ProgressBar done={done} total={total} />

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: c.divider }]} />

                {/* Checklist */}
                {CHECKLIST_ITEMS.map(({ key, label, Icon }) => {
                  const checked = state[key as keyof typeof state] === true;
                  return (
                    <Pressable
                      key={key}
                      style={[styles.checkItem, { borderBottomColor: c.divider }]}
                      onPress={() => setTracker(item.id, { ...state, [key]: !checked })}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      accessibilityLabel={label}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: checked ? c.primary : c.surfaceBorder },
                        checked && { backgroundColor: c.primary },
                      ]}>
                        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
                      </View>
                      <Icon size={iconSize.sm} color={checked ? c.textTertiary : c.primary} strokeWidth={1.5} />
                      <Text style={[
                        styles.checkLabel,
                        { color: checked ? c.textTertiary : c.textPrimary },
                        checked && styles.strikethrough,
                      ]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, gap: 12 },

  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  title: { fontSize: 28, fontFamily: 'Syne_800ExtraBold' },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  countText: { fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },

  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  uniName: { fontSize: 16, fontFamily: 'Syne_700Bold', marginBottom: 2 },
  deadlineText: { fontSize: 12, fontFamily: 'SpaceGrotesk_400Regular' },

  deadlineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1.5,
    flexShrink: 0,
  },
  deadlineBadgeText: { fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold' },

  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { fontSize: 12, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 4 },

  divider: { height: 1 },

  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { flex: 1, fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' },
  strikethrough: { textDecorationLine: 'line-through' },
});

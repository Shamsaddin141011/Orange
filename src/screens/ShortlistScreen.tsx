import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CalendarClock, Heart, Check } from 'lucide-react-native';
import { CalendarPickerModal } from '../components/CalendarPickerModal';
import { CardBanner } from '../components/CardBanner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { colorIdx, rowToUniversity } from '../lib/transform';
import { supabase } from '../lib/supabase';
import { ShortlistStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { ApplicationStatus, ShortlistTag, University } from '../types';
import { useThemeColors, radius, iconSize, shadow, layout } from '../theme';

type Props = NativeStackScreenProps<ShortlistStackParamList, 'ShortlistMain'>;

const TAG_CONFIG = {
  reach:  { label: 'Reach',  getColors: (c: any) => ({ text: c.danger,   bg: c.dangerSurface,   border: c.dangerBorder   }) },
  match:  { label: 'Match',  getColors: (c: any) => ({ text: c.primary,  bg: c.primarySurface,  border: c.primaryBorder  }) },
  safety: { label: 'Safety', getColors: (c: any) => ({ text: c.success,  bg: c.successSurface,  border: c.successBorder  }) },
} as const;

const STATUS_OPTIONS: ApplicationStatus[] = ['unsent', 'pending', 'accepted', 'not_accepted'];

function formatDeadline(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ShortlistScreen({ navigation }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const navRoot = useNavigation<any>();
  const { shortlist, setShortlistMeta, toggleShortlist, toggleCompare, compareIds, matches } = useAppStore();
  const [fetchedUnis, setFetchedUnis] = useState<Record<string, University>>({});
  const [calendarFor, setCalendarFor] = useState<string | null>(null);

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

  const tagCounts = useMemo(() => {
    const counts = { reach: 0, match: 0, safety: 0 };
    for (const id of shortlistIds) {
      const tag = shortlist[id]?.tag ?? 'match';
      counts[tag]++;
    }
    return counts;
  }, [shortlist, shortlistIds.join(',')]);

  if (!items.length) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <EmptyState
          icon={Heart}
          title="Nothing shortlisted yet"
          subtitle="Save universities from Discover to build your list."
          actionLabel="Browse Universities"
          onAction={() => navRoot.navigate('Discover')}
        />
      </View>
    );
  }

  const activeCalendarMeta = calendarFor ? shortlist[calendarFor] : undefined;

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.title, { color: c.textPrimary }]}>My Shortlist</Text>
            <Text style={[styles.count, { color: c.textTertiary }]}>
              {items.length} {items.length === 1 ? 'university' : 'universities'} saved
            </Text>
            <View style={styles.tagSummary}>
              {(Object.keys(TAG_CONFIG) as ShortlistTag[]).map((tag) => {
                const cfg = TAG_CONFIG[tag].getColors(c);
                return (
                  <View key={tag} style={styles.tagSummaryItem}>
                    <View style={[styles.tagDot, { backgroundColor: cfg.text }]} />
                    <Text style={[styles.tagSummaryLabel, { color: cfg.text }]}>
                      {tagCounts[tag]} {TAG_CONFIG[tag].label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const meta = shortlist[item.id] ?? { tag: 'match' as ShortlistTag, note: '', appStatus: 'unsent' as ApplicationStatus };
          const compared = compareIds.includes(item.id);

          return (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 50)}>
              <View style={[styles.card, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
                {/* Banner */}
                <Pressable onPress={() => navigation.navigate('UniversityDetail', { id: item.id })}>
                  <CardBanner name={item.name} city={item.city} state={item.state} country={item.country} idx={colorIdx(item.id)} height={80} showText={false} />
                </Pressable>

                <View style={styles.cardBody}>
                  {/* Name + remove */}
                  <View style={styles.nameRow}>
                    <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('UniversityDetail', { id: item.id })}>
                      <Text style={[styles.name, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.location, { color: c.textTertiary }]}>{item.city} · {item.country}</Text>
                    </Pressable>
                    <Pressable onPress={() => toggleShortlist(item.id)} hitSlop={8} accessibilityLabel="Remove from shortlist">
                      <X size={iconSize.sm} color={c.textTertiary} strokeWidth={2} />
                    </Pressable>
                  </View>

                  {/* Tag row */}
                  <View style={styles.tagRow}>
                    {(Object.keys(TAG_CONFIG) as ShortlistTag[]).map((tag) => {
                      const active = meta.tag === tag;
                      const cfg = TAG_CONFIG[tag].getColors(c);
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => setShortlistMeta(item.id, { tag })}
                          style={[
                            styles.tagBtn,
                            {
                              borderColor: active ? cfg.border : c.surfaceBorder,
                              backgroundColor: active ? cfg.bg : 'transparent',
                            },
                          ]}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: active }}
                          accessibilityLabel={TAG_CONFIG[tag].label}
                        >
                          <Text style={[styles.tagBtnText, { color: active ? cfg.text : c.textTertiary }]}>
                            {TAG_CONFIG[tag].label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Note */}
                  <TextInput
                    placeholder="Add a note…"
                    placeholderTextColor={c.textTertiary}
                    value={meta.note}
                    onChangeText={(note) => setShortlistMeta(item.id, { note })}
                    style={[
                      styles.note,
                      { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.textPrimary },
                      Platform.OS === 'web' && ({ outlineWidth: 0 } as any),
                    ]}
                    multiline
                  />

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: c.divider }]} />
                  <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>APPLICATION</Text>

                  {/* Deadline */}
                  <Pressable
                    style={[styles.deadlineRow, { backgroundColor: c.bgMuted, borderColor: c.surfaceBorder }]}
                    onPress={() => setCalendarFor(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Set application deadline"
                  >
                    <CalendarClock size={iconSize.md} color={c.primary} strokeWidth={1.5} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deadlineCaption, { color: c.textTertiary }]}>Deadline of Application</Text>
                      {meta.deadline
                        ? <Text style={[styles.deadlineDate, { color: c.primary }]}>{formatDeadline(meta.deadline)}</Text>
                        : <Text style={[styles.deadlinePlaceholder, { color: c.textTertiary }]}>Tap to set a date</Text>
                      }
                    </View>
                    {meta.deadline && (
                      <Pressable hitSlop={10} onPress={() => setShortlistMeta(item.id, { deadline: undefined })}>
                        <X size={14} color={c.textTertiary} strokeWidth={2} />
                      </Pressable>
                    )}
                  </Pressable>

                  {/* Status pills */}
                  <View style={styles.statusRow}>
                    {STATUS_OPTIONS.map((s) => {
                      const active = (meta.appStatus ?? 'unsent') === s;
                      return (
                        <Pressable
                          key={s}
                          onPress={() => setShortlistMeta(item.id, { appStatus: s })}
                          style={[
                            styles.statusPill,
                            { borderColor: active ? c.primaryBorder : c.surfaceBorder },
                            active && { backgroundColor: c.primarySurface },
                          ]}
                        >
                          <StatusBadge status={s} />
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Compare */}
                  <Pressable
                    onPress={() => toggleCompare(item.id)}
                    style={[
                      styles.compareBtn,
                      { borderColor: compared ? c.primaryBorder : c.surfaceBorder },
                      compared && { backgroundColor: c.primarySurface },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={compared ? 'Remove from compare' : 'Add to compare'}
                  >
                    {compared && <Check size={14} color={c.primary} strokeWidth={2} />}
                    <Text style={[styles.compareBtnText, { color: compared ? c.primary : c.textTertiary }]}>
                      {compared ? 'Added to Compare' : '+ Add to Compare'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        }}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + layout.tabBarHeight + layout.tabBarBottomOffset + 16 }]}
      />

      <CalendarPickerModal
        visible={calendarFor !== null}
        value={activeCalendarMeta?.deadline}
        onConfirm={(date) => {
          if (calendarFor) setShortlistMeta(calendarFor, { deadline: date });
          setCalendarFor(null);
        }}
        onDismiss={() => setCalendarFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, gap: 14 },

  listHeader: { marginBottom: 8 },
  title: { fontSize: 28, fontFamily: 'Syne_800ExtraBold', marginBottom: 4 },
  count: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 12 },
  tagSummary: { flexDirection: 'row', gap: 14 },
  tagSummaryItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tagDot: { width: 7, height: 7, borderRadius: 4 },
  tagSummaryLabel: { fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' },

  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardBody: { padding: 14, gap: 10 },

  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 15, fontFamily: 'Syne_700Bold', marginBottom: 2 },
  location: { fontSize: 12, fontFamily: 'SpaceGrotesk_400Regular' },

  tagRow: { flexDirection: 'row', gap: 8 },
  tagBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  tagBtnText: { fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },

  note: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
    minHeight: 40,
  },

  divider: { height: 1 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  deadlineCaption: { fontSize: 11, fontFamily: 'SpaceGrotesk_500Medium', marginBottom: 2 },
  deadlineDate: { fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' },
  deadlinePlaceholder: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' },

  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusPill: { borderRadius: 999, borderWidth: 1.5, overflow: 'hidden' },

  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  compareBtnText: { fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },
});

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CalendarClock, CalendarPlus, Heart, Scale, ChevronDown, ArrowUpDown, Check } from 'lucide-react-native';
import { CalendarPickerModal } from '../components/CalendarPickerModal';
import { UniImage } from '../components/UniImage';
import { EmptyState } from '../components/ui/EmptyState';
import { colorIdx, rowToUniversity } from '../lib/transform';
import { supabase } from '../lib/supabase';
import { ShortlistStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { ApplicationStatus, ShortlistMeta, ShortlistTag, University } from '../types';
import { useThemeColors, ThemeColors, iconSize, layout } from '../theme';

type Props = NativeStackScreenProps<ShortlistStackParamList, 'ShortlistMain'>;

/** Above this width each shortlisted school is a wide row instead of a stacked card. */
const WIDE_BREAKPOINT = 700;

const TAGS: ShortlistTag[] = ['reach', 'match', 'safety'];
const TAG_LABEL: Record<ShortlistTag, string> = { reach: 'Reach', match: 'Match', safety: 'Safety' };
function tagColors(c: ThemeColors, tag: ShortlistTag) {
  if (tag === 'reach') return { text: c.danger, bg: c.dangerSurface, border: c.dangerBorder };
  if (tag === 'match') return { text: c.warning, bg: c.warningSurface, border: c.warningBorder };
  return { text: c.success, bg: c.successSurface, border: c.successBorder };
}

const STATUS_OPTIONS: ApplicationStatus[] = ['unsent', 'pending', 'accepted', 'not_accepted'];
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  unsent: 'Not started',
  pending: 'Pending',
  accepted: 'Accepted',
  not_accepted: 'Not accepted',
};
function statusColors(c: ThemeColors, s: ApplicationStatus) {
  if (s === 'pending') return { text: c.warning, bg: c.warningSurface, border: c.warningBorder };
  if (s === 'accepted') return { text: c.success, bg: c.successSurface, border: c.successBorder };
  if (s === 'not_accepted') return { text: c.danger, bg: c.dangerSurface, border: c.dangerBorder };
  return { text: c.textSecondary, bg: c.surface, border: c.surfaceBorder };
}

type SortKey = 'deadline' | 'match' | 'tag';
const SORT_LABEL: Record<SortKey, string> = { deadline: 'Deadline', match: 'Match %', tag: 'Reach → Safety' };
const SORT_ORDER: SortKey[] = ['deadline', 'match', 'tag'];

function formatDeadline(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Whole days from today to the deadline (negative once it has passed). */
function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((new Date(iso + 'T12:00:00').getTime() - today.getTime()) / 86_400_000);
}

function daysLabel(days: number) {
  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

const DEFAULT_META: ShortlistMeta = { tag: 'match', note: '', appStatus: 'unsent' };

export function ShortlistScreen({ navigation }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const navRoot = useNavigation<any>();
  const { shortlist, setShortlistMeta, toggleShortlist, toggleCompare, compareIds, matches } = useAppStore();
  const [fetchedUnis, setFetchedUnis] = useState<Record<string, University>>({});
  const [calendarFor, setCalendarFor] = useState<string | null>(null);
  const [statusFor, setStatusFor] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('deadline');

  const shortlistIds = Object.keys(shortlist);

  const matchedUnis = useMemo(() => {
    const map: Record<string, { uni: University; score: number }> = {};
    for (const m of matches) map[m.university.id] = { uni: m.university, score: m.score };
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

  const items = useMemo(() => {
    const list = shortlistIds
      .map((id) => {
        const uni = matchedUnis[id]?.uni ?? fetchedUnis[id];
        return uni ? { uni, score: matchedUnis[id]?.score as number | undefined, meta: shortlist[id] ?? DEFAULT_META } : null;
      })
      .filter(Boolean) as { uni: University; score?: number; meta: ShortlistMeta }[];

    const deadlineValue = (d?: string) => (d ? new Date(d + 'T12:00:00').getTime() : Number.POSITIVE_INFINITY);
    return list.sort((a, b) => {
      if (sortKey === 'match') return (b.score ?? -1) - (a.score ?? -1);
      if (sortKey === 'tag') return TAGS.indexOf(a.meta.tag) - TAGS.indexOf(b.meta.tag);
      return deadlineValue(a.meta.deadline) - deadlineValue(b.meta.deadline);
    });
  }, [shortlistIds.join(','), matchedUnis, fetchedUnis, shortlist, sortKey]);

  const tagCounts = useMemo(() => {
    const counts = { reach: 0, match: 0, safety: 0 };
    for (const id of shortlistIds) counts[shortlist[id]?.tag ?? 'match']++;
    return counts;
  }, [shortlist, shortlistIds.join(',')]);

  const nextDeadlineDays = useMemo(() => {
    const upcoming = shortlistIds
      .map((id) => shortlist[id]?.deadline)
      .filter(Boolean)
      .map((d) => daysUntil(d as string))
      .filter((d) => d >= 0);
    return upcoming.length ? Math.min(...upcoming) : null;
  }, [shortlist, shortlistIds.join(',')]);

  if (!items.length) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <EmptyState
          icon={Heart}
          title="Nothing shortlisted yet"
          subtitle="Save universities from Discover to build your list."
          actionLabel="Browse universities"
          onAction={() => navRoot.navigate('Discover')}
        />
      </View>
    );
  }

  const openDetail = (id: string) => navigation.navigate('UniversityDetail', { id });
  const cycleSort = () => setSortKey((k) => SORT_ORDER[(SORT_ORDER.indexOf(k) + 1) % SORT_ORDER.length] ?? 'deadline');

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(i) => i.uni.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: c.textPrimary }]}>Shortlist</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryText, { color: c.textTertiary }]}>{items.length} saved</Text>
                  {TAGS.map((tag) => (
                    <Text key={tag} style={[styles.summaryText, { color: tagColors(c, tag).text }]}>
                      {' · '}{tagCounts[tag]} {TAG_LABEL[tag].toLowerCase()}
                    </Text>
                  ))}
                </View>
                {nextDeadlineDays !== null && (
                  <Text style={[styles.summaryText, { color: c.textTertiary, marginTop: 2 }]}>
                    Next deadline {nextDeadlineDays === 0 ? 'is today' : `in ${nextDeadlineDays} ${nextDeadlineDays === 1 ? 'day' : 'days'}`}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={cycleSort}
                style={[styles.sortBtn, { borderColor: c.surfaceBorder }]}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${SORT_LABEL[sortKey]}. Tap to change.`}
              >
                <ArrowUpDown size={14} color={c.textSecondary} strokeWidth={1.75} />
                <Text style={[styles.sortText, { color: c.textSecondary }]}>{SORT_LABEL[sortKey]}</Text>
              </Pressable>
            </View>

            {wide && (
              <View style={[styles.rowGrid, styles.columnHeads]}>
                <View style={styles.colImage} />
                <Text style={[styles.colHead, styles.colUni, { color: c.textTertiary }]}>UNIVERSITY</Text>
                <Text style={[styles.colHead, styles.colNote, { color: c.textTertiary }]}>NOTE</Text>
                <Text style={[styles.colHead, styles.colDeadline, { color: c.textTertiary }]}>DEADLINE</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 8) * 40)}>
            <ShortlistItem
              uni={item.uni}
              score={item.score}
              meta={item.meta}
              wide={wide}
              compared={compareIds.includes(item.uni.id)}
              onOpen={() => openDetail(item.uni.id)}
              onRemove={() => toggleShortlist(item.uni.id)}
              onToggleCompare={() => toggleCompare(item.uni.id)}
              onTag={(tag) => setShortlistMeta(item.uni.id, { tag })}
              onNote={(note) => setShortlistMeta(item.uni.id, { note })}
              onPickDeadline={() => setCalendarFor(item.uni.id)}
              onClearDeadline={() => setShortlistMeta(item.uni.id, { deadline: undefined })}
              onPickStatus={() => setStatusFor(item.uni.id)}
            />
          </Animated.View>
        )}
        contentContainerStyle={[
          styles.list,
          wide && styles.listWide,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + layout.tabBarHeight + layout.tabBarBottomOffset + 16 },
        ]}
      />

      <CalendarPickerModal
        visible={calendarFor !== null}
        value={calendarFor ? shortlist[calendarFor]?.deadline : undefined}
        onConfirm={(date) => {
          if (calendarFor) setShortlistMeta(calendarFor, { deadline: date });
          setCalendarFor(null);
        }}
        onDismiss={() => setCalendarFor(null)}
      />

      <StatusPickerModal
        visible={statusFor !== null}
        value={statusFor ? shortlist[statusFor]?.appStatus ?? 'unsent' : 'unsent'}
        onPick={(s) => {
          if (statusFor) setShortlistMeta(statusFor, { appStatus: s });
          setStatusFor(null);
        }}
        onDismiss={() => setStatusFor(null)}
      />
    </View>
  );
}

// ─── One shortlisted school: stacked card on phones, wide row on desktop ──────

interface ItemProps {
  uni: University;
  score?: number;
  meta: ShortlistMeta;
  wide: boolean;
  compared: boolean;
  onOpen: () => void;
  onRemove: () => void;
  onToggleCompare: () => void;
  onTag: (tag: ShortlistTag) => void;
  onNote: (note: string) => void;
  onPickDeadline: () => void;
  onClearDeadline: () => void;
  onPickStatus: () => void;
}

function ShortlistItem(p: ItemProps) {
  const c = useThemeColors();
  const status = p.meta.appStatus ?? 'unsent';
  const days = p.meta.deadline ? daysUntil(p.meta.deadline) : null;
  const deadlineColor = days === null ? c.textTertiary : days < 0 ? c.danger : days <= 14 ? c.primary : c.textPrimary;
  const subtitle = [p.uni.city, p.uni.country, p.score !== undefined ? `${p.score}% match` : null].filter(Boolean).join(' · ');

  const image = (
    <Pressable onPress={p.onOpen} style={p.wide ? styles.rowImage : styles.cardImage} accessibilityLabel={`Open ${p.uni.name}`}>
      <UniImage name={p.uni.name} imageUrl={p.uni.image_url} idx={colorIdx(p.uni.id)} style={StyleSheet.absoluteFillObject as any} />
    </Pressable>
  );

  const compareIcon = (
    <Pressable
      onPress={p.onToggleCompare}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={p.compared ? 'Remove from compare' : 'Add to compare'}
    >
      <Scale size={p.wide ? 15 : 18} color={p.compared ? c.primary : c.textTertiary} strokeWidth={1.75} style={!p.compared && { opacity: 0.6 }} />
    </Pressable>
  );

  const nameBlock = (
    <Pressable onPress={p.onOpen} style={{ flex: 1, minWidth: 0 }}>
      <Text style={[styles.name, { color: c.textPrimary }]} numberOfLines={1}>{p.uni.name}</Text>
      <Text style={[styles.subtitle, { color: c.textTertiary }]} numberOfLines={1}>{subtitle}</Text>
    </Pressable>
  );

  const tagSelector = (
    <View style={p.wide ? styles.tagsRow : styles.tagsColumn} accessibilityRole="radiogroup">
      {TAGS.map((tag) => {
        const active = p.meta.tag === tag;
        const col = tagColors(c, tag);
        return (
          <Pressable
            key={tag}
            onPress={() => p.onTag(tag)}
            style={[
              styles.tagBtn,
              p.wide && styles.tagBtnWide,
              { borderColor: active ? col.border : c.surfaceBorder, backgroundColor: active ? col.bg : c.surface },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={TAG_LABEL[tag]}
          >
            <Text style={[styles.tagText, { color: active ? col.text : c.textTertiary }]}>{TAG_LABEL[tag].toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const note = (
    <TextInput
      placeholder="Add a note…"
      placeholderTextColor={c.textTertiary}
      value={p.meta.note}
      onChangeText={p.onNote}
      multiline
      style={[
        styles.note,
        p.wide ? styles.noteWide : styles.noteCard,
        {
          color: c.textPrimary,
          backgroundColor: p.meta.note ? c.inputBg : 'transparent',
          borderColor: c.inputBorder,
          borderStyle: p.meta.note ? 'solid' : 'dashed',
        },
        Platform.OS === 'web' && ({ outlineWidth: 0 } as any),
      ]}
    />
  );

  const statusPill = (
    <Pressable
      onPress={p.onPickStatus}
      style={[styles.statusPill, { backgroundColor: statusColors(c, status).bg, borderColor: statusColors(c, status).border }]}
      accessibilityRole="button"
      accessibilityLabel={`Application status: ${STATUS_LABEL[status]}. Tap to change.`}
    >
      <Text style={[styles.statusText, { color: statusColors(c, status).text }]}>{STATUS_LABEL[status].toUpperCase()}</Text>
      <ChevronDown size={12} color={statusColors(c, status).text} strokeWidth={2.25} />
    </Pressable>
  );

  const deadlineText = p.meta.deadline ? (
    <>
      <Text style={[styles.deadlineDate, { color: deadlineColor }]}>{formatDeadline(p.meta.deadline)}</Text>
      <Text style={[styles.deadlineDays, { color: days !== null && days < 0 ? c.danger : c.textTertiary }]}>{daysLabel(days as number)}</Text>
    </>
  ) : (
    <Text style={[styles.setDeadline, { color: c.textTertiary }]}>Set deadline</Text>
  );

  // ── Desktop row ──
  if (p.wide) {
    return (
      <View style={[styles.rowGrid, styles.row, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
        <View style={styles.colImage}>{image}</View>
        <View style={styles.colUni}>
          <View style={styles.nameLine}>
            {nameBlock}
            {compareIcon}
          </View>
          {tagSelector}
        </View>
        <View style={styles.colNote}>{note}</View>
        <View style={[styles.colDeadline, styles.deadlineCol]}>
          <Pressable onPress={p.onPickDeadline} accessibilityRole="button" accessibilityLabel="Set application deadline" style={styles.deadlineWideBtn}>
            {!p.meta.deadline && <CalendarPlus size={14} color={c.textTertiary} strokeWidth={1.75} />}
            <View>{deadlineText}</View>
          </Pressable>
          <View style={styles.deadlineWideFooter}>
            {statusPill}
            <Pressable onPress={p.onRemove} hitSlop={8} accessibilityLabel="Remove from shortlist">
              <X size={15} color={c.textTertiary} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Phone card ──
  const deadlineSet = !!p.meta.deadline;
  return (
    <View style={[styles.card, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
      <View style={styles.nameLine}>
        {nameBlock}
        <View style={styles.cardActions}>
          {compareIcon}
          <Pressable onPress={p.onRemove} hitSlop={8} accessibilityLabel="Remove from shortlist">
            <X size={18} color={c.textTertiary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <View style={styles.cardMiddle}>
        {image}
        {tagSelector}
        {note}
      </View>

      <Pressable
        onPress={p.onPickDeadline}
        style={[
          styles.deadlineBar,
          deadlineSet
            ? { backgroundColor: c.primarySurface, borderColor: c.primaryBorder }
            : { backgroundColor: c.surface, borderColor: c.surfaceBorder },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Set application deadline"
      >
        {deadlineSet
          ? <CalendarClock size={iconSize.md} color={deadlineColor} strokeWidth={1.75} />
          : <CalendarPlus size={iconSize.md} color={c.textTertiary} strokeWidth={1.75} />}
        <View style={{ flex: 1 }}>{deadlineText}</View>
        {deadlineSet && (
          <Pressable onPress={p.onClearDeadline} hitSlop={10} accessibilityLabel="Clear deadline" style={{ marginRight: 4 }}>
            <X size={14} color={c.textTertiary} strokeWidth={2} />
          </Pressable>
        )}
        {statusPill}
      </Pressable>
    </View>
  );
}

// ─── Status picker ────────────────────────────────────────────────────────────

function StatusPickerModal({
  visible,
  value,
  onPick,
  onDismiss,
}: {
  visible: boolean;
  value: ApplicationStatus;
  onPick: (s: ApplicationStatus) => void;
  onDismiss: () => void;
}) {
  const c = useThemeColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={[styles.pickerOverlay, { backgroundColor: c.scrim }]} onPress={onDismiss}>
        <Pressable style={[styles.pickerCard, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]} onPress={() => {}}>
          <Text style={[styles.pickerTitle, { color: c.textPrimary }]}>Application status</Text>
          {STATUS_OPTIONS.map((s) => {
            const col = statusColors(c, s);
            const active = s === value;
            return (
              <Pressable
                key={s}
                onPress={() => onPick(s)}
                style={[styles.pickerOption, { borderColor: active ? col.border : c.surfaceBorder, backgroundColor: active ? col.bg : 'transparent' }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <View style={[styles.pickerDot, { backgroundColor: col.text }]} />
                <Text style={[styles.pickerLabel, { color: active ? col.text : c.textPrimary }]}>{STATUS_LABEL[s]}</Text>
                {active && <Check size={16} color={col.text} strokeWidth={2.25} />}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, gap: 12 },
  listWide: { maxWidth: 1100, width: '100%', alignSelf: 'center', paddingHorizontal: 24, gap: 8 },

  listHeader: { marginBottom: 4 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  title: { fontSize: 28, fontFamily: 'Syne_800ExtraBold', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryText: { fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  sortText: { fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium' },

  // Desktop grid: image | university | note | deadline
  rowGrid: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  columnHeads: { marginTop: 18, paddingHorizontal: 12 },
  colHead: { fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 0.8 },
  colImage: { width: 120 },
  colUni: { flex: 1.2, minWidth: 0, gap: 8 },
  colNote: { flex: 1, minWidth: 0 },
  colDeadline: { width: 170 },

  row: { borderWidth: 1, borderRadius: 16, padding: 12 },
  rowImage: { width: 120, height: 80, borderRadius: 12, overflow: 'hidden' },
  deadlineCol: { gap: 8 },
  deadlineWideBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deadlineWideFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },

  // Phone card
  card: { borderWidth: 1, borderRadius: 18, padding: 12, gap: 10 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2 },
  cardMiddle: { flexDirection: 'row', gap: 10, alignItems: 'stretch', height: 100 },
  cardImage: { width: 100, borderRadius: 12, overflow: 'hidden' },

  nameLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 16, fontFamily: 'Syne_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 1 },

  tagsColumn: { justifyContent: 'space-between' },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tagBtn: { width: 62, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tagBtnWide: { width: 'auto' as any, height: 26, paddingHorizontal: 10 },
  tagText: { fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 0.4 },

  note: { borderWidth: 1, borderRadius: 12, fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 18, textAlignVertical: 'top' },
  noteCard: { flex: 1, minWidth: 0, paddingHorizontal: 10, paddingVertical: 8 },
  noteWide: { height: 80, paddingHorizontal: 10, paddingVertical: 8 },

  deadlineBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  deadlineDate: { fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
  deadlineDays: { fontSize: 12, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 1 },
  setDeadline: { fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 0.4 },

  pickerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  pickerCard: { width: '100%', maxWidth: 340, borderRadius: 20, borderWidth: 1, padding: 18, gap: 8 },
  pickerTitle: { fontSize: 18, fontFamily: 'Syne_700Bold', marginBottom: 4 },
  pickerOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  pickerDot: { width: 8, height: 8, borderRadius: 4 },
  pickerLabel: { flex: 1, fontSize: 15, fontFamily: 'SpaceGrotesk_500Medium' },
});

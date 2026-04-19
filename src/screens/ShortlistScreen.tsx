import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CardBanner } from '../components/CardBanner';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { colorIdx, rowToUniversity } from '../lib/transform';
import { supabase } from '../lib/supabase';
import { ShortlistStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { ShortlistTag, University } from '../types';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<ShortlistStackParamList, 'ShortlistMain'>;

const TAG_CONFIG: Record<ShortlistTag, { label: string; color: string; dimColor: string; borderColor: string }> = {
  reach:  { label: 'Reach',  color: '#F87171', dimColor: 'rgba(248,113,113,0.18)', borderColor: 'rgba(248,113,113,0.45)' },
  match:  { label: 'Match',  color: colors.orange, dimColor: colors.orangeDim, borderColor: colors.orangeBorder },
  safety: { label: 'Safety', color: '#22C55E', dimColor: 'rgba(34,197,94,0.18)', borderColor: 'rgba(34,197,94,0.45)' },
};

export function ShortlistScreen({ navigation }: Props) {
  const { shortlist, setShortlistMeta, toggleShortlist, toggleCompare, compareIds, matches } = useAppStore();
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
    supabase
      .from('universities')
      .select('*')
      .in('id', missingIds)
      .then(({ data }) => {
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
        <Text style={styles.emptyIcon}>❤️</Text>
        <Text style={styles.emptyTitle}>No saved schools yet</Text>
        <Text style={styles.emptyText}>Save schools from Discover to build your list.</Text>
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
        ListHeaderComponent={
          <Text style={styles.header}>{items.length} saved school{items.length !== 1 ? 's' : ''}</Text>
        }
        renderItem={({ item, index }) => {
          const meta = shortlist[item.id] ?? { tag: 'match' as const, note: '' };
          const compared = compareIds.includes(item.id);
          return (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 60)}>
              <GlassCard padding={0} style={styles.card} borderRadius={radius.lg}>
                <Pressable onPress={() => navigation.navigate('UniversityDetail', { id: item.id })}>
                  <CardBanner name={item.name} city={item.city} state={item.state} country={item.country} idx={colorIdx(item.id)} height={90} showText={false} />
                </Pressable>
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('UniversityDetail', { id: item.id })}>
                      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.location}>{item.city} · {item.country}</Text>
                    </Pressable>
                    <Pressable onPress={() => toggleShortlist(item.id)} style={styles.removeBtn} hitSlop={8}>
                      <Text style={styles.removeText}>✕</Text>
                    </Pressable>
                  </View>

                  {/* Tag row */}
                  <View style={styles.tagRow}>
                    {(Object.keys(TAG_CONFIG) as ShortlistTag[]).map((tag) => {
                      const cfg = TAG_CONFIG[tag];
                      const active = meta.tag === tag;
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => setShortlistMeta(item.id, tag, meta.note)}
                          style={[
                            styles.tag,
                            { borderColor: active ? cfg.borderColor : colors.glassBorder },
                            active && { backgroundColor: cfg.dimColor },
                          ]}
                        >
                          <Text style={[styles.tagText, { color: active ? cfg.color : colors.textTertiary }]}>
                            {cfg.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    placeholder="Add a note…"
                    placeholderTextColor={colors.textTertiary}
                    style={styles.noteInput}
                    value={meta.note}
                    onChangeText={(note) => setShortlistMeta(item.id, meta.tag, note)}
                  />

                  <Pressable
                    onPress={() => toggleCompare(item.id)}
                    style={[styles.compareBtn, compared && styles.compareBtnActive]}
                  >
                    <Text style={[styles.compareBtnText, compared && styles.compareBtnTextActive]}>
                      {compared ? '✓ Added to Compare' : '+ Add to Compare'}
                    </Text>
                  </Pressable>
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
  listContent: { padding: 16, paddingTop: 56, gap: 14 },
  header: { fontSize: 12, color: colors.textTertiary, fontWeight: '500', marginBottom: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  card: { overflow: 'hidden' },
  cardBody: { padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  location: { fontSize: 12, color: colors.textTertiary },
  removeBtn: { padding: 4 },
  removeText: { fontSize: 14, color: colors.textTertiary, fontWeight: '700' },

  tagRow: { flexDirection: 'row', gap: 8 },
  tag: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  tagText: { fontSize: 13, fontWeight: '600' },

  noteInput: {
    backgroundColor: colors.glassInput,
    borderRadius: radius.sm,
    padding: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.glassInputBorder,
  },
  compareBtn: {
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  compareBtnActive: { borderColor: colors.orangeBorder, backgroundColor: colors.orangeDim },
  compareBtnText: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },
  compareBtnTextActive: { color: colors.orange },
});

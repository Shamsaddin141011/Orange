import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CardBanner } from '../components/CardBanner';
import { colorIdx, rowToUniversity } from '../lib/transform';
import { supabase } from '../lib/supabase';
import { ShortlistStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { ShortlistTag, University } from '../types';

type Props = NativeStackScreenProps<ShortlistStackParamList, 'ShortlistMain'>;

const TAG_COLORS: Record<ShortlistTag, { bg: string; text: string; border: string }> = {
  reach:  { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  match:  { bg: '#fff7ed', text: '#f97316', border: '#fdba74' },
  safety: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
};

export function ShortlistScreen({ navigation }: Props) {
  const { shortlist, setShortlistMeta, toggleShortlist, toggleCompare, compareIds, matches } = useAppStore();
  const [fetchedUnis, setFetchedUnis] = useState<Record<string, University>>({});

  const shortlistIds = Object.keys(shortlist);

  // Universities already in matches (from a discover search)
  const matchedUnis = useMemo(() => {
    const map: Record<string, University> = {};
    for (const m of matches) map[m.university.id] = m.university;
    return map;
  }, [matches]);

  // Fetch any shortlisted unis that aren't in matches
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
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>❤️</Text>
        <Text style={styles.emptyTitle}>No saved schools yet</Text>
        <Text style={styles.emptyText}>Save schools from Discover to build your list.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      data={items}
      keyExtractor={(i) => i.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<Text style={styles.header}>{items.length} saved school{items.length !== 1 ? 's' : ''}</Text>}
      renderItem={({ item }) => {
        const meta = shortlist[item.id] ?? { tag: 'match' as const, note: '' };
        const compared = compareIds.includes(item.id);
        return (
          <View style={styles.card}>
            <Pressable onPress={() => navigation.navigate('UniversityDetail', { id: item.id })}>
              <CardBanner name={item.name} city={item.city} state={item.state} country={item.country} idx={colorIdx(item.id)} height={90} showText={false} />
            </Pressable>
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('UniversityDetail', { id: item.id })}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.location}>{item.city} · {item.country}</Text>
                </Pressable>
                <Pressable onPress={() => toggleShortlist(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.tagRow}>
                {(['reach', 'match', 'safety'] as ShortlistTag[]).map((tag) => {
                  const colors = TAG_COLORS[tag];
                  const active = meta.tag === tag;
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => setShortlistMeta(item.id, tag, meta.note)}
                      style={[styles.tag, { borderColor: colors.border }, active && { backgroundColor: colors.bg }]}
                    >
                      <Text style={[styles.tagText, { color: active ? colors.text : '#9ca3af' }]}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                placeholder="Add a note…"
                placeholderTextColor="#9ca3af"
                style={styles.input}
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
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginBottom: 4 },
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
  cardImage: { width: '100%', height: 100 },
  cardBody: { padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  location: { fontSize: 13, color: '#6b7280' },
  removeBtn: { padding: 4 },
  removeText: { fontSize: 14, color: '#9ca3af', fontWeight: '700' },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: { flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  tagText: { fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compareBtn: {
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  compareBtnActive: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  compareBtnText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  compareBtnTextActive: { color: '#f97316' },
});

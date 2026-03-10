import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CardBanner } from '../components/CardBanner';
import { colorIdx } from '../lib/transform';
import { universities } from '../data/universities';
import { useAppStore } from '../store/useAppStore';
import { ShortlistTag } from '../types';

const TAG_COLORS: Record<ShortlistTag, { bg: string; text: string; border: string }> = {
  reach:  { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  match:  { bg: '#fff7ed', text: '#f97316', border: '#fdba74' },
  safety: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
};

export function ShortlistScreen() {
  const { shortlist, setShortlistMeta, toggleShortlist } = useAppStore();
  const items = useMemo(() => universities.filter((u) => shortlist[u.id]), [shortlist]);

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
        return (
          <View style={styles.card}>
            <CardBanner name={item.name} city={item.city} state={item.state} country={item.country} idx={colorIdx(item.id)} height={90} showText={false} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.location}>{item.city} · {item.country}</Text>
                </View>
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
});

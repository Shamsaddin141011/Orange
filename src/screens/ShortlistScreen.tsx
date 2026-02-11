import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { universities } from '../data/universities';
import { useAppStore } from '../store/useAppStore';
import { ShortlistTag } from '../types';

export function ShortlistScreen() {
  const { shortlist, setShortlistMeta, toggleShortlist } = useAppStore();
  const items = useMemo(() => universities.filter((u) => shortlist[u.id]), [shortlist]);

  if (!items.length) return <View style={styles.center}><Text>No saved schools yet.</Text></View>;

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => {
        const meta = shortlist[item.id] ?? { tag: "match" as const, note: "" };
        return (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.row}>{(['reach', 'match', 'safety'] as ShortlistTag[]).map((tag) => (
              <Pressable key={tag} onPress={() => setShortlistMeta(item.id, tag, meta.note)}><Text style={[styles.tag, meta.tag === tag && styles.tagActive]}>{tag}</Text></Pressable>
            ))}</View>
            <TextInput
              placeholder="Personal notes"
              style={styles.input}
              value={meta.note}
              onChangeText={(note) => setShortlistMeta(item.id, meta.tag, note)}
            />
            <Pressable onPress={() => toggleShortlist(item.id)}><Text style={styles.remove}>Remove</Text></Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff7ed', padding: 12, borderRadius: 12, marginBottom: 10 },
  name: { fontWeight: '700', color: '#7c2d12' },
  row: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#ffedd5' },
  tagActive: { backgroundColor: '#fb923c' },
  input: { borderWidth: 1, borderColor: '#fdba74', borderRadius: 8, padding: 8 },
  remove: { color: '#dc2626', marginTop: 8 }
});

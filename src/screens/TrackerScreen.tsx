import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { universities } from '../data/universities';
import { useAppStore } from '../store/useAppStore';

const base = { essays: false, recommendations: false, testScores: false, feeWaiver: false, visaDocs: false, status: 'not_started' as const, reminder: '' };

export function TrackerScreen() {
  const { shortlist, tracker, setTracker } = useAppStore();
  const items = useMemo(() => universities.filter((u) => shortlist[u.id]), [shortlist]);
  if (!items.length) return <View style={styles.center}><Text>No schools in tracker yet. Save schools first.</Text></View>;

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => {
        const t = tracker[item.id] ?? base;
        const toggle = (key: keyof typeof base) => setTracker(item.id, { ...t, [key]: !t[key as keyof typeof t] });
        return (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            {(['essays', 'recommendations', 'testScores', 'feeWaiver', 'visaDocs'] as const).map((k) => (
              <Pressable key={k} onPress={() => toggle(k)}><Text>{t[k] ? '✓' : '○'} {k}</Text></Pressable>
            ))}
            <View style={styles.row}>{(['not_started', 'in_progress', 'submitted'] as const).map((s) => (
              <Pressable key={s} onPress={() => setTracker(item.id, { ...t, status: s })}><Text style={[styles.status, t.status === s && styles.statusActive]}>{s}</Text></Pressable>
            ))}</View>
            <TextInput placeholder="Reminder note/date" style={styles.input} value={t.reminder} onChangeText={(reminder) => setTracker(item.id, { ...t, reminder })} />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff7ed', borderRadius: 12, padding: 12, marginBottom: 10, gap: 4 },
  name: { fontWeight: '700', color: '#7c2d12' },
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  status: { backgroundColor: '#ffedd5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusActive: { backgroundColor: '#fb923c' },
  input: { borderWidth: 1, borderColor: '#fdba74', marginTop: 8, borderRadius: 8, padding: 8 }
});

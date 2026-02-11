import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchResult } from '../types';

type Props = {
  item: MatchResult;
  saved: boolean;
  compared: boolean;
  onPress: () => void;
  onSave: () => void;
  onCompare: () => void;
};

export function UniversityCard({ item, saved, compared, onPress, onSave, onCompare }: Props) {
  const { university } = item;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.logo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{university.name}</Text>
          <Text style={styles.meta}>{university.city}, {university.country}</Text>
        </View>
        <View style={styles.pill}><Text style={styles.pillText}>{item.score}%</Text></View>
      </View>
      <View style={styles.chips}>{item.reasons.slice(0, 2).map((r) => <Text key={r} style={styles.chip}>{r}</Text>)}</View>
      <View style={styles.actions}>
        <Pressable onPress={onSave}><Text style={styles.action}>{saved ? 'Unsave' : 'Save'}</Text></Pressable>
        <Pressable onPress={onCompare}><Text style={styles.action}>{compared ? 'Remove Compare' : 'Compare'}</Text></Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff7ed', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fdba74' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#fed7aa' },
  name: { fontSize: 16, fontWeight: '700', color: '#7c2d12' },
  meta: { color: '#9a3412' },
  pill: { backgroundColor: '#f97316', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: '#fff', fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { backgroundColor: '#ffedd5', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, color: '#9a3412' },
  actions: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  action: { color: '#ea580c', fontWeight: '700' }
});

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { universities } from '../data/universities';
import { useAppStore } from '../store/useAppStore';

export function CompareScreen() {
  const { compareIds } = useAppStore();
  const items = universities.filter((u) => compareIds.includes(u.id));

  if (!items.length) return <View style={styles.center}><Text>Select up to 3 schools to compare.</Text></View>;

  return (
    <ScrollView horizontal style={styles.container}>
      {items.map((u) => (
        <View key={u.id} style={styles.col}>
          <Text style={styles.h}>{u.name}</Text>
          <Text>Location: {u.city}, {u.country}</Text>
          <Text>Tuition: ${u.tuition_estimate.toLocaleString()}</Text>
          <Text>Acceptance: {u.acceptance_rate ? `${Math.round(u.acceptance_rate * 100)}%` : 'N/A'}</Text>
          <Text>SAT: {u.sat_middle_50.min}-{u.sat_middle_50.max}</Text>
          <Text>Deadlines: {u.deadlines.map((d) => d.date).join(', ')}</Text>
          <Text>Majors: {u.majors.join(', ')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  col: { width: 280, padding: 12, borderRightWidth: 1, borderRightColor: '#fed7aa' },
  h: { fontWeight: '700', color: '#7c2d12', marginBottom: 8 }
});

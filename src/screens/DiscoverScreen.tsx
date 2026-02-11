import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { UniversityCard } from '../components/UniversityCard';
import { DiscoverStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';

export function DiscoverScreen({ navigation }: NativeStackScreenProps<DiscoverStackParamList, 'DiscoverResults'>) {
  const { matches, shortlist, compareIds, toggleShortlist, toggleCompare } = useAppStore();
  const [search, setSearch] = useState('');
  const [tuitionMax, setTuitionMax] = useState('100000');
  const [requireSatFit, setRequireSatFit] = useState(false);
  const [withAcceptance, setWithAcceptance] = useState(false);

  const filtered = useMemo(() => matches.filter((m) => {
    if (search && !m.university.name.toLowerCase().includes(search.toLowerCase()) && !m.university.majors.join(' ').toLowerCase().includes(search.toLowerCase())) return false;
    if (Number(tuitionMax) && m.university.tuition_estimate > Number(tuitionMax)) return false;
    if (requireSatFit && m.breakdown.sat < 80) return false;
    if (withAcceptance && m.university.acceptance_rate === undefined) return false;
    return true;
  }), [matches, requireSatFit, search, tuitionMax, withAcceptance]);

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Search by school or major" value={search} onChangeText={setSearch} />
      <TextInput style={styles.input} placeholder="Max tuition" keyboardType="number-pad" value={tuitionMax} onChangeText={setTuitionMax} />
      <View style={styles.row}>
        <Pressable onPress={() => setRequireSatFit((v) => !v)}><Text style={styles.toggle}>{requireSatFit ? '✓' : '○'} SAT fit</Text></Pressable>
        <Pressable onPress={() => setWithAcceptance((v) => !v)}><Text style={styles.toggle}>{withAcceptance ? '✓' : '○'} acceptance data</Text></Pressable>
      </View>
      {!filtered.length ? <Text style={styles.empty}>No results found. Try changing filters.</Text> : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.university.id}
          renderItem={({ item }) => (
            <UniversityCard
              item={item}
              saved={!!shortlist[item.university.id]}
              compared={compareIds.includes(item.university.id)}
              onSave={() => toggleShortlist(item.university.id)}
              onCompare={() => toggleCompare(item.university.id)}
              onPress={() => navigation.navigate('UniversityDetail', { id: item.university.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#fdba74', borderRadius: 10, padding: 10, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  toggle: { color: '#c2410c', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9a3412', marginTop: 40 }
});

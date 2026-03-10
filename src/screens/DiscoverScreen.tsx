import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { UniversityCard } from '../components/UniversityCard';
import { DiscoverStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';

export function DiscoverScreen({ navigation }: NativeStackScreenProps<DiscoverStackParamList, 'DiscoverResults'>) {
  const { matches, toggleShortlist, toggleCompare } = useAppStore();
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
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search school or major…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.tuitionFilter}>
          <Text style={styles.filterLabel}>Max $</Text>
          <TextInput
            style={styles.tuitionInput}
            keyboardType="number-pad"
            value={tuitionMax}
            onChangeText={setTuitionMax}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <Pressable onPress={() => setRequireSatFit((v) => !v)} style={[styles.chip, requireSatFit && styles.chipActive]}>
          <Text style={[styles.chipText, requireSatFit && styles.chipTextActive]}>SAT fit</Text>
        </Pressable>
        <Pressable onPress={() => setWithAcceptance((v) => !v)} style={[styles.chip, withAcceptance && styles.chipActive]}>
          <Text style={[styles.chipText, withAcceptance && styles.chipTextActive]}>Has rate</Text>
        </Pressable>
      </View>

      <Text style={styles.resultCount}>{filtered.length} school{filtered.length !== 1 ? 's' : ''}</Text>

      {!filtered.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptyText}>Try adjusting your filters.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.university.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <UniversityCard
              item={item}
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
  container: { flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 16, paddingTop: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tuitionFilter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 999, borderWidth: 1.5, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  filterLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  tuitionInput: { fontSize: 13, color: '#111827', width: 70 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#fff7ed', borderColor: '#f97316' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#f97316' },
  resultCount: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginBottom: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6b7280' },
});

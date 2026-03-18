import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { UniversityCard } from '../components/UniversityCard';
import { DiscoverStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';

type StudyLevel = 'Bachelor\'s' | 'Master\'s' | 'PhD' | 'Associate\'s';

const STUDY_LEVELS: { label: StudyLevel; icon: string; available: boolean }[] = [
  { label: "Bachelor's", icon: '🎓', available: true },
  { label: "Master's",   icon: '📚', available: false },
  { label: 'PhD',        icon: '🔬', available: false },
  { label: "Associate's",icon: '📖', available: false },
];

export function DiscoverScreen({ navigation }: NativeStackScreenProps<DiscoverStackParamList, 'DiscoverResults'>) {
  const { matches, toggleShortlist, toggleCompare } = useAppStore();
  const [studyLevel, setStudyLevel] = useState<StudyLevel>("Bachelor's");
  const [search, setSearch] = useState('');
  const [tuitionMax, setTuitionMax] = useState('100000');
  const [requireSatFit, setRequireSatFit] = useState(false);
  const [withAcceptance, setWithAcceptance] = useState(false);

  const selectedLevel = STUDY_LEVELS.find(l => l.label === studyLevel)!;

  const filtered = useMemo(() => {
    if (!selectedLevel.available) return [];
    return matches.filter((m) => {
      if (search && !m.university.name.toLowerCase().includes(search.toLowerCase()) && !m.university.majors.join(' ').toLowerCase().includes(search.toLowerCase())) return false;
      if (Number(tuitionMax) && m.university.tuition_estimate > Number(tuitionMax)) return false;
      if (requireSatFit && m.breakdown.sat < 80) return false;
      if (withAcceptance && m.university.acceptance_rate === undefined) return false;
      return true;
    });
  }, [matches, selectedLevel, requireSatFit, search, tuitionMax, withAcceptance]);

  return (
    <View style={styles.container}>

      {/* Study level selector */}
      <View style={styles.levelSection}>
        <Text style={styles.levelLabel}>What are you looking for?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow}>
          {STUDY_LEVELS.map((l) => {
            const active = studyLevel === l.label;
            return (
              <Pressable
                key={l.label}
                style={[styles.levelChip, active && styles.levelChipActive, !l.available && styles.levelChipDisabled]}
                onPress={() => setStudyLevel(l.label)}
              >
                <Text style={styles.levelIcon}>{l.icon}</Text>
                <Text style={[styles.levelChipText, active && styles.levelChipTextActive]}>{l.label}</Text>
                {!l.available && <Text style={styles.levelSoon}>Soon</Text>}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* If level not yet available */}
      {!selectedLevel.available ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{selectedLevel.icon}</Text>
          <Text style={styles.emptyTitle}>{studyLevel} coming soon</Text>
          <Text style={styles.emptyText}>We're working on expanding to {studyLevel} programs. Check back soon!</Text>
        </View>
      ) : (
        <>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 16, paddingTop: 12 },

  levelSection: { marginBottom: 14 },
  levelLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10, letterSpacing: 0.2 },
  levelRow: { gap: 10, paddingRight: 4 },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  levelChipActive: { backgroundColor: '#fff7ed', borderColor: '#f97316' },
  levelChipDisabled: { opacity: 0.6 },
  levelIcon: { fontSize: 16 },
  levelChipText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  levelChipTextActive: { color: '#f97316' },
  levelSoon: { fontSize: 10, fontWeight: '700', color: '#f97316', backgroundColor: '#fff7ed', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },

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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});

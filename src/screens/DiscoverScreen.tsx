import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { UniversityCard } from '../components/UniversityCard';
import { DiscoverStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { Country } from '../types';
import { LOCATIONS, LocationGroup, STATE_ABBREV } from '../utils/locations';
import { MAJOR_CATEGORIES } from '../utils/majors';
import { validateAct, validateGre, validateIelts, validateSat, validateToefl } from '../utils/scoring';

type StudyLevel = "Bachelor's" | "Master's" | 'PhD' | "Associate's";

const STUDY_LEVELS: { label: StudyLevel; icon: string }[] = [
  { label: "Bachelor's", icon: '🎓' },
  { label: "Master's",   icon: '📚' },
  { label: 'PhD',        icon: '🔬' },
  { label: "Associate's",icon: '📖' },
];

const TRENDING_MAJORS = [
  'Computer Science', 'Business & Management', 'Data Science',
  'Engineering', 'Accounting & Finance', 'Medicine',
  'Psychology', 'Law', 'Architecture', 'Economics',
];

export function DiscoverScreen({ navigation }: NativeStackScreenProps<DiscoverStackParamList, 'DiscoverResults'>) {
  const { matches, toggleShortlist, toggleCompare, fetchAndScore, loading, error: fetchError } = useAppStore();

  // Study level
  const [studyLevel, setStudyLevel] = useState<StudyLevel>("Bachelor's");

  // Filters
  const [country, setCountry] = useState<Country>('USA');
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [location, setLocation]   = useState('');
  const [satTotal, setSatTotal]   = useState('');
  const [act, setAct]             = useState('');
  const [ibScore, setIbScore]     = useState('');
  const [gpa, setGpa]             = useState('');
  const [ielts, setIelts]         = useState('');
  const [toefl, setToefl]         = useState('');
  const [greVerbal, setGreVerbal] = useState('');
  const [greQuant, setGreQuant]   = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [search, setSearch]       = useState('');

  // Modals
  const [majorsModal,   setMajorsModal]   = useState(false);
  const [locationModal, setLocationModal] = useState(false);
  const [majorSearch,   setMajorSearch]   = useState('');
  const [locationSearch,setLocationSearch]= useState('');

  const [error, setError] = useState('');

  const selectedLevel = STUDY_LEVELS.find(l => l.label === studyLevel)!;
  const isGrad = studyLevel === "Master's" || studyLevel === 'PhD';
  const isAssociate = studyLevel === "Associate's";;

  const toggleMajor = (major: string) =>
    setSelectedMajors(prev =>
      prev.includes(major) ? prev.filter(m => m !== major) : [...prev, major]
    );

  const filteredMajorCategories = useMemo(() => {
    if (!majorSearch.trim()) return MAJOR_CATEGORIES;
    const q = majorSearch.toLowerCase();
    return MAJOR_CATEGORIES
      .map(cat => ({ ...cat, majors: cat.majors.filter(m => m.toLowerCase().includes(q)) }))
      .filter(cat => cat.majors.length > 0);
  }, [majorSearch]);

  const locationGroups: LocationGroup[] = useMemo(() => LOCATIONS[country] ?? [], [country]);
  const filteredLocationGroups = useMemo(() => {
    if (!locationSearch.trim()) return locationGroups;
    const q = locationSearch.toLowerCase();
    return locationGroups
      .map(g => ({ ...g, items: g.items.filter(i => i.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [locationGroups, locationSearch]);

  const locationLabel = country === 'USA' ? 'state' : 'city / region';

  const handleSearch = async () => {
    setError('');
    const sat  = satTotal ? Number(satTotal) : undefined;
    const actN = act      ? Number(act)      : undefined;
    const ib   = ibScore  ? Number(ibScore)  : undefined;
    const gpaN = gpa      ? Number(gpa)      : undefined;
    const ieltsN = ielts  ? Number(ielts)    : undefined;
    const toeflN = toefl  ? Number(toefl)    : undefined;
    const greV   = greVerbal ? Number(greVerbal) : undefined;
    const greQ   = greQuant  ? Number(greQuant)  : undefined;
    const bMin = budgetMin ? Number(budgetMin) : undefined;
    const bMax = budgetMax ? Number(budgetMax) : undefined;

    if (!validateSat(sat))          { setError('SAT total must be 400–1600.'); return; }
    if (!validateAct(actN))         { setError('ACT must be 1–36.'); return; }
    if (ib !== undefined && (ib < 0 || ib > 45)) { setError('IB score must be 0–45.'); return; }
    if (!validateIelts(ieltsN))     { setError('IELTS must be 0–9.'); return; }
    if (!validateToefl(toeflN))     { setError('TOEFL must be 0–120.'); return; }
    if (gpaN !== undefined && (gpaN < 0 || gpaN > 4.0)) { setError('GPA must be 0–4.0.'); return; }
    if (!validateGre(greV))         { setError('GRE Verbal must be 130–170.'); return; }
    if (!validateGre(greQ))         { setError('GRE Quant must be 130–170.'); return; }
    if (bMin !== undefined && bMax !== undefined && bMin >= bMax) {
      setError('Min budget must be less than max budget.'); return;
    }

    const resolvedLocation = country === 'USA' && location
      ? (STATE_ABBREV[location] ?? location)
      : location || undefined;

    await fetchAndScore({
      country,
      interests: selectedMajors,
      degreeLevel: studyLevel,
      budgetMin: bMin,
      budgetMax: bMax,
      preferredLocation: resolvedLocation,
      satTotal: sat,
      act: actN,
      ibScore: ib,
      gpa: gpaN,
      ielts: ieltsN,
      toefl: toeflN,
      greVerbal: greV,
      greQuant: greQ,
    });
  };

  const filtered = useMemo(() => {
    return matches.filter(m => {
      if (search && !m.university.name.toLowerCase().includes(search.toLowerCase()) &&
          !m.university.majors.join(' ').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [matches, search]);

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Study Level ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={18} color="#f97316" />
            <Text style={styles.sectionTitle}>What level are you looking for?</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow}>
            {STUDY_LEVELS.map(l => {
              const active = studyLevel === l.label;
              return (
                <Pressable
                  key={l.label}
                  style={[styles.levelChip, active && styles.levelChipActive]}
                  onPress={() => setStudyLevel(l.label)}
                >
                  <Text style={styles.levelIcon}>{l.icon}</Text>
                  <Text style={[styles.levelText, active && styles.levelTextActive]}>{l.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <>
          {/* ── (nothing replacing the coming-soon wrapper) ──── */}
          <>
            {/* ── Destination ────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="globe-outline" size={18} color="#f97316" />
                <Text style={styles.sectionTitle}>Where do you want to study?</Text>
              </View>
              <View style={styles.chipRow}>
                {(['USA', 'UK', 'EU', 'China', 'Canada', 'Australia'] as Country[]).map(c => (
                  <Pressable
                    key={c}
                    onPress={() => { setCountry(c); setLocation(''); }}
                    style={[styles.chip, country === c && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, country === c && styles.chipTextActive]}>
                      {c === 'USA' ? '🇺🇸 USA' : c === 'UK' ? '🇬🇧 UK' : c === 'EU' ? '🇪🇺 Europe' : c === 'China' ? '🇨🇳 China' : c === 'Canada' ? '🇨🇦 Canada' : '🇦🇺 Australia'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Majors ─────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book-outline" size={18} color="#f97316" />
                <Text style={styles.sectionTitle}>What do you want to study?</Text>
              </View>
              <Pressable style={styles.selectField} onPress={() => setMajorsModal(true)}>
                <Ionicons name="search-outline" size={15} color="#9ca3af" />
                <Text style={selectedMajors.length ? styles.selectText : styles.selectPlaceholder}>
                  {selectedMajors.length
                    ? `${selectedMajors.length} major${selectedMajors.length > 1 ? 's' : ''} selected`
                    : 'Search your subject / specialisation…'}
                </Text>
                <Ionicons name="chevron-down-outline" size={15} color="#9ca3af" />
              </Pressable>
              {selectedMajors.length > 0 && (
                <View style={[styles.chipRow, { marginTop: 10 }]}>
                  {selectedMajors.map(m => (
                    <Pressable key={m} onPress={() => toggleMajor(m)} style={styles.chipActive}>
                      <Text style={styles.chipTextActive}>{m} ×</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* ── Location ───────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={18} color="#f97316" />
                <Text style={styles.sectionTitle}>
                  Preferred {locationLabel} <Text style={styles.optional}>(optional)</Text>
                </Text>
              </View>
              <Pressable style={styles.selectField} onPress={() => setLocationModal(true)}>
                <Ionicons name="search-outline" size={15} color="#9ca3af" />
                <Text style={location ? styles.selectText : styles.selectPlaceholder}>
                  {location || `Select a ${locationLabel}…`}
                </Text>
                {location ? (
                  <Pressable onPress={() => setLocation('')}>
                    <Ionicons name="close-circle" size={16} color="#9ca3af" />
                  </Pressable>
                ) : (
                  <Ionicons name="chevron-down-outline" size={15} color="#9ca3af" />
                )}
              </Pressable>
            </View>

            {/* ── Academic Profile ───────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="ribbon-outline" size={18} color="#f97316" />
                <Text style={styles.sectionTitle}>Academic profile <Text style={styles.optional}>(optional)</Text></Text>
              </View>

              {/* Bachelor's — SAT/ACT, IB/GPA, IELTS/TOEFL */}
              {!isGrad && !isAssociate && (<>
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>SAT</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" placeholderTextColor="#9ca3af" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>ACT</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={act} onChangeText={setAct} placeholder="1–36" placeholderTextColor="#9ca3af" />
                  </View>
                </View>
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>IB Score</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={ibScore} onChangeText={setIbScore} placeholder="0–45" placeholderTextColor="#9ca3af" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>GPA</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" placeholderTextColor="#9ca3af" />
                  </View>
                </View>
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>IELTS</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={ielts} onChangeText={setIelts} placeholder="0–9.0" placeholderTextColor="#9ca3af" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>TOEFL</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={toefl} onChangeText={setToefl} placeholder="0–120" placeholderTextColor="#9ca3af" />
                  </View>
                </View>
              </>)}

              {/* Master's / PhD — GPA/GRE Verbal, GRE Quant/IELTS, TOEFL */}
              {isGrad && (<>
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>GPA</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" placeholderTextColor="#9ca3af" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>GRE Verbal</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={greVerbal} onChangeText={setGreVerbal} placeholder="130–170" placeholderTextColor="#9ca3af" />
                  </View>
                </View>
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>GRE Quant</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={greQuant} onChangeText={setGreQuant} placeholder="130–170" placeholderTextColor="#9ca3af" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>IELTS</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={ielts} onChangeText={setIelts} placeholder="0–9.0" placeholderTextColor="#9ca3af" />
                  </View>
                </View>
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>TOEFL</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={toefl} onChangeText={setToefl} placeholder="0–120" placeholderTextColor="#9ca3af" />
                  </View>
                  <View style={{ flex: 1 }} />
                </View>
              </>)}

              {/* Associate's — SAT/GPA only */}
              {isAssociate && (
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>SAT</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" placeholderTextColor="#9ca3af" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>GPA</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" placeholderTextColor="#9ca3af" />
                  </View>
                </View>
              )}
            </View>

            {/* ── Budget ─────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cash-outline" size={18} color="#f97316" />
                <Text style={styles.sectionTitle}>Budget (USD/yr) <Text style={styles.optional}>(optional)</Text></Text>
              </View>
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Min</Text>
                  <TextInput style={styles.input} keyboardType="number-pad" value={budgetMin} onChangeText={setBudgetMin} placeholder="e.g. 10,000" placeholderTextColor="#9ca3af" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Max</Text>
                  <TextInput style={styles.input} keyboardType="number-pad" value={budgetMax} onChangeText={setBudgetMax} placeholder="e.g. 50,000" placeholderTextColor="#9ca3af" />
                </View>
              </View>
            </View>

            {!!error      && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
            {!!fetchError && <View style={styles.errorBox}><Text style={styles.errorText}>{fetchError}</Text></View>}

            {/* ── Search button ──────────────────────── */}
            <Pressable
              style={[styles.button, (selectedMajors.length === 0 || loading) && styles.buttonDisabled]}
              disabled={selectedMajors.length === 0 || loading}
              onPress={handleSearch}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Find My Matches →</Text>}
            </Pressable>

            {/* ── Results ────────────────────────────── */}
            {matches.length > 0 && (
              <View style={styles.resultsSection}>
                {/* Search within results */}
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search within results…"
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                  />
                  {!!search && (
                    <Pressable onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={16} color="#9ca3af" />
                    </Pressable>
                  )}
                </View>

                <Text style={styles.resultCount}>
                  {filtered.length} school{filtered.length !== 1 ? 's' : ''}
                </Text>

                {filtered.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>No results</Text>
                    <Text style={styles.emptyText}>Try adjusting your search.</Text>
                  </View>
                ) : (
                  filtered.map(item => (
                    <UniversityCard
                      key={item.university.id}
                      item={item}
                      onSave={() => toggleShortlist(item.university.id)}
                      onCompare={() => toggleCompare(item.university.id)}
                      onPress={() => navigation.navigate('UniversityDetail', { id: item.university.id })}
                    />
                  ))
                )}
              </View>
            )}

            <View style={{ height: 48 }} />
          </>
        </>
      </ScrollView>

      {/* ── Majors Modal ──────────────────────────────── */}
      <Modal visible={majorsModal} animationType="slide" transparent={false}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Majors</Text>
            <Pressable onPress={() => { setMajorsModal(false); setMajorSearch(''); }} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>
          </View>

          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={15} color="#9ca3af" />
            <TextInput
              style={styles.modalSearchInput}
              value={majorSearch}
              onChangeText={setMajorSearch}
              placeholder="Search your subject / specialisation"
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            {!!majorSearch && (
              <Pressable onPress={() => setMajorSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </Pressable>
            )}
          </View>

          <FlatList
            data={!majorSearch.trim()
              ? [{ label: '🔥 Trending Subjects', majors: TRENDING_MAJORS }, ...filteredMajorCategories]
              : filteredMajorCategories}
            keyExtractor={item => item.label}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: cat }) => (
              <View>
                <Text style={styles.groupLabel}>{cat.label}</Text>
                {cat.majors.map(major => {
                  const sel = selectedMajors.includes(major);
                  return (
                    <Pressable
                      key={major}
                      style={[styles.listItem, sel && styles.listItemSelected]}
                      onPress={() => toggleMajor(major)}
                    >
                      <Text style={[styles.listItemText, sel && styles.listItemTextSelected]}>{major}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={20} color="#f97316" />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          />

          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.button, selectedMajors.length === 0 && styles.buttonDisabled]}
              onPress={() => { setMajorsModal(false); setMajorSearch(''); }}
            >
              <Text style={styles.buttonText}>
                {selectedMajors.length > 0 ? `Done · ${selectedMajors.length} selected` : 'Done'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Location Modal ────────────────────────────── */}
      <Modal visible={locationModal} animationType="slide" transparent={false}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {country === 'USA' ? 'State' : 'City / Region'}
            </Text>
            <Pressable onPress={() => { setLocationModal(false); setLocationSearch(''); }} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>
          </View>

          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={15} color="#9ca3af" />
            <TextInput
              style={styles.modalSearchInput}
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder={`Search ${country === 'USA' ? 'states' : 'cities / regions'}…`}
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            {!!locationSearch && (
              <Pressable onPress={() => setLocationSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredLocationGroups}
            keyExtractor={item => item.label}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: group }) => (
              <View>
                {filteredLocationGroups.length > 1 && (
                  <Text style={styles.groupLabel}>{group.label}</Text>
                )}
                {group.items.map(item => {
                  const sel = location === item;
                  return (
                    <Pressable
                      key={item}
                      style={[styles.listItem, sel && styles.listItemSelected]}
                      onPress={() => { setLocation(item); setLocationModal(false); setLocationSearch(''); }}
                    >
                      <Text style={[styles.listItemText, sel && styles.listItemTextSelected]}>{item}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={20} color="#f97316" />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 16, gap: 4 },

  // Study level
  levelRow: { gap: 10, paddingRight: 4 },
  levelChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  levelChipActive: { backgroundColor: '#fff7ed', borderColor: '#f97316' },
  levelIcon: { fontSize: 16 },
  levelText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  levelTextActive: { color: '#f97316' },

  // Sections
  section: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginBottom: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  optional: { fontWeight: '400', color: '#9ca3af' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#f9fafb', borderRadius: 999,
    borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  chipActive: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#fff7ed', borderRadius: 999,
    borderWidth: 1.5, borderColor: '#f97316',
  },
  chipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  chipTextActive: { fontSize: 13, fontWeight: '700', color: '#f97316' },

  selectField: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e5e7eb',
    paddingHorizontal: 12, paddingVertical: 11,
  },
  selectText: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },
  selectPlaceholder: { flex: 1, fontSize: 14, color: '#9ca3af' },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 10, marginBottom: 6 },
  twoCol: { flexDirection: 'row', gap: 12 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 10, padding: 11, fontSize: 14, color: '#111827',
  },

  errorBox: {
    backgroundColor: '#fef2f2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#fca5a5', marginBottom: 12,
  },
  errorText: { color: '#dc2626', fontSize: 13 },

  button: {
    backgroundColor: '#f97316', padding: 15, borderRadius: 14,
    alignItems: 'center', marginBottom: 4,
    shadowColor: '#f97316', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  buttonDisabled: { backgroundColor: '#d1d5db', shadowOpacity: 0 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Results
  resultsSection: { marginTop: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 10, borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  resultCount: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6b7280' },

  // Modal
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalClose: { padding: 4 },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, backgroundColor: '#f3f4f6',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: '#111827' },
  groupLabel: {
    fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.8,
    textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  listItemSelected: { backgroundColor: '#fff7ed' },
  listItemText: { fontSize: 15, color: '#111827' },
  listItemTextSelected: { color: '#f97316', fontWeight: '600' },
  modalFooter: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
});

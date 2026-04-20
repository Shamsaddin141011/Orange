import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { UniversityCard } from '../components/UniversityCard';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { GlassChip } from '../components/GlassChip';
import { GlassInput } from '../components/GlassInput';
import { GlassButton } from '../components/GlassButton';
import { DiscoverStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { Country } from '../types';
import { LOCATIONS, LocationGroup, STATE_ABBREV } from '../utils/locations';
import { MAJOR_CATEGORIES } from '../utils/majors';
import { validateAct, validateGre, validateIelts, validateSat, validateToefl } from '../utils/scoring';
import { colors, radius } from '../theme';

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

const COUNTRIES: { value: Country; flag: string; label: string }[] = [
  { value: 'USA',       flag: '🇺🇸', label: 'USA' },
  { value: 'UK',        flag: '🇬🇧', label: 'UK' },
  { value: 'EU',        flag: '🇪🇺', label: 'Europe' },
  { value: 'China',     flag: '🇨🇳', label: 'China' },
  { value: 'Canada',    flag: '🇨🇦', label: 'Canada' },
  { value: 'Australia', flag: '🇦🇺', label: 'Australia' },
];

export function DiscoverScreen({ navigation }: NativeStackScreenProps<DiscoverStackParamList, 'DiscoverResults'>) {
  const { matches, toggleShortlist, toggleCompare, fetchAndScore, loading, error: fetchError } = useAppStore();

  const [studyLevel, setStudyLevel] = useState<StudyLevel>("Bachelor's");
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
  const [majorsModal,   setMajorsModal]   = useState(false);
  const [locationModal, setLocationModal] = useState(false);
  const [majorSearch,   setMajorSearch]   = useState('');
  const [locationSearch,setLocationSearch]= useState('');
  const [error, setError] = useState('');

  const isGrad = studyLevel === "Master's" || studyLevel === 'PhD';
  const isAssociate = studyLevel === "Associate's";

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
      <GlassBackground>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Page title */}
          <Text style={styles.pageTitle}>Discover</Text>

          {/* Study Level */}
          <GlassCard padding={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school-outline" size={16} color={colors.orange} />
              <Text style={styles.sectionTitle}>Study level</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {STUDY_LEVELS.map(l => (
                <GlassChip
                  key={l.label}
                  label={l.label}
                  icon={l.icon}
                  active={studyLevel === l.label}
                  onPress={() => setStudyLevel(l.label)}
                />
              ))}
            </ScrollView>
          </GlassCard>

          {/* Country */}
          <GlassCard padding={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="globe-outline" size={16} color={colors.orange} />
              <Text style={styles.sectionTitle}>Where to study?</Text>
            </View>
            <View style={styles.chipWrap}>
              {COUNTRIES.map(c => (
                <GlassChip
                  key={c.value}
                  label={`${c.flag} ${c.label}`}
                  active={country === c.value}
                  onPress={() => { setCountry(c.value); setLocation(''); }}
                />
              ))}
            </View>
          </GlassCard>

          {/* Majors */}
          <GlassCard padding={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book-outline" size={16} color={colors.orange} />
              <Text style={styles.sectionTitle}>What to study?</Text>
            </View>
            <Pressable style={styles.selectField} onPress={() => setMajorsModal(true)}>
              <Ionicons name="search-outline" size={14} color={colors.textTertiary} />
              <Text style={selectedMajors.length ? styles.selectText : styles.selectPlaceholder}>
                {selectedMajors.length
                  ? `${selectedMajors.length} major${selectedMajors.length > 1 ? 's' : ''} selected`
                  : 'Search subject / specialisation…'}
              </Text>
              <Ionicons name="chevron-down-outline" size={14} color={colors.textTertiary} />
            </Pressable>
            {selectedMajors.length > 0 && (
              <View style={[styles.chipWrap, { marginTop: 10 }]}>
                {selectedMajors.map(m => (
                  <GlassChip key={m} label={`${m} ×`} active onPress={() => toggleMajor(m)} />
                ))}
              </View>
            )}
          </GlassCard>

          {/* Location */}
          <GlassCard padding={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={16} color={colors.orange} />
              <Text style={styles.sectionTitle}>
                Preferred {locationLabel} <Text style={styles.optional}>(optional)</Text>
              </Text>
            </View>
            <Pressable style={styles.selectField} onPress={() => setLocationModal(true)}>
              <Ionicons name="search-outline" size={14} color={colors.textTertiary} />
              <Text style={location ? styles.selectText : styles.selectPlaceholder}>
                {location || `Select a ${locationLabel}…`}
              </Text>
              {location ? (
                <Pressable onPress={() => setLocation('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                </Pressable>
              ) : (
                <Ionicons name="chevron-down-outline" size={14} color={colors.textTertiary} />
              )}
            </Pressable>
          </GlassCard>

          {/* Academic Profile */}
          <GlassCard padding={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="ribbon-outline" size={16} color={colors.orange} />
              <Text style={styles.sectionTitle}>Academic profile <Text style={styles.optional}>(optional)</Text></Text>
            </View>

            {!isGrad && !isAssociate && (
              <>
                <View style={styles.twoCol}>
                  <GlassInput label="SAT" keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" style={styles.flex1} />
                  <GlassInput label="ACT" keyboardType="number-pad" value={act} onChangeText={setAct} placeholder="1–36" style={styles.flex1} />
                </View>
                <View style={styles.twoCol}>
                  <GlassInput label="IB Score" keyboardType="number-pad" value={ibScore} onChangeText={setIbScore} placeholder="0–45" style={styles.flex1} />
                  <GlassInput label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" style={styles.flex1} />
                </View>
                <View style={styles.twoCol}>
                  <GlassInput label="IELTS" keyboardType="decimal-pad" value={ielts} onChangeText={setIelts} placeholder="0–9.0" style={styles.flex1} />
                  <GlassInput label="TOEFL" keyboardType="number-pad" value={toefl} onChangeText={setToefl} placeholder="0–120" style={styles.flex1} />
                </View>
              </>
            )}

            {isGrad && (
              <>
                <View style={styles.twoCol}>
                  <GlassInput label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" style={styles.flex1} />
                  <GlassInput label="GRE Verbal" keyboardType="number-pad" value={greVerbal} onChangeText={setGreVerbal} placeholder="130–170" style={styles.flex1} />
                </View>
                <View style={styles.twoCol}>
                  <GlassInput label="GRE Quant" keyboardType="number-pad" value={greQuant} onChangeText={setGreQuant} placeholder="130–170" style={styles.flex1} />
                  <GlassInput label="IELTS" keyboardType="decimal-pad" value={ielts} onChangeText={setIelts} placeholder="0–9.0" style={styles.flex1} />
                </View>
                <View style={styles.twoCol}>
                  <GlassInput label="TOEFL" keyboardType="number-pad" value={toefl} onChangeText={setToefl} placeholder="0–120" style={styles.flex1} />
                  <View style={styles.flex1} />
                </View>
              </>
            )}

            {isAssociate && (
              <View style={styles.twoCol}>
                <GlassInput label="SAT" keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" style={styles.flex1} />
                <GlassInput label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" style={styles.flex1} />
              </View>
            )}
          </GlassCard>

          {/* Budget */}
          <GlassCard padding={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={16} color={colors.orange} />
              <Text style={styles.sectionTitle}>Budget (USD/yr) <Text style={styles.optional}>(optional)</Text></Text>
            </View>
            <View style={styles.twoCol}>
              <GlassInput label="Min" keyboardType="number-pad" value={budgetMin} onChangeText={setBudgetMin} placeholder="e.g. 10,000" style={styles.flex1} />
              <GlassInput label="Max" keyboardType="number-pad" value={budgetMax} onChangeText={setBudgetMax} placeholder="e.g. 50,000" style={styles.flex1} />
            </View>
          </GlassCard>

          {(!!error || !!fetchError) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error || fetchError}</Text>
            </View>
          )}

          <GlassButton
            label={loading ? '' : 'Find My Matches →'}
            loading={loading}
            disabled={selectedMajors.length === 0 || loading}
            onPress={handleSearch}
            style={styles.searchBtn}
          />

          {/* Results */}
          {matches.length > 0 && (
            <View style={styles.resultsSection}>
              {/* Search within results */}
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search within results…"
                  placeholderTextColor={colors.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                />
                {!!search && (
                  <Pressable onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
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
                filtered.map((item, i) => (
                  <UniversityCard
                    key={item.university.id}
                    item={item}
                    index={i}
                    onSave={() => toggleShortlist(item.university.id)}
                    onCompare={() => toggleCompare(item.university.id)}
                    onPress={() => navigation.navigate('UniversityDetail', { id: item.university.id })}
                  />
                ))
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </GlassBackground>

      {/* Majors Modal */}
      <Modal visible={majorsModal} animationType="slide" transparent={false}>
        <GlassBackground style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Majors</Text>
            <Pressable onPress={() => { setMajorsModal(false); setMajorSearch(''); }} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={15} color={colors.textTertiary} />
            <TextInput
              style={styles.modalSearchInput}
              value={majorSearch}
              onChangeText={setMajorSearch}
              placeholder="Search subject / specialisation"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            {!!majorSearch && (
              <Pressable onPress={() => setMajorSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={!majorSearch.trim()
              ? [{ label: '🔥 Trending Subjects', majors: TRENDING_MAJORS }, ...filteredMajorCategories]
              : filteredMajorCategories}
            keyExtractor={item => item.label}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
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
                      {sel && <Ionicons name="checkmark-circle" size={20} color={colors.orange} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          />

          <View style={styles.modalFooter}>
            <GlassButton
              label={selectedMajors.length > 0 ? `Done · ${selectedMajors.length} selected` : 'Done'}
              onPress={() => { setMajorsModal(false); setMajorSearch(''); }}
            />
          </View>
        </GlassBackground>
      </Modal>

      {/* Location Modal */}
      <Modal visible={locationModal} animationType="slide" transparent={false}>
        <GlassBackground style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {country === 'USA' ? 'State' : 'City / Region'}
            </Text>
            <Pressable onPress={() => { setLocationModal(false); setLocationSearch(''); }} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={15} color={colors.textTertiary} />
            <TextInput
              style={styles.modalSearchInput}
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder={`Search ${country === 'USA' ? 'states' : 'cities / regions'}…`}
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            {!!locationSearch && (
              <Pressable onPress={() => setLocationSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
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
                      {sel && <Ionicons name="checkmark-circle" size={20} color={colors.orange} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </GlassBackground>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 16, paddingTop: 56, width: '100%' },

  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.5,
  },

  section: { marginBottom: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  optional: { fontWeight: '400', color: colors.textTertiary },

  chipRow: { gap: 8, paddingRight: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.glassInput,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.glassInputBorder,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  selectText: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  selectPlaceholder: { flex: 1, fontSize: 14, color: colors.textTertiary },

  twoCol: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  flex1: { flex: 1 },

  errorBox: {
    backgroundColor: colors.dangerDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: colors.danger, fontSize: 13 },

  searchBtn: { marginBottom: 8 },

  resultsSection: { marginTop: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassInput,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.glassInputBorder,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary, ...(Platform.OS === 'web' ? { outlineWidth: 0 } as any : {}) },
  resultCount: { fontSize: 13, color: colors.textTertiary, fontWeight: '500', marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary },

  // Modals
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  modalClose: { padding: 4 },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    backgroundColor: colors.glassInput,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.glassInputBorder,
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, ...(Platform.OS === 'web' ? { outlineWidth: 0 } as any : {}) },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  listItemSelected: { backgroundColor: colors.orangeDim },
  listItemText: { fontSize: 15, color: colors.textSecondary },
  listItemTextSelected: { color: colors.orange, fontWeight: '600' },
  modalFooter: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.glassBorder },
});

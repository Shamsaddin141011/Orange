import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GraduationCap, Globe, BookOpen, MapPin, Award, DollarSign,
  Search, X, ChevronDown, Check, SlidersHorizontal,
} from 'lucide-react-native';
import { UniCard } from '../components/UniCard';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { DiscoverStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { Country } from '../types';
import { LOCATIONS, LocationGroup, STATE_ABBREV } from '../utils/locations';
import { MAJOR_CATEGORIES } from '../utils/majors';
import { validateAct, validateGre, validateIelts, validateSat, validateToefl } from '../utils/scoring';
import { useThemeColors, radius, iconSize, layout } from '../theme';

type StudyLevel = "Bachelor's" | "Master's" | 'PhD' | "Associate's";

const STUDY_LEVELS: StudyLevel[] = ["Bachelor's", "Master's", 'PhD', "Associate's"];

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
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { matches, shortlist, toggleShortlist, fetchAndScore, loading, error: fetchError, compareIds, toggleCompare } = useAppStore();

  const [studyLevel, setStudyLevel] = useState<StudyLevel>("Bachelor's");
  const [country, setCountry] = useState<Country>('USA');
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [satTotal, setSatTotal] = useState('');
  const [act, setAct] = useState('');
  const [ibScore, setIbScore] = useState('');
  const [gpa, setGpa] = useState('');
  const [ielts, setIelts] = useState('');
  const [toefl, setToefl] = useState('');
  const [greVerbal, setGreVerbal] = useState('');
  const [greQuant, setGreQuant] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [search, setSearch] = useState('');
  const [majorsModal, setMajorsModal] = useState(false);
  const [locationModal, setLocationModal] = useState(false);
  const [majorSearch, setMajorSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [error, setError] = useState('');
  const [justSearched, setJustSearched] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultsYRef = useRef(0);

  useEffect(() => {
    if (justSearched && matches.length > 0) {
      setJustSearched(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: resultsYRef.current, animated: true });
      }, 150);
    }
  }, [matches.length, justSearched]);

  const isGrad = studyLevel === "Master's" || studyLevel === 'PhD';
  const isAssociate = studyLevel === "Associate's";
  const locationLabel = country === 'USA' ? 'state' : 'city / region';

  const toggleMajor = (major: string) =>
    setSelectedMajors(prev => prev.includes(major) ? prev.filter(m => m !== major) : [...prev, major]);

  const filteredMajorCategories = useMemo(() => {
    if (!majorSearch.trim()) return MAJOR_CATEGORIES;
    const q = majorSearch.toLowerCase();
    return MAJOR_CATEGORIES.map(cat => ({ ...cat, majors: cat.majors.filter(m => m.toLowerCase().includes(q)) })).filter(cat => cat.majors.length > 0);
  }, [majorSearch]);

  const locationGroups: LocationGroup[] = useMemo(() => LOCATIONS[country] ?? [], [country]);
  const filteredLocationGroups = useMemo(() => {
    if (!locationSearch.trim()) return locationGroups;
    const q = locationSearch.toLowerCase();
    return locationGroups.map(g => ({ ...g, items: g.items.filter(i => i.toLowerCase().includes(q)) })).filter(g => g.items.length > 0);
  }, [locationGroups, locationSearch]);

  const handleSearch = async () => {
    setError('');
    setJustSearched(true);
    const sat = satTotal ? Number(satTotal) : undefined;
    const actN = act ? Number(act) : undefined;
    const ib = ibScore ? Number(ibScore) : undefined;
    const gpaN = gpa ? Number(gpa) : undefined;
    const ieltsN = ielts ? Number(ielts) : undefined;
    const toeflN = toefl ? Number(toefl) : undefined;
    const greV = greVerbal ? Number(greVerbal) : undefined;
    const greQ = greQuant ? Number(greQuant) : undefined;
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
    if (bMin !== undefined && bMax !== undefined && bMin >= bMax) { setError('Min budget must be less than max budget.'); return; }

    const resolvedLocation = country === 'USA' && location ? (STATE_ABBREV[location] ?? location) : location || undefined;

    await fetchAndScore({ country, interests: selectedMajors, degreeLevel: studyLevel, budgetMin: bMin, budgetMax: bMax, preferredLocation: resolvedLocation, satTotal: sat, act: actN, ibScore: ib, gpa: gpaN, ielts: ieltsN, toefl: toeflN, greVerbal: greV, greQuant: greQ });
  };

  const filtered = useMemo(() => {
    if (!search) return matches;
    const q = search.toLowerCase();
    return matches.filter(m => m.university.name.toLowerCase().includes(q) || m.university.majors.join(' ').toLowerCase().includes(q));
  }, [matches, search]);

  const sectionCard = (children: React.ReactNode) => (
    <View style={[styles.sectionCard, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
      {children}
    </View>
  );

  const sectionHeader = (icon: React.ReactNode, title: string, optional?: boolean) => (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
        {title}
        {optional && <Text style={{ color: c.textTertiary, fontFamily: 'SpaceGrotesk_400Regular', fontSize: 13 }}> (optional)</Text>}
      </Text>
    </View>
  );

  const selectField = (placeholder: string, value: string, onPress: () => void, onClear?: () => void) => (
    <Pressable
      style={[styles.selectField, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={placeholder}
    >
      <Search size={iconSize.xs} color={c.textTertiary} strokeWidth={1.5} />
      <Text style={[{ flex: 1, fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' }, { color: value ? c.textPrimary : c.textTertiary }]}>
        {value || placeholder}
      </Text>
      {value && onClear ? (
        <Pressable onPress={onClear} hitSlop={8}><X size={iconSize.xs} color={c.textTertiary} strokeWidth={2} /></Pressable>
      ) : (
        <ChevronDown size={iconSize.xs} color={c.textTertiary} strokeWidth={1.5} />
      )}
    </Pressable>
  );

  return (
    <>
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.pageTitle, { color: c.textPrimary }]}>Discover</Text>
          <Text style={[styles.pageSubtitle, { color: c.textSecondary }]}>Find your perfect university</Text>

          {/* Study level */}
          {sectionCard(<>
            {sectionHeader(<GraduationCap size={iconSize.sm} color={c.primary} strokeWidth={1.5} />, 'Study level')}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {STUDY_LEVELS.map(l => (
                <Chip key={l} label={l} active={studyLevel === l} onPress={() => setStudyLevel(l)} />
              ))}
            </ScrollView>
          </>)}

          {/* Country */}
          {sectionCard(<>
            {sectionHeader(<Globe size={iconSize.sm} color={c.primary} strokeWidth={1.5} />, 'Where to study?')}
            <View style={styles.chipWrap}>
              {COUNTRIES.map(ct => (
                <Chip key={ct.value} label={`${ct.flag} ${ct.label}`} active={country === ct.value} onPress={() => { setCountry(ct.value); setLocation(''); }} />
              ))}
            </View>
          </>)}

          {/* Majors */}
          {sectionCard(<>
            {sectionHeader(<BookOpen size={iconSize.sm} color={c.primary} strokeWidth={1.5} />, 'What to study?')}
            {selectField(
              'Search subject / specialisation…',
              selectedMajors.length ? `${selectedMajors.length} major${selectedMajors.length > 1 ? 's' : ''} selected` : '',
              () => setMajorsModal(true),
            )}
            {selectedMajors.length > 0 && (
              <View style={[styles.chipWrap, { marginTop: 10 }]}>
                {selectedMajors.map(m => (
                  <Chip key={m} label={`${m} ×`} active onPress={() => toggleMajor(m)} />
                ))}
              </View>
            )}
          </>)}

          {/* Location */}
          {sectionCard(<>
            {sectionHeader(<MapPin size={iconSize.sm} color={c.primary} strokeWidth={1.5} />, `Preferred ${locationLabel}`, true)}
            {selectField(`Select a ${locationLabel}…`, location, () => setLocationModal(true), location ? () => setLocation('') : undefined)}
          </>)}

          {/* Academic profile */}
          {sectionCard(<>
            {sectionHeader(<Award size={iconSize.sm} color={c.primary} strokeWidth={1.5} />, 'Academic profile', true)}
            {!isGrad && !isAssociate && (<>
              <View style={styles.twoCol}>
                <Input label="SAT" keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" containerStyle={styles.flex1} />
                <Input label="ACT" keyboardType="number-pad" value={act} onChangeText={setAct} placeholder="1–36" containerStyle={styles.flex1} />
              </View>
              <View style={styles.twoCol}>
                <Input label="IB Score" keyboardType="number-pad" value={ibScore} onChangeText={setIbScore} placeholder="0–45" containerStyle={styles.flex1} />
                <Input label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" containerStyle={styles.flex1} />
              </View>
              <View style={styles.twoCol}>
                <Input label="IELTS" keyboardType="decimal-pad" value={ielts} onChangeText={setIelts} placeholder="0–9.0" containerStyle={styles.flex1} />
                <Input label="TOEFL" keyboardType="number-pad" value={toefl} onChangeText={setToefl} placeholder="0–120" containerStyle={styles.flex1} />
              </View>
            </>)}
            {isGrad && (<>
              <View style={styles.twoCol}>
                <Input label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" containerStyle={styles.flex1} />
                <Input label="GRE Verbal" keyboardType="number-pad" value={greVerbal} onChangeText={setGreVerbal} placeholder="130–170" containerStyle={styles.flex1} />
              </View>
              <View style={styles.twoCol}>
                <Input label="GRE Quant" keyboardType="number-pad" value={greQuant} onChangeText={setGreQuant} placeholder="130–170" containerStyle={styles.flex1} />
                <Input label="IELTS" keyboardType="decimal-pad" value={ielts} onChangeText={setIelts} placeholder="0–9.0" containerStyle={styles.flex1} />
              </View>
            </>)}
            {isAssociate && (
              <View style={styles.twoCol}>
                <Input label="SAT" keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" containerStyle={styles.flex1} />
                <Input label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" containerStyle={styles.flex1} />
              </View>
            )}
          </>)}

          {/* Budget */}
          {sectionCard(<>
            {sectionHeader(<DollarSign size={iconSize.sm} color={c.primary} strokeWidth={1.5} />, 'Budget (USD/yr)', true)}
            <View style={styles.twoCol}>
              <Input label="Min" keyboardType="number-pad" value={budgetMin} onChangeText={setBudgetMin} placeholder="e.g. 10,000" containerStyle={styles.flex1} />
              <Input label="Max" keyboardType="number-pad" value={budgetMax} onChangeText={setBudgetMax} placeholder="e.g. 50,000" containerStyle={styles.flex1} />
            </View>
          </>)}

          {(!!error || !!fetchError) && (
            <View style={[styles.errorBox, { backgroundColor: c.dangerSurface, borderColor: c.dangerBorder }]}>
              <Text style={[styles.errorText, { color: c.danger }]}>{error || fetchError}</Text>
            </View>
          )}

          <Button
            label={loading ? '' : 'Find My Matches →'}
            loading={loading}
            disabled={selectedMajors.length === 0 || loading}
            onPress={handleSearch}
          />

          {/* Results */}
          {matches.length > 0 && (
            <View
              style={styles.results}
              onLayout={(e) => { resultsYRef.current = e.nativeEvent.layout.y; }}
            >
              {/* Search bar */}
              <View style={[styles.searchBar, { backgroundColor: c.bgElevated, borderColor: c.inputBorder }]}>
                <Search size={iconSize.sm} color={c.textTertiary} strokeWidth={1.5} />
                <TextInput
                  style={[styles.searchInput, { color: c.textPrimary }, Platform.OS === 'web' && ({ outlineWidth: 0 } as any)]}
                  placeholder="Search within results…"
                  placeholderTextColor={c.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                />
                {!!search && (
                  <Pressable onPress={() => setSearch('')} hitSlop={8}>
                    <X size={iconSize.sm} color={c.textTertiary} strokeWidth={2} />
                  </Pressable>
                )}
              </View>

              <Text style={[styles.resultCount, { color: c.textTertiary }]}>
                {filtered.length} {filtered.length === 1 ? 'university' : 'universities'}
              </Text>

              {filtered.length === 0 ? (
                <EmptyState icon={Search} title="No results" subtitle="Try adjusting your search." />
              ) : (
                filtered.map((item, i) => (
                  <UniCard
                    key={item.university.id}
                    item={item}
                    saved={!!shortlist[item.university.id]}
                    onPress={() => navigation.navigate('UniversityDetail', { id: item.university.id })}
                    onSave={() => toggleShortlist(item.university.id)}
                    onCompare={() => toggleCompare(item.university.id)}
                    isCompared={compareIds.includes(item.university.id)}
                  />
                ))
              )}
            </View>
          )}

          <View style={{ height: insets.bottom + layout.tabBarHeight + layout.tabBarBottomOffset + 16 }} />
        </ScrollView>
      </View>

      {/* Majors Modal */}
      <Modal visible={majorsModal} animationType="slide" transparent={false}>
        <View style={[styles.modal, { backgroundColor: c.bg }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 16, borderBottomColor: c.divider }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Select Majors</Text>
            <Pressable onPress={() => { setMajorsModal(false); setMajorSearch(''); }} hitSlop={8}>
              <X size={iconSize.md} color={c.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={[styles.modalSearch, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
            <Search size={iconSize.sm} color={c.textTertiary} strokeWidth={1.5} />
            <TextInput
              style={[styles.modalSearchInput, { color: c.textPrimary }, Platform.OS === 'web' && ({ outlineWidth: 0 } as any)]}
              value={majorSearch}
              onChangeText={setMajorSearch}
              placeholder="Search subject / specialisation"
              placeholderTextColor={c.textTertiary}
              autoFocus
            />
            {!!majorSearch && <Pressable onPress={() => setMajorSearch('')} hitSlop={8}><X size={14} color={c.textTertiary} strokeWidth={2} /></Pressable>}
          </View>

          <FlatList
            data={!majorSearch.trim() ? [{ label: '🔥 Trending', majors: TRENDING_MAJORS }, ...filteredMajorCategories] : filteredMajorCategories}
            keyExtractor={item => item.label}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: cat }) => (
              <View>
                <Text style={[styles.groupLabel, { color: c.textTertiary }]}>{cat.label}</Text>
                {cat.majors.map(major => {
                  const sel = selectedMajors.includes(major);
                  return (
                    <Pressable
                      key={major}
                      style={[styles.listItem, { borderBottomColor: c.divider }, sel && { backgroundColor: c.primarySurface }]}
                      onPress={() => toggleMajor(major)}
                    >
                      <Text style={[styles.listItemText, { color: sel ? c.primary : c.textSecondary }, sel && { fontFamily: 'SpaceGrotesk_500Medium' }]}>{major}</Text>
                      {sel && <Check size={iconSize.md} color={c.primary} strokeWidth={2} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          />

          <View style={[styles.modalFooter, { borderTopColor: c.divider }]}>
            <Button label={selectedMajors.length > 0 ? `Done · ${selectedMajors.length} selected` : 'Done'} onPress={() => { setMajorsModal(false); setMajorSearch(''); }} />
          </View>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal visible={locationModal} animationType="slide" transparent={false}>
        <View style={[styles.modal, { backgroundColor: c.bg }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 16, borderBottomColor: c.divider }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Select {country === 'USA' ? 'State' : 'City / Region'}</Text>
            <Pressable onPress={() => { setLocationModal(false); setLocationSearch(''); }} hitSlop={8}>
              <X size={iconSize.md} color={c.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={[styles.modalSearch, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
            <Search size={iconSize.sm} color={c.textTertiary} strokeWidth={1.5} />
            <TextInput
              style={[styles.modalSearchInput, { color: c.textPrimary }, Platform.OS === 'web' && ({ outlineWidth: 0 } as any)]}
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder={`Search ${country === 'USA' ? 'states' : 'cities / regions'}…`}
              placeholderTextColor={c.textTertiary}
              autoFocus
            />
            {!!locationSearch && <Pressable onPress={() => setLocationSearch('')} hitSlop={8}><X size={14} color={c.textTertiary} strokeWidth={2} /></Pressable>}
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
                  <Text style={[styles.groupLabel, { color: c.textTertiary }]}>{group.label}</Text>
                )}
                {group.items.map(locItem => {
                  const sel = location === locItem;
                  return (
                    <Pressable
                      key={locItem}
                      style={[styles.listItem, { borderBottomColor: c.divider }, sel && { backgroundColor: c.primarySurface }]}
                      onPress={() => { setLocation(locItem); setLocationModal(false); setLocationSearch(''); }}
                    >
                      <Text style={[styles.listItemText, { color: sel ? c.primary : c.textSecondary }, sel && { fontFamily: 'SpaceGrotesk_500Medium' }]}>{locItem}</Text>
                      {sel && <Check size={iconSize.md} color={c.primary} strokeWidth={2} />}
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
  screen: { flex: 1 },
  container: { padding: layout.screenPadding, gap: 12 },

  pageTitle: { fontSize: 32, fontFamily: 'Syne_800ExtraBold', marginBottom: 2 },
  pageSubtitle: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 8 },

  sectionCard: { borderRadius: radius.lg, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontFamily: 'Syne_700Bold', flex: 1 },

  chipRow: { gap: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },

  twoCol: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },

  errorBox: { borderRadius: radius.md, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular' },

  results: { marginTop: 8, gap: 0 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'SpaceGrotesk_400Regular' },
  resultCount: { fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium', marginBottom: 12 },

  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Syne_700Bold' },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalSearchInput: { flex: 1, fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' },
  groupLabel: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_700Bold',
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
  },
  listItemText: { fontSize: 15, fontFamily: 'SpaceGrotesk_400Regular' },
  modalFooter: { padding: 16, paddingBottom: 32, borderTopWidth: 1 },
});

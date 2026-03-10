import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Country } from '../types';
import { validateSat, validateSectionSat } from '../utils/scoring';
import { DiscoverStackParamList } from '../navigation/AppNavigator';

const KNOWN_MAJORS = [
  'Computer Science', 'Data Science', 'Mathematics', 'Business', 'Economics',
  'Biology', 'Psychology', 'Physics', 'Chemistry', 'Engineering',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Biomedical Engineering', 'Software Engineering',
  'Information Technology', 'Cybersecurity', 'Artificial Intelligence',
  'Machine Learning', 'Finance', 'Accounting', 'Marketing', 'Management',
  'International Business', 'Entrepreneurship', 'Law', 'Political Science',
  'History', 'Philosophy', 'English', 'Literature', 'Linguistics',
  'Sociology', 'Anthropology', 'Geography', 'Environmental Science',
  'Architecture', 'Art', 'Design', 'Music', 'Film', 'Theater',
  'Nursing', 'Medicine', 'Public Health', 'Pharmacy', 'Dentistry',
  'Education', 'Communications', 'Journalism', 'Media Studies',
  'Social Work', 'Criminology', 'Neuroscience', 'Statistics',
];

type Props = NativeStackScreenProps<DiscoverStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const [country, setCountry] = useState<Country>('USA');
  const [selected, setSelected] = useState<string[]>(['Computer Science']);
  const [majorInput, setMajorInput] = useState('');
  const [majorError, setMajorError] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [location, setLocation] = useState('');
  const [satTotal, setSatTotal] = useState('1200');
  const [satMath, setSatMath] = useState('');
  const [satEbrw, setSatEbrw] = useState('');
  const [gpa, setGpa] = useState('');
  const [error, setError] = useState('');
  const { fetchAndScore, loading, error: fetchError } = useAppStore();

  const addMajor = () => {
    const trimmed = majorInput.trim();
    if (!trimmed) return;
    const match = KNOWN_MAJORS.find(
      (m) => m.toLowerCase() === trimmed.toLowerCase()
    );
    if (!match) {
      setMajorError(`"${trimmed}" isn't a recognised major. Try something like: Psychology, Engineering, Biology.`);
      return;
    }
    if (selected.includes(match)) {
      setMajorError(`"${match}" is already added.`);
      return;
    }
    setSelected((prev) => [...prev, match]);
    setMajorInput('');
    setMajorError('');
  };

  const removeMajor = (value: string) =>
    setSelected((prev) => prev.filter((v) => v !== value));

  const canContinue = useMemo(() => selected.length > 0, [selected.length]);

  const submit = async () => {
    const sat = satTotal ? Number(satTotal) : undefined;
    const math = satMath ? Number(satMath) : undefined;
    const ebrw = satEbrw ? Number(satEbrw) : undefined;
    if (!validateSat(sat) || !validateSectionSat(math) || !validateSectionSat(ebrw)) {
      setError('Invalid SAT values. Total must be 400–1600 and sections 200–800.');
      return;
    }
    const bMin = budgetMin ? Number(budgetMin) : undefined;
    const bMax = budgetMax ? Number(budgetMax) : undefined;
    if (bMin !== undefined && bMax !== undefined && bMin >= bMax) {
      setError('Min budget must be less than max budget.');
      return;
    }
    const profile = {
      country,
      interests: selected,
      budgetMin: bMin,
      budgetMax: bMax,
      preferredLocation: location || undefined,
      satTotal: sat,
      satMath: math,
      satEbrw: ebrw,
      gpa: gpa ? Number(gpa) : undefined,
    };
    await fetchAndScore(profile);
    navigation.navigate('DiscoverResults');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Tell us about yourself</Text>
      <Text style={styles.subtitle}>We'll match you with universities that fit your goals.</Text>

      <Text style={styles.label}>Where do you want to study?</Text>
      <View style={styles.row}>
        {(['USA', 'UK', 'EU', 'China'] as Country[]).map((c) => (
          <Pressable key={c} onPress={() => setCountry(c)} style={[styles.chip, country === c && styles.chipActive]}>
            <Text style={[styles.chipText, country === c && styles.chipTextActive]}>
              {c === 'USA' ? '🇺🇸 USA' : c === 'UK' ? '🇬🇧 UK' : c === 'EU' ? '🇪🇺 Europe' : '🇨🇳 China'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Interests / Majors</Text>
      <View style={styles.majorRow}>
        <TextInput
          style={[styles.majorInput, majorError ? styles.majorInputError : null]}
          value={majorInput}
          onChangeText={(t) => { setMajorInput(t); setMajorError(''); }}
          onSubmitEditing={addMajor}
          placeholder="e.g. Psychology"
          placeholderTextColor="#9ca3af"
          returnKeyType="done"
        />
        <Pressable onPress={addMajor} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
      {!!majorError && (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{majorError}</Text>
        </View>
      )}
      {selected.length > 0 && (
        <View style={[styles.row, { marginTop: 8 }]}>
          {selected.map((item) => (
            <Pressable key={item} onPress={() => removeMajor(item)} style={styles.chipActive}>
              <Text style={styles.chipTextActive}>{item} ×</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.label}>SAT Total Score</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" placeholderTextColor="#9ca3af" />

      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>SAT Math <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={satMath} onChangeText={setSatMath} placeholder="200–800" placeholderTextColor="#9ca3af" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>SAT EBRW <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={satEbrw} onChangeText={setSatEbrw} placeholder="200–800" placeholderTextColor="#9ca3af" />
        </View>
      </View>

      <Text style={styles.label}>GPA <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput style={styles.input} keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="e.g. 3.8" placeholderTextColor="#9ca3af" />

      <Text style={styles.label}>Budget (USD/yr) <Text style={styles.optional}>(optional)</Text></Text>
      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sublabel}>Min</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={budgetMin} onChangeText={setBudgetMin} placeholder="e.g. 10000" placeholderTextColor="#9ca3af" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sublabel}>Max</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={budgetMax} onChangeText={setBudgetMax} placeholder="e.g. 50000" placeholderTextColor="#9ca3af" />
        </View>
      </View>

      <Text style={styles.label}>Preferred City/State <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Boston, CA" placeholderTextColor="#9ca3af" />

      {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
      {!!fetchError && <View style={styles.errorBox}><Text style={styles.errorText}>{fetchError}</Text></View>}

      <Pressable disabled={!canContinue || loading} onPress={submit} style={[styles.button, (!canContinue || loading) && styles.buttonDisabled]}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>See My Matches →</Text>
        }
      </Pressable>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 20, gap: 4 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 16, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  sublabel: { fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 4 },
  optional: { fontWeight: '400', color: '#9ca3af' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#f97316',
  },
  chipText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  chipTextActive: { fontSize: 13, color: '#f97316', fontWeight: '700' },
  majorRow: { flexDirection: 'row', gap: 8 },
  majorInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  majorInputError: { borderColor: '#f87171' },
  addBtn: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  inlineError: { marginTop: 6, backgroundColor: '#fef2f2', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#fca5a5' },
  inlineErrorText: { color: '#dc2626', fontSize: 13 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#fca5a5' },
  errorText: { color: '#dc2626', fontSize: 14 },
  button: {
    marginTop: 20,
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonDisabled: { backgroundColor: '#d1d5db', shadowOpacity: 0 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

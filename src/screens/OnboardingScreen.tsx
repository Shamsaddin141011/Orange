import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Country } from '../types';
import { validateSat, validateSectionSat } from '../utils/scoring';
import { DiscoverStackParamList } from '../navigation/AppNavigator';

const interests = ['Computer Science', 'Data Science', 'Mathematics', 'Business', 'Economics', 'Biology', 'Psychology', 'Physics'];

type Props = NativeStackScreenProps<DiscoverStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const [country, setCountry] = useState<Country>('USA');
  const [selected, setSelected] = useState<string[]>(['Computer Science']);
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [satTotal, setSatTotal] = useState('1200');
  const [satMath, setSatMath] = useState('');
  const [satEbrw, setSatEbrw] = useState('');
  const [gpa, setGpa] = useState('');
  const [error, setError] = useState('');
  const { fetchAndScore, loading, error: fetchError } = useAppStore();

  const toggle = (value: string) =>
    setSelected((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);

  const canContinue = useMemo(() => selected.length > 0, [selected.length]);

  const submit = async () => {
    const sat = satTotal ? Number(satTotal) : undefined;
    const math = satMath ? Number(satMath) : undefined;
    const ebrw = satEbrw ? Number(satEbrw) : undefined;
    if (!validateSat(sat) || !validateSectionSat(math) || !validateSectionSat(ebrw)) {
      setError('Invalid SAT values. Total must be 400–1600 and sections 200–800.');
      return;
    }
    const profile = {
      country,
      interests: selected,
      budgetMax: budget ? Number(budget) : undefined,
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
        {(['USA', 'UK'] as Country[]).map((c) => (
          <Pressable key={c} onPress={() => setCountry(c)} style={[styles.option, country === c && styles.optionActive]}>
            <Text style={[styles.optionText, country === c && styles.optionTextActive]}>{c === 'USA' ? '🇺🇸 USA' : '🇬🇧 UK'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Interests</Text>
      <View style={styles.row}>
        {interests.map((i) => (
          <Pressable key={i} onPress={() => toggle(i)} style={[styles.option, selected.includes(i) && styles.optionActive]}>
            <Text style={[styles.optionText, selected.includes(i) && styles.optionTextActive]}>{i}</Text>
          </Pressable>
        ))}
      </View>

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

      <Text style={styles.label}>Max Budget (USD/yr) <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={budget} onChangeText={setBudget} placeholder="e.g. 50000" placeholderTextColor="#9ca3af" />

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
  optional: { fontWeight: '400', color: '#9ca3af' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 12 },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  optionActive: { backgroundColor: '#fff7ed', borderColor: '#f97316' },
  optionText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  optionTextActive: { color: '#f97316', fontWeight: '700' },
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

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { universities } from '../data/universities';
import { useAppStore } from '../store/useAppStore';
import { Country } from '../types';
import { scoreUniversity, validateSat, validateSectionSat } from '../utils/scoring';
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
  const { setProfile, setMatches } = useAppStore();

  const toggle = (value: string) => setSelected((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);

  const canContinue = useMemo(() => selected.length > 0, [selected.length]);

  const submit = () => {
    const sat = satTotal ? Number(satTotal) : undefined;
    const math = satMath ? Number(satMath) : undefined;
    const ebrw = satEbrw ? Number(satEbrw) : undefined;
    if (!validateSat(sat) || !validateSectionSat(math) || !validateSectionSat(ebrw)) {
      setError('Invalid SAT values. Total must be 400-1600 and sections 200-800.');
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
      gpa: gpa ? Number(gpa) : undefined
    };
    setProfile(profile);
    const scored = universities
      .filter((u) => u.country === country)
      .map((u) => scoreUniversity(profile, u))
      .sort((a, b) => b.score - a.score);
    setMatches(scored);
    navigation.navigate('DiscoverResults');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>OrangeUni Onboarding</Text>
      <Text style={styles.label}>Country</Text>
      <View style={styles.row}>{(['USA', 'UK'] as Country[]).map((c) => <Pressable key={c} onPress={() => setCountry(c)} style={[styles.option, country === c && styles.optionActive]}><Text>{c}</Text></Pressable>)}</View>
      <Text style={styles.label}>Interests</Text>
      <View style={styles.row}>{interests.map((i) => <Pressable key={i} onPress={() => toggle(i)} style={[styles.option, selected.includes(i) && styles.optionActive]}><Text>{i}</Text></Pressable>)}</View>
      <Text style={styles.label}>Budget max (optional)</Text><TextInput style={styles.input} keyboardType="number-pad" value={budget} onChangeText={setBudget} />
      <Text style={styles.label}>Preferred city/state (optional)</Text><TextInput style={styles.input} value={location} onChangeText={setLocation} />
      <Text style={styles.label}>SAT Total</Text><TextInput style={styles.input} keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} />
      <Text style={styles.label}>SAT Math (optional)</Text><TextInput style={styles.input} keyboardType="number-pad" value={satMath} onChangeText={setSatMath} />
      <Text style={styles.label}>SAT EBRW (optional)</Text><TextInput style={styles.input} keyboardType="number-pad" value={satEbrw} onChangeText={setSatEbrw} />
      <Text style={styles.label}>GPA (optional)</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable disabled={!canContinue} onPress={submit} style={styles.button}><Text style={styles.buttonText}>See Recommendations</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', gap: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#c2410c' },
  label: { fontWeight: '600', color: '#7c2d12', marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ffedd5', borderRadius: 999 },
  optionActive: { backgroundColor: '#fb923c' },
  input: { borderWidth: 1, borderColor: '#fdba74', borderRadius: 10, padding: 10 },
  button: { marginTop: 12, backgroundColor: '#f97316', padding: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '700' },
  error: { color: '#dc2626', marginTop: 4 }
});

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassBackground } from './GlassBackground';
import { GlassChip } from './GlassChip';
import { GlassButton } from './GlassButton';
import { useAppStore } from '../store/useAppStore';
import { colors, radius } from '../theme';

const QUICK_MAJORS = [
  { label: 'Computer Science', icon: '💻' },
  { label: 'Business & Management', icon: '📊' },
  { label: 'Engineering', icon: '⚙️' },
  { label: 'Medicine', icon: '🩺' },
  { label: 'Law', icon: '⚖️' },
  { label: 'Data Science', icon: '📈' },
  { label: 'Psychology', icon: '🧠' },
  { label: 'Architecture', icon: '🏛️' },
  { label: 'Economics', icon: '💹' },
  { label: 'Biology', icon: '🔬' },
  { label: 'Arts & Design', icon: '🎨' },
  { label: 'Education', icon: '📚' },
];

const COUNTRIES = [
  { value: 'USA', flag: '🇺🇸' },
  { value: 'UK', flag: '🇬🇧' },
  { value: 'EU', flag: '🇪🇺' },
  { value: 'Canada', flag: '🇨🇦' },
  { value: 'Australia', flag: '🇦🇺' },
  { value: 'China', flag: '🇨🇳' },
];

const DEGREES = ["Bachelor's", "Master's", 'PhD', "Associate's"];

const BUDGETS: { label: string; min?: number; max?: number }[] = [
  { label: 'Under $15k/yr', max: 15000 },
  { label: '$15k – $30k/yr', min: 15000, max: 30000 },
  { label: '$30k – $55k/yr', min: 30000, max: 55000 },
  { label: 'Over $55k/yr', min: 55000 },
  { label: 'No preference' },
];

type Props = { visible: boolean; onDone: () => void };

export function OnboardingModal({ visible, onDone }: Props) {
  const { fetchAndScore, saveProfile, profile } = useAppStore();
  const [step, setStep] = useState(0);
  const [majors, setMajors] = useState<string[]>([]);
  const [country, setCountry] = useState('USA');
  const [degree, setDegree] = useState("Bachelor's");
  const [budget, setBudget] = useState<typeof BUDGETS[0] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleMajor = (m: string) =>
    setMajors(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const handleFinish = async () => {
    setLoading(true);
    const newProfile = {
      ...profile,
      interests: majors,
      degreeLevel: degree as any,
      country: country as any,
      budgetMin: budget?.min,
      budgetMax: budget?.max,
    };
    await saveProfile(newProfile);
    await fetchAndScore(newProfile);
    setLoading(false);
    onDone();
  };

  const steps = [
    {
      title: "What do you want to study?",
      subtitle: "Pick one or more subjects — we'll match you with universities that excel in them.",
      icon: '📚',
      canNext: majors.length > 0,
      content: (
        <View style={styles.chipGrid}>
          {QUICK_MAJORS.map(m => (
            <GlassChip
              key={m.label}
              label={`${m.icon} ${m.label}`}
              active={majors.includes(m.label)}
              onPress={() => toggleMajor(m.label)}
            />
          ))}
        </View>
      ),
    },
    {
      title: "Where & what level?",
      subtitle: "Choose your preferred country and degree level.",
      icon: '🌍',
      canNext: true,
      content: (
        <View style={styles.section}>
          <Text style={styles.subLabel}>Country</Text>
          <View style={styles.chipGrid}>
            {COUNTRIES.map(c => (
              <GlassChip
                key={c.value}
                label={`${c.flag} ${c.value}`}
                active={country === c.value}
                onPress={() => setCountry(c.value)}
              />
            ))}
          </View>
          <Text style={[styles.subLabel, { marginTop: 16 }]}>Degree level</Text>
          <View style={styles.chipGrid}>
            {DEGREES.map(d => (
              <GlassChip
                key={d}
                label={d}
                active={degree === d}
                onPress={() => setDegree(d)}
              />
            ))}
          </View>
        </View>
      ),
    },
    {
      title: "What's your budget?",
      subtitle: "Annual tuition range — helps us filter universities you can afford.",
      icon: '💰',
      canNext: budget !== null,
      content: (
        <View style={styles.budgetList}>
          {BUDGETS.map(b => (
            <Pressable
              key={b.label}
              style={[styles.budgetRow, budget?.label === b.label && styles.budgetRowActive]}
              onPress={() => setBudget(b)}
            >
              <Text style={[styles.budgetText, budget?.label === b.label && styles.budgetTextActive]}>
                {b.label}
              </Text>
              {budget?.label === b.label && (
                <Ionicons name="checkmark-circle" size={20} color={colors.orange} />
              )}
            </Pressable>
          ))}
        </View>
      ),
    },
  ];

  const current = steps[step];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <GlassBackground style={styles.root}>
        {/* Progress dots */}
        <View style={styles.progress}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          ))}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.emoji}>{current.icon}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.subtitle}>{current.subtitle}</Text>
          {current.content}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <Pressable style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
          <View style={styles.footerFlex}>
            {step < steps.length - 1 ? (
              <GlassButton
                label="Next →"
                onPress={() => setStep(s => s + 1)}
                disabled={!current.canNext}
                size="lg"
              />
            ) : (
              <GlassButton
                label={loading ? '' : 'Find My Matches →'}
                loading={loading}
                disabled={!current.canNext || loading}
                onPress={handleFinish}
                size="lg"
              />
            )}
          </View>
        </View>
      </GlassBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 60,
    paddingBottom: 8,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.glassBorder,
  },
  dotActive: { backgroundColor: colors.orange, width: 24 },
  dotDone: { backgroundColor: colors.orangeBorder },

  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },

  emoji: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 28 },

  subLabel: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: {},

  budgetList: { gap: 10 },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.glassCard,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  budgetRowActive: {
    borderColor: colors.orangeBorder,
    backgroundColor: colors.orangeDim,
  },
  budgetText: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
  budgetTextActive: { color: colors.orange, fontWeight: '700' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  backBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.glassCard,
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  footerFlex: { flex: 1 },
});

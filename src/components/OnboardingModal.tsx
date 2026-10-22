import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassChip } from './GlassChip';
import { GlassButton } from './GlassButton';
import { useAppStore } from '../store/useAppStore';
import { useThemeColors, radius, fonts } from '../theme';

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
  const c = useThemeColors();
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
          <Text style={[styles.subLabel, { color: c.textTertiary }]}>Country</Text>
          <View style={styles.chipGrid}>
            {COUNTRIES.map(ct => (
              <GlassChip
                key={ct.value}
                label={`${ct.flag} ${ct.value}`}
                active={country === ct.value}
                onPress={() => setCountry(ct.value)}
              />
            ))}
          </View>
          <Text style={[styles.subLabel, { color: c.textTertiary, marginTop: 16 }]}>Degree level</Text>
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
          {BUDGETS.map(b => {
            const active = budget?.label === b.label;
            return (
              <Pressable
                key={b.label}
                style={[
                  styles.budgetRow,
                  active
                    ? { backgroundColor: c.primarySurface, borderColor: c.primaryBorder }
                    : { backgroundColor: c.surface, borderColor: c.surfaceBorder },
                ]}
                onPress={() => setBudget(b)}
              >
                <Text style={[
                  styles.budgetText,
                  active
                    ? { color: c.primary, fontFamily: fonts.bodyBold }
                    : { color: c.textPrimary },
                ]}>
                  {b.label}
                </Text>
                {active && <CheckCircle2 size={20} color={c.primary} />}
              </Pressable>
            );
          })}
        </View>
      ),
    },
  ];

  const current = steps[step];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        {/* Progress dots */}
        <View style={styles.progress}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? c.primary : i < step ? c.primaryBorder : c.surfaceBorder },
                i === step && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.emoji}>{current.icon}</Text>
          <Text style={[styles.title, { color: c.textPrimary }]}>{current.title}</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>{current.subtitle}</Text>
          {current.content}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: c.bgElevated, borderTopColor: c.surfaceBorder }]}>
          {step > 0 && (
            <Pressable
              style={[styles.backBtn, { backgroundColor: c.surface, borderColor: c.surfaceBorder }]}
              onPress={() => setStep(s => s - 1)}
            >
              <ArrowLeft size={20} color={c.textSecondary} />
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
      </View>
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
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },

  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },

  emoji: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 26, fontFamily: fonts.headingXBold, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: fonts.body, lineHeight: 22, marginBottom: 28 },

  subLabel: { fontSize: 13, fontFamily: fonts.bodyBold, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: {},

  budgetList: { gap: 10 },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  budgetText: { fontSize: 16, fontFamily: fonts.bodyMedium },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  backBtn: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  footerFlex: { flex: 1 },
});

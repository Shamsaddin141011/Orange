import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassBackground } from './GlassBackground';
import { colors, radius, shadow } from '../theme';

type FAQ = { q: string; a: string };

const FAQS: FAQ[] = [
  {
    q: 'What does Safety, Match, and Reach mean?',
    a: 'These describe your admission odds based on how your scores compare to a school\'s averages.\n\n• Safety — your stats sit well above the school\'s typical admits, so admission is very likely.\n• Match — your stats fall inside the typical admitted range, so you have a solid chance.\n• Reach — your stats fall below the typical range. Admission is possible but competitive; treat it as ambitious.',
  },
  {
    q: 'How does the Discover section work?',
    a: 'Discover scores every university in our database against your profile and ranks them.\n\nThe scoring weights:\n• Interest fit — 40%\n• Academic fit (your test scores vs. the school\'s) — 30%\n• Prestige (acceptance rate / selectivity) — 15%\n• Your preferences (budget, country) — 15%\n• A 20% boost when the school is in your preferred location\n\nThe filter chips at the top (study level, country, majors, scores, budget) refine the list in real time.',
  },
  {
    q: 'How accurate are the predictions?',
    a: 'Treat them as a guide, not a guarantee.\n\nThe match percentage and Safety/Match/Reach label are estimates built from public admissions data — average test scores, acceptance rates, and major fit. Real admissions decisions also weigh essays, recommendations, demonstrated interest, extracurriculars, and institutional priorities, none of which we can measure. Use the score to narrow your list, then research each school in depth before applying.',
  },
  {
    q: "Why don't some universities have images?",
    a: 'Images are pulled automatically from Wikidata, Wikipedia, and the school\'s own homepage. About 68% of schools in our database currently have a photo.\n\nThe rest — mostly small community colleges or international schools without a strong Wikipedia presence — show colored initials as a placeholder. We\'re continuously expanding coverage.',
  },
  {
    q: 'What does each tab do?',
    a: '• Home — your dashboard with quick stats and top matches.\n• Discover — search and rank universities for you.\n• Shortlist — schools you\'ve saved, with deadlines and application status.\n• Compare — view two or more schools side-by-side.\n• Tracker — track where each application stands (sent, accepted, etc.).\n• People — find other students, view public profiles, and chat.\n• Profile — edit your academics, interests, country, budget, and account info.',
  },
  {
    q: 'How do I customize my profile?',
    a: 'Open the Profile tab.\n\n• Set a unique username, display name, and bio so other students can find you.\n• Toggle public/private to control visibility on the People tab.\n• Fill in your academics — country, degree level, SAT / ACT / IB / GRE / GPA, plus budget and preferred location. The more complete your profile, the more accurate Discover gets.',
  },
  {
    q: 'How do I save a university?',
    a: 'Tap the heart icon on any university card to add it to your Shortlist. From the Shortlist tab you can set deadlines, track application status (Unsent / Pending / Accepted / Not Accepted), and add notes for each school.',
  },
  {
    q: "What's the difference between Shortlist and Tracker?",
    a: '• Shortlist is your wishlist — schools you\'re considering, with deadlines and an application status pill.\n• Tracker is for active applications — once you\'ve started or submitted an app, use Tracker to follow each one through to a decision.\n\nMost people use both: Shortlist while researching, Tracker once they\'re applying.',
  },
  {
    q: 'How do I message someone?',
    a: 'Open the People tab → search by username → tap a profile → Message. You can only message users with public profiles. The Inbox icon on the People tab shows all your conversations.',
  },
  {
    q: 'My data isn\'t syncing across devices',
    a: 'Make sure you\'re signed in with the same Google account on each device. Profile, shortlist, tracker, and compare data sync through Supabase the moment you sign in. If a screen looks empty, pull to refresh or sign out and back in.',
  },
];

export function HelpFAQ() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityLabel="Help and FAQ"
        accessibilityRole="button"
      >
        <Ionicons name="help" size={22} color={colors.textPrimary} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent={false} onRequestClose={() => setOpen(false)}>
        <GlassBackground style={styles.modalRoot}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Help & FAQ</Text>
              <Text style={styles.headerSubtitle}>Everything you might want to know about OrangeUni</Text>
            </View>
            <Pressable
              onPress={() => setOpen(false)}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Close help"
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {FAQS.map((item, i) => {
              const isOpen = expanded === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => setExpanded(isOpen ? null : i)}
                  style={({ pressed }) => [
                    styles.row,
                    isOpen && styles.rowOpen,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.rowHead}>
                    <Text style={[styles.q, isOpen && styles.qOpen]}>{item.q}</Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isOpen ? colors.orange : colors.textTertiary}
                    />
                  </View>
                  {isOpen && <Text style={styles.a}>{item.a}</Text>}
                </Pressable>
              );
            })}

            <Text style={styles.footerNote}>
              Still stuck? Reach out at sorujov141011@gmail.com.
            </Text>
          </ScrollView>
        </GlassBackground>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 52,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    ...shadow.darkSubtle,
    ...(Platform.OS === 'web'
      ? // @ts-ignore web only
        { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', cursor: 'pointer' }
      : {}),
  },
  fabPressed: {
    backgroundColor: colors.glassCardHover,
    borderColor: colors.orangeBorder,
  },

  modalRoot: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120, gap: 10 },

  row: {
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    padding: 16,
  },
  rowOpen: {
    borderColor: colors.orangeBorder,
    backgroundColor: colors.orangeDim,
  },
  rowPressed: {
    backgroundColor: colors.glassCardHover,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  q: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  qOpen: { color: colors.orange },
  a: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginTop: 12 },

  footerNote: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 24,
  },
});

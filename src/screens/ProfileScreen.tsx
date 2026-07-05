import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraduationCap, Settings2, Edit2, Check } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { supabase, saveUserSocialProfile } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { Country } from '../types';
import { GlassInput } from '../components/GlassInput';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { useThemeColors, radius, iconSize, layout } from '../theme';
import { validateAct, validateGre, validateIelts, validateSat, validateToefl } from '../utils/scoring';

type StudyLevel = "Bachelor's" | "Master's" | 'PhD' | "Associate's";

const COUNTRIES: { value: Country; flag: string; label: string }[] = [
  { value: 'USA', flag: '🇺🇸', label: 'USA' },
  { value: 'UK',  flag: '🇬🇧', label: 'UK'  },
  { value: 'EU',  flag: '🇪🇺', label: 'Europe' },
  { value: 'China', flag: '🇨🇳', label: 'China' },
  { value: 'Canada', flag: '🇨🇦', label: 'Canada' },
  { value: 'Australia', flag: '🇦🇺', label: 'Australia' },
];

const STUDY_LEVELS: StudyLevel[] = ["Bachelor's", "Master's", 'PhD', "Associate's"];

export function ProfileScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { profile, shortlist, matches, compareIds, tracker, signOut, saveProfile, fetchAndScore, username } = useAppStore();
  const savedCount = Object.keys(shortlist).length;
  const trackingCount = Object.keys(tracker).length;

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [error, setError] = useState('');

  const [country, setCountry] = useState<Country>(profile.country);
  const [studyLevel, setStudyLevel] = useState<StudyLevel>((profile.degreeLevel as StudyLevel) ?? "Bachelor's");
  const [satTotal, setSatTotal] = useState(profile.satTotal?.toString() ?? '');
  const [act, setAct] = useState(profile.act?.toString() ?? '');
  const [ibScore, setIbScore] = useState(profile.ibScore?.toString() ?? '');
  const [gpa, setGpa] = useState(profile.gpa?.toString() ?? '');
  const [ielts, setIelts] = useState(profile.ielts?.toString() ?? '');
  const [toefl, setToefl] = useState(profile.toefl?.toString() ?? '');
  const [greVerbal, setGreVerbal] = useState(profile.greVerbal?.toString() ?? '');
  const [greQuant, setGreQuant] = useState(profile.greQuant?.toString() ?? '');
  const [budgetMin, setBudgetMin] = useState(profile.budgetMin?.toString() ?? '');
  const [budgetMax, setBudgetMax] = useState(profile.budgetMax?.toString() ?? '');
  const [preferredLocation, setPreferredLocation] = useState(profile.preferredLocation ?? '');

  const isGrad = studyLevel === "Master's" || studyLevel === 'PhD';
  const isAssociate = studyLevel === "Associate's";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? '');
        setDisplayName(user.user_metadata?.full_name ?? user.email ?? 'Student');
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from('profiles').select('bio').eq('id', session.user.id).single().then(({ data }) => {
        if (data?.bio) setBio(data.bio);
      });
    });
  }, []);

  const saveBio = async () => {
    setSavingBio(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await saveUserSocialProfile(session.user.id, { bio, display_name: displayName });
    } catch (e) {
      console.error('Failed to save bio', e);
    } finally {
      setSavingBio(false);
      setEditingBio(false);
    }
  };

  const startEditing = () => {
    setCountry(profile.country);
    setStudyLevel((profile.degreeLevel as StudyLevel) ?? "Bachelor's");
    setSatTotal(profile.satTotal?.toString() ?? '');
    setAct(profile.act?.toString() ?? '');
    setIbScore(profile.ibScore?.toString() ?? '');
    setGpa(profile.gpa?.toString() ?? '');
    setIelts(profile.ielts?.toString() ?? '');
    setToefl(profile.toefl?.toString() ?? '');
    setGreVerbal(profile.greVerbal?.toString() ?? '');
    setGreQuant(profile.greQuant?.toString() ?? '');
    setBudgetMin(profile.budgetMin?.toString() ?? '');
    setBudgetMax(profile.budgetMax?.toString() ?? '');
    setPreferredLocation(profile.preferredLocation ?? '');
    setError('');
    setEditing(true);
  };

  const saveEdits = async () => {
    setError('');
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

    if (!validateSat(sat))      { setError('SAT total must be 400–1600.'); return; }
    if (!validateAct(actN))     { setError('ACT must be 1–36.'); return; }
    if (ib !== undefined && (ib < 0 || ib > 45)) { setError('IB score must be 0–45.'); return; }
    if (!validateIelts(ieltsN)) { setError('IELTS must be 0–9.'); return; }
    if (!validateToefl(toeflN)) { setError('TOEFL must be 0–120.'); return; }
    if (gpaN !== undefined && (gpaN < 0 || gpaN > 4.0)) { setError('GPA must be 0–4.0.'); return; }
    if (!validateGre(greV))     { setError('GRE Verbal must be 130–170.'); return; }
    if (!validateGre(greQ))     { setError('GRE Quant must be 130–170.'); return; }
    if (bMin !== undefined && bMax !== undefined && bMin >= bMax) { setError('Min budget must be less than max budget.'); return; }

    setSaving(true);
    const updated = { ...profile, country, degreeLevel: studyLevel, satTotal: sat, act: actN, ibScore: ib, gpa: gpaN, ielts: ieltsN, toefl: toeflN, greVerbal: greV, greQuant: greQ, budgetMin: bMin, budgetMax: bMax, preferredLocation: preferredLocation || undefined };
    await saveProfile(updated);
    await fetchAndScore(updated);
    setSaving(false);
    setEditing(false);
  };

  const initials = (displayName || 'S').charAt(0).toUpperCase();
  const fmtMoney = (n?: number) => n != null ? `$${n.toLocaleString()}` : null;
  const budgetDisplay = profile.budgetMin || profile.budgetMax ? `${fmtMoney(profile.budgetMin) ?? 'Any'} – ${fmtMoney(profile.budgetMax) ?? 'Any'}` : 'Not set';

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: c.primaryBorder }]}>
            <View style={[styles.avatar, { backgroundColor: c.primarySurface }]}>
              <Text style={[styles.avatarInitial, { color: c.primary }]}>{initials}</Text>
            </View>
          </View>
          <Text style={[styles.displayName, { color: c.textPrimary }]}>{displayName}</Text>
          {username && <Text style={[styles.usernameLabel, { color: c.primary }]}>@{username}</Text>}
          <Text style={[styles.emailLabel, { color: c.textTertiary }]}>{email}</Text>

          {/* Bio */}
          {editingBio ? (
            <View style={[styles.bioEditWrap, { borderColor: c.inputBorder, backgroundColor: c.inputBg }]}>
              <TextInput
                style={[styles.bioInput, { color: c.textPrimary }, Platform.OS === 'web' && ({ outlineWidth: 0 } as any)]}
                value={bio}
                onChangeText={setBio}
                placeholder="Write a short bio..."
                placeholderTextColor={c.textTertiary}
                multiline
                maxLength={160}
              />
              <View style={styles.bioActions}>
                <Pressable onPress={() => setEditingBio(false)} style={[styles.cancelBtn, { borderColor: c.surfaceBorder }]}>
                  <Text style={[styles.cancelBtnText, { color: c.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveBio} disabled={savingBio} style={[styles.saveBioBtn, { backgroundColor: c.primary }]}>
                  {savingBio ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBioBtnText}>Save</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setEditingBio(true)} style={styles.bioRow}>
              <Text style={[styles.bioText, { color: c.textTertiary }]}>{bio || 'Add a bio…'}</Text>
              <Edit2 size={12} color={c.textTertiary} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { value: matches.length,   label: 'Matches'    },
            { value: savedCount,       label: 'Saved'      },
            { value: compareIds.length,label: 'Comparing'  },
            { value: trackingCount,    label: 'Tracking'   },
          ].map(({ value, label }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
              <Text style={[styles.statNum, { color: c.primary }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: c.textTertiary }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Academic info */}
        <View style={[styles.section, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={iconSize.md} color={c.primary} strokeWidth={1.5} />
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Academic Profile</Text>
            {!editing && (
              <Pressable onPress={startEditing} style={[styles.editBtn, { borderColor: c.primaryBorder, backgroundColor: c.primarySurface }]}>
                <Edit2 size={12} color={c.primary} strokeWidth={2} />
                <Text style={[styles.editBtnText, { color: c.primary }]}>Edit</Text>
              </Pressable>
            )}
          </View>

          {editing ? (
            <View style={{ gap: 12 }}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Country</Text>
              <View style={styles.chipWrap}>
                {COUNTRIES.map(ct => (
                  <Chip key={ct.value} label={`${ct.flag} ${ct.label}`} active={country === ct.value} onPress={() => setCountry(ct.value)} />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Study Level</Text>
              <View style={styles.chipWrap}>
                {STUDY_LEVELS.map(l => (
                  <Chip key={l} label={l} active={studyLevel === l} onPress={() => setStudyLevel(l)} />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Test Scores</Text>
              {!isGrad && !isAssociate && (<>
                <View style={styles.twoCol}><GlassInput label="SAT" keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" style={styles.flex1} /><GlassInput label="ACT" keyboardType="number-pad" value={act} onChangeText={setAct} placeholder="1–36" style={styles.flex1} /></View>
                <View style={styles.twoCol}><GlassInput label="IB" keyboardType="number-pad" value={ibScore} onChangeText={setIbScore} placeholder="0–45" style={styles.flex1} /><GlassInput label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" style={styles.flex1} /></View>
                <View style={styles.twoCol}><GlassInput label="IELTS" keyboardType="decimal-pad" value={ielts} onChangeText={setIelts} placeholder="0–9.0" style={styles.flex1} /><GlassInput label="TOEFL" keyboardType="number-pad" value={toefl} onChangeText={setToefl} placeholder="0–120" style={styles.flex1} /></View>
              </>)}
              {isGrad && (<>
                <View style={styles.twoCol}><GlassInput label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" style={styles.flex1} /><GlassInput label="GRE V" keyboardType="number-pad" value={greVerbal} onChangeText={setGreVerbal} placeholder="130–170" style={styles.flex1} /></View>
                <View style={styles.twoCol}><GlassInput label="GRE Q" keyboardType="number-pad" value={greQuant} onChangeText={setGreQuant} placeholder="130–170" style={styles.flex1} /><GlassInput label="IELTS" keyboardType="decimal-pad" value={ielts} onChangeText={setIelts} placeholder="0–9.0" style={styles.flex1} /></View>
              </>)}
              {isAssociate && (
                <View style={styles.twoCol}><GlassInput label="SAT" keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" style={styles.flex1} /><GlassInput label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="0–4.0" style={styles.flex1} /></View>
              )}

              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Budget (USD/yr)</Text>
              <View style={styles.twoCol}><GlassInput label="Min" keyboardType="number-pad" value={budgetMin} onChangeText={setBudgetMin} placeholder="e.g. 0" style={styles.flex1} /><GlassInput label="Max" keyboardType="number-pad" value={budgetMax} onChangeText={setBudgetMax} placeholder="e.g. 50000" style={styles.flex1} /></View>

              <GlassInput label="Preferred Location" value={preferredLocation} onChangeText={setPreferredLocation} placeholder="e.g. Boston, CA" />

              {!!error && <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>}

              <View style={styles.editActions}>
                <Pressable onPress={() => setEditing(false)} style={[styles.cancelBtn, { borderColor: c.surfaceBorder, flex: 1 }]}>
                  <Text style={[styles.cancelBtnText, { color: c.textSecondary }]}>Cancel</Text>
                </Pressable>
                <View style={{ flex: 2 }}>
                  <Button label={saving ? '' : 'Save & Update'} loading={saving} onPress={saveEdits} />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {[
                { label: 'Country', value: profile.country },
                { label: 'Study Level', value: profile.degreeLevel ?? 'Not set' },
                { label: 'GPA', value: profile.gpa?.toString() ?? 'Not set' },
                { label: 'SAT', value: profile.satTotal?.toString() ?? 'Not set' },
                { label: 'IELTS', value: profile.ielts?.toString() ?? 'Not set' },
                { label: 'Budget', value: budgetDisplay },
                { label: 'Location', value: profile.preferredLocation ?? 'Not set' },
              ].map(({ label, value }) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{label}</Text>
                  <Text style={[styles.infoValue, { color: c.textPrimary }]}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Interests */}
        <View style={[styles.section, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
          <View style={styles.sectionHeader}>
            <Settings2 size={iconSize.md} color={c.primary} strokeWidth={1.5} />
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Interests</Text>
          </View>
          <View style={styles.chipWrap}>
            {profile.interests.length ? profile.interests.map(interest => (
              <Chip key={interest} label={interest} active />
            )) : (
              <Text style={[styles.none, { color: c.textTertiary }]}>None selected — set in Discover</Text>
            )}
          </View>
        </View>

        <Button label="Sign Out" variant="secondary" onPress={signOut} />

        <View style={{ height: insets.bottom + layout.tabBarHeight + layout.tabBarBottomOffset + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14 },

  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 4 },
  avatarRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 32, fontFamily: 'Syne_800ExtraBold' },
  displayName: { fontSize: 20, fontFamily: 'Syne_700Bold' },
  usernameLabel: { fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' },
  emailLabel: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular' },

  bioRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  bioText: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular', fontStyle: 'italic' },
  bioEditWrap: { width: '100%', borderRadius: radius.md, borderWidth: 1.5, padding: 10, marginTop: 8, gap: 8 },
  bioInput: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular', minHeight: 60 },
  bioActions: { flexDirection: 'row', gap: 8 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '44%', borderRadius: radius.lg, borderWidth: 1, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontFamily: 'Syne_700Bold', marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'SpaceGrotesk_500Medium' },

  section: { borderRadius: radius.lg, borderWidth: 1, padding: 16, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { flex: 1, fontSize: 14, fontFamily: 'Syne_700Bold' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1.5 },
  editBtnText: { fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' },

  fieldLabel: { fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium', marginBottom: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },

  errorText: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 4, alignItems: 'center' },
  cancelBtn: { borderRadius: radius.md, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  cancelBtnText: { fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
  saveBioBtn: { borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  saveBioBtnText: { fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold', color: '#fff' },

  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { flex: 1, fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' },
  infoValue: { fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' },
  none: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' },
});

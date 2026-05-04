import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAppStore } from '../store/useAppStore';
import { supabase, saveUserSocialProfile } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { Country } from '../types';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { GlassInput } from '../components/GlassInput';
import { GlassChip } from '../components/GlassChip';
import { colors, radius } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { validateAct, validateGre, validateIelts, validateSat, validateToefl } from '../utils/scoring';

type StudyLevel = "Bachelor's" | "Master's" | 'PhD' | "Associate's";

const COUNTRIES: { value: Country; flag: string; label: string }[] = [
  { value: 'USA',       flag: '🇺🇸', label: 'USA' },
  { value: 'UK',        flag: '🇬🇧', label: 'UK' },
  { value: 'EU',        flag: '🇪🇺', label: 'Europe' },
  { value: 'China',     flag: '🇨🇳', label: 'China' },
  { value: 'Canada',    flag: '🇨🇦', label: 'Canada' },
  { value: 'Australia', flag: '🇦🇺', label: 'Australia' },
];

const STUDY_LEVELS: { label: StudyLevel; icon: string }[] = [
  { label: "Bachelor's",  icon: '🎓' },
  { label: "Master's",    icon: '📚' },
  { label: 'PhD',         icon: '🔬' },
  { label: "Associate's", icon: '📖' },
];

export function ProfileScreen() {
  const { profile, shortlist, matches, signOut, saveProfile, fetchAndScore, username } = useAppStore();
  const savedCount = Object.keys(shortlist).length;
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [error, setError] = useState('');

  const [country, setCountry] = useState<Country>(profile.country);
  const [studyLevel, setStudyLevel] = useState<StudyLevel>((profile.degreeLevel as StudyLevel) ?? "Bachelor's");
  const [satTotal, setSatTotal]   = useState(profile.satTotal?.toString() ?? '');
  const [act, setAct]             = useState(profile.act?.toString() ?? '');
  const [ibScore, setIbScore]     = useState(profile.ibScore?.toString() ?? '');
  const [gpa, setGpa]             = useState(profile.gpa?.toString() ?? '');
  const [ielts, setIelts]         = useState(profile.ielts?.toString() ?? '');
  const [toefl, setToefl]         = useState(profile.toefl?.toString() ?? '');
  const [greVerbal, setGreVerbal] = useState(profile.greVerbal?.toString() ?? '');
  const [greQuant, setGreQuant]   = useState(profile.greQuant?.toString() ?? '');
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
    const sat    = satTotal  ? Number(satTotal)  : undefined;
    const actN   = act       ? Number(act)       : undefined;
    const ib     = ibScore   ? Number(ibScore)   : undefined;
    const gpaN   = gpa       ? Number(gpa)       : undefined;
    const ieltsN = ielts     ? Number(ielts)     : undefined;
    const toeflN = toefl     ? Number(toefl)     : undefined;
    const greV   = greVerbal ? Number(greVerbal) : undefined;
    const greQ   = greQuant  ? Number(greQuant)  : undefined;
    const bMin   = budgetMin ? Number(budgetMin) : undefined;
    const bMax   = budgetMax ? Number(budgetMax) : undefined;

    if (!validateSat(sat))      { setError('SAT total must be 400–1600.'); return; }
    if (!validateAct(actN))     { setError('ACT must be 1–36.'); return; }
    if (ib !== undefined && (ib < 0 || ib > 45)) { setError('IB score must be 0–45.'); return; }
    if (!validateIelts(ieltsN)) { setError('IELTS must be 0–9.'); return; }
    if (!validateToefl(toeflN)) { setError('TOEFL must be 0–120.'); return; }
    if (gpaN !== undefined && (gpaN < 0 || gpaN > 4.0)) { setError('GPA must be 0–4.0.'); return; }
    if (!validateGre(greV))     { setError('GRE Verbal must be 130–170.'); return; }
    if (!validateGre(greQ))     { setError('GRE Quant must be 130–170.'); return; }
    if (bMin !== undefined && bMax !== undefined && bMin >= bMax) {
      setError('Min budget must be less than max budget.'); return;
    }

    setSaving(true);
    const updated = {
      ...profile,
      country,
      degreeLevel: studyLevel,
      satTotal: sat,
      act: actN,
      ibScore: ib,
      gpa: gpaN,
      ielts: ieltsN,
      toefl: toeflN,
      greVerbal: greV,
      greQuant: greQ,
      budgetMin: bMin,
      budgetMax: bMax,
      preferredLocation: preferredLocation || undefined,
    };
    await saveProfile(updated);
    await fetchAndScore(updated);
    setSaving(false);
    setEditing(false);
  };

  const initials = displayName.charAt(0).toUpperCase();

  const fmtMoney = (n?: number) => (n != null ? `$${n.toLocaleString()}` : null);
  const budgetDisplay = profile.budgetMin || profile.budgetMax
    ? `${fmtMoney(profile.budgetMin) ?? 'Any'} – ${fmtMoney(profile.budgetMax) ?? 'Any'}`
    : 'Not set';

  return (
    <GlassBackground>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar hero */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.avatarSection}>
          <LinearGradient
            colors={['rgba(255,122,47,0.25)', 'transparent']}
            style={styles.avatarGlow}
          />
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {username && <Text style={styles.usernameLabel}>@{username}</Text>}
          <Text style={styles.emailLabel}>{email}</Text>

          {/* Bio */}
          {editingBio ? (
            <View style={styles.bioEditWrap}>
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={setBio}
                placeholder="Write a short bio..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={160}
              />
              <View style={styles.bioActions}>
                <Pressable onPress={() => setEditingBio(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveBio} style={styles.saveBioBtn} disabled={savingBio}>
                  {savingBio ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBioBtnText}>Save Bio</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setEditingBio(true)} style={styles.bioRow}>
              <Text style={styles.bioText}>{bio || 'Add a bio...'}</Text>
              <Ionicons name="pencil-outline" size={14} color={colors.textTertiary} />
            </Pressable>
          )}
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.statsRow}>
          <GlassCard padding={14} glow style={styles.statCard}>
            <Text style={styles.statNum}>{matches.length}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </GlassCard>
          <GlassCard padding={14} style={styles.statCard}>
            <Text style={styles.statNum}>{savedCount}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </GlassCard>
          <GlassCard padding={14} style={styles.statCard}>
            <Text style={styles.statNum}>{profile.satTotal ?? '—'}</Text>
            <Text style={styles.statLabel}>SAT</Text>
          </GlassCard>
        </Animated.View>

        {/* Academic Info */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <GlassCard padding={16} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Academic Info</Text>
              {!editing && (
                <Pressable onPress={startEditing} style={styles.editBtn}>
                  <Ionicons name="pencil-outline" size={13} color={colors.orange} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
              )}
            </View>

            {editing ? (
              <>
                <Text style={styles.fieldLabel}>Study Destination</Text>
                <View style={styles.chipWrap}>
                  {COUNTRIES.map((c) => (
                    <GlassChip key={c.value} label={`${c.flag} ${c.label}`} active={country === c.value} onPress={() => setCountry(c.value)} />
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Study Level</Text>
                <View style={styles.chipWrap}>
                  {STUDY_LEVELS.map((l) => (
                    <GlassChip key={l.label} label={`${l.icon} ${l.label}`} active={studyLevel === l.label} onPress={() => setStudyLevel(l.label)} />
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Test Scores</Text>
                <View style={{ gap: 10 }}>
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
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Budget (USD/yr)</Text>
                <View style={styles.twoCol}>
                  <GlassInput label="Min" keyboardType="number-pad" value={budgetMin} onChangeText={setBudgetMin} placeholder="e.g. 0" style={styles.flex1} />
                  <GlassInput label="Max" keyboardType="number-pad" value={budgetMax} onChangeText={setBudgetMax} placeholder="e.g. 50000" style={styles.flex1} />
                </View>

                <View style={{ marginTop: 10 }}>
                  <GlassInput label="Preferred Location" value={preferredLocation} onChangeText={setPreferredLocation} placeholder="e.g. Boston, CA" />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.editActions}>
                  <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <GlassButton
                    label={saving ? '' : 'Save & Update Matches'}
                    loading={saving}
                    onPress={saveEdits}
                    style={{ flex: 2 }}
                  />
                </View>
              </>
            ) : (
              <>
                <InfoRow icon="school-outline" label="Country" value={profile.country} />
                <InfoRow icon="ribbon-outline" label="Study Level" value={profile.degreeLevel ?? 'Not set'} />
                <InfoRow icon="trophy-outline" label="GPA" value={profile.gpa?.toString() ?? 'Not set'} />
                <InfoRow icon="document-text-outline" label="SAT Total" value={profile.satTotal?.toString() ?? 'Not set'} />
                <InfoRow icon="document-text-outline" label="ACT" value={profile.act?.toString() ?? 'Not set'} />
                <InfoRow icon="document-text-outline" label="IB Score" value={profile.ibScore?.toString() ?? 'Not set'} />
                <InfoRow icon="language-outline" label="IELTS" value={profile.ielts?.toString() ?? 'Not set'} />
                <InfoRow icon="language-outline" label="TOEFL" value={profile.toefl?.toString() ?? 'Not set'} />
                <InfoRow icon="document-text-outline" label="GRE Verbal" value={profile.greVerbal?.toString() ?? 'Not set'} />
                <InfoRow icon="document-text-outline" label="GRE Quant" value={profile.greQuant?.toString() ?? 'Not set'} />
                <InfoRow icon="cash-outline" label="Budget" value={budgetDisplay} />
                <InfoRow icon="location-outline" label="Preferred Location" value={profile.preferredLocation ?? 'Not set'} />
              </>
            )}
          </GlassCard>
        </Animated.View>

        {/* Interests */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <GlassCard padding={16} style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.pillRow}>
              {profile.interests.length ? profile.interests.map((i) => (
                <View key={i} style={styles.pill}>
                  <Text style={styles.pillText}>{i}</Text>
                </View>
              )) : <Text style={styles.none}>None selected — set in Discover</Text>}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <GlassButton label="Sign out" variant="danger" onPress={signOut} />
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </GlassBackground>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.orange} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 56, gap: 14 },

  avatarSection: { alignItems: 'center', paddingVertical: 20, position: 'relative' },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: 'center',
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: colors.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.orange,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.orangeDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: colors.orange },
  name: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  usernameLabel: { fontSize: 14, color: colors.orange, fontWeight: '600', marginBottom: 2 },
  emailLabel: { fontSize: 13, color: colors.textTertiary },

  bioRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  bioText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
  bioEditWrap: { width: '100%', marginTop: 12, gap: 8 },
  bioInput: {
    backgroundColor: colors.glassInput,
    borderWidth: 1.5,
    borderColor: colors.glassInputBorder,
    borderRadius: radius.md,
    padding: 10,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 60,
  },
  bioActions: { flexDirection: 'row', gap: 10 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.orange },
  statLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '500', marginTop: 2 },

  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.orangeBorder },
  editBtnText: { fontSize: 12, fontWeight: '700', color: colors.orange },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },

  errorText: { color: colors.danger, fontSize: 13, marginTop: 8 },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  saveBioBtn: { flex: 2, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.orange, alignItems: 'center' },
  saveBioBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { flex: 1, fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: colors.orangeDim,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  pillText: { fontSize: 13, color: colors.orange, fontWeight: '600' },
  none: { fontSize: 14, color: colors.textTertiary },
});

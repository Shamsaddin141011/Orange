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
import { colors, radius, shadow } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const COUNTRIES: Country[] = ['USA', 'UK', 'EU', 'China'];

export function ProfileScreen() {
  const { profile, shortlist, matches, signOut, saveProfile, fetchAndScore, username, setUsername } = useAppStore();
  const savedCount = Object.keys(shortlist).length;
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const [country, setCountry] = useState<Country>(profile.country);
  const [satTotal, setSatTotal] = useState(profile.satTotal?.toString() ?? '');
  const [gpa, setGpa] = useState(profile.gpa?.toString() ?? '');
  const [budgetMax, setBudgetMax] = useState(profile.budgetMax?.toString() ?? '');
  const [preferredLocation, setPreferredLocation] = useState(profile.preferredLocation ?? '');

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
    setSatTotal(profile.satTotal?.toString() ?? '');
    setGpa(profile.gpa?.toString() ?? '');
    setBudgetMax(profile.budgetMax?.toString() ?? '');
    setPreferredLocation(profile.preferredLocation ?? '');
    setEditing(true);
  };

  const saveEdits = async () => {
    setSaving(true);
    const updated = {
      ...profile,
      country,
      satTotal: satTotal ? Number(satTotal) : undefined,
      gpa: gpa ? Number(gpa) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      preferredLocation: preferredLocation || undefined,
    };
    await saveProfile(updated);
    await fetchAndScore(updated);
    setSaving(false);
    setEditing(false);
  };

  const initials = displayName.charAt(0).toUpperCase();

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
                <View style={styles.countryRow}>
                  {COUNTRIES.map((c) => (
                    <GlassChip key={c} label={c} active={country === c} onPress={() => setCountry(c)} />
                  ))}
                </View>
                <View style={{ gap: 10, marginTop: 12 }}>
                  <GlassInput label="SAT Total" keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" />
                  <GlassInput label="GPA" keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="e.g. 3.8" />
                  <GlassInput label="Max Budget (USD/yr)" keyboardType="number-pad" value={budgetMax} onChangeText={setBudgetMax} placeholder="e.g. 50000" />
                  <GlassInput label="Preferred Location" value={preferredLocation} onChangeText={setPreferredLocation} placeholder="e.g. Boston, CA" />
                </View>
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
                <InfoRow icon="ribbon-outline" label="SAT Total" value={profile.satTotal?.toString() ?? 'Not set'} />
                <InfoRow icon="trophy-outline" label="GPA" value={profile.gpa?.toString() ?? 'Not set'} />
                <InfoRow icon="cash-outline" label="Max Budget" value={profile.budgetMax ? `$${profile.budgetMax.toLocaleString()}` : 'Not set'} />
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
              )) : <Text style={styles.none}>None selected</Text>}
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
  countryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

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

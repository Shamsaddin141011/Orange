import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { supabase, saveUserSocialProfile } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { Country } from '../types';

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

  // Edit form state
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
    // Load bio from profiles
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🎓</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {username && <Text style={styles.usernameLabel}>@{username}</Text>}
        <Text style={styles.subtitle}>{email}</Text>

        {/* Bio */}
        {editingBio ? (
          <View style={styles.bioEditWrap}>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Write a short bio..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={160}
            />
            <View style={styles.bioActions}>
              <Pressable onPress={() => setEditingBio(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveBio} style={styles.saveBtn} disabled={savingBio}>
                {savingBio ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Bio</Text>}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setEditingBio(true)} style={styles.bioRow}>
            <Text style={styles.bioText}>{bio || 'Add a bio...'}</Text>
            <Ionicons name="pencil-outline" size={14} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{matches.length}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{savedCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{profile.satTotal ?? '—'}</Text>
          <Text style={styles.statLabel}>SAT</Text>
        </View>
      </View>

      {/* Academic Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Academic Info</Text>
          {!editing && (
            <Pressable onPress={startEditing} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={14} color="#f97316" />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          )}
        </View>

        {editing ? (
          <>
            <Text style={styles.fieldLabel}>Study Destination</Text>
            <View style={styles.countryRow}>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCountry(c)}
                  style={[styles.countryChip, country === c && styles.countryChipActive]}
                >
                  <Text style={[styles.countryChipText, country === c && styles.countryChipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>SAT Total</Text>
            <TextInput style={styles.fieldInput} keyboardType="number-pad" value={satTotal} onChangeText={setSatTotal} placeholder="400–1600" placeholderTextColor="#9ca3af" />
            <Text style={styles.fieldLabel}>GPA</Text>
            <TextInput style={styles.fieldInput} keyboardType="decimal-pad" value={gpa} onChangeText={setGpa} placeholder="e.g. 3.8" placeholderTextColor="#9ca3af" />
            <Text style={styles.fieldLabel}>Max Budget (USD/yr)</Text>
            <TextInput style={styles.fieldInput} keyboardType="number-pad" value={budgetMax} onChangeText={setBudgetMax} placeholder="e.g. 50000" placeholderTextColor="#9ca3af" />
            <Text style={styles.fieldLabel}>Preferred Location</Text>
            <TextInput style={styles.fieldInput} value={preferredLocation} onChangeText={setPreferredLocation} placeholder="e.g. Boston, CA" placeholderTextColor="#9ca3af" />
            <View style={styles.editActions}>
              <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveEdits} style={styles.saveBtn} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save & Update Matches</Text>}
              </Pressable>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.pillRow}>
          {profile.interests.length ? profile.interests.map((i) => (
            <View key={i} style={styles.pill}><Text style={styles.pillText}>{i}</Text></View>
          )) : <Text style={styles.none}>None selected</Text>}
        </View>
      </View>

      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#f97316" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 14 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#f97316', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  avatarText: { fontSize: 36 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 2 },
  usernameLabel: { fontSize: 14, color: '#f97316', fontWeight: '600', marginBottom: 2 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  bioRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 16 },
  bioText: { fontSize: 14, color: '#6b7280', textAlign: 'center', fontStyle: 'italic' },
  bioEditWrap: { width: '100%', marginTop: 12, gap: 8 },
  bioInput: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 10, padding: 10, fontSize: 14, color: '#111827', minHeight: 60,
  },
  bioActions: { flexDirection: 'row', gap: 10 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  statNum: { fontSize: 24, fontWeight: '800', color: '#f97316' },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500', marginTop: 2 },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    gap: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { flex: 1, fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 13, color: '#f97316', fontWeight: '600' },
  none: { fontSize: 14, color: '#9ca3af' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1.5, borderColor: '#f97316' },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#f97316' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 4 },
  fieldInput: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, fontSize: 14, color: '#111827' },
  countryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  countryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  countryChipActive: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  countryChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  countryChipTextActive: { color: '#f97316' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  saveBtn: { flex: 2, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f97316', alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#fca5a5',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#dc2626' },
});

import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { checkUsernameAvailable, saveUserSocialProfile } from '../lib/supabase';
import { supabase } from '../lib/supabase';

export function UsernameSetupModal({ visible }: { visible: boolean }) {
  const { setUsername } = useAppStore();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const sanitize = (t: string) => t.toLowerCase().replace(/[^a-z0-9_]/g, '');

  const validate = (u: string) => {
    if (u.length < 3) return 'At least 3 characters';
    if (u.length > 20) return 'Max 20 characters';
    if (!/^[a-z0-9_]+$/.test(u)) return 'Letters, numbers and underscores only';
    return '';
  };

  const handleClaim = async () => {
    const err = validate(value);
    if (err) { setError(err); return; }
    setSaving(true);
    setError('');
    try {
      const available = await checkUsernameAvailable(value);
      if (!available) { setError('Username already taken'); setSaving(false); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      await saveUserSocialProfile(user.id, {
        username: value,
        display_name: user.user_metadata?.full_name ?? value,
        bio: '',
        is_public: true,
      });
      setUsername(value);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎓</Text>
          <Text style={styles.title}>Pick a username</Text>
          <Text style={styles.sub}>This is how other students find and message you on OrangeUni.</Text>

          <View style={styles.inputRow}>
            <Text style={styles.at}>@</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={(t) => { setValue(sanitize(t)); setError(''); }}
              placeholder="your_username"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.hint}>3–20 chars · lowercase letters, numbers, underscores</Text>

          <Pressable
            style={[styles.btn, (saving || value.length < 3) && styles.btnDisabled]}
            onPress={handleClaim}
            disabled={saving || value.length < 3}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Claim Username →</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f97316',
    borderRadius: 12,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 8,
  },
  at: { fontSize: 18, fontWeight: '700', color: '#f97316', marginRight: 4 },
  input: { flex: 1, fontSize: 18, color: '#111827', paddingVertical: 12 },
  error: { fontSize: 13, color: '#dc2626', marginBottom: 4, alignSelf: 'flex-start' },
  hint: { fontSize: 12, color: '#9ca3af', alignSelf: 'flex-start', marginBottom: 24 },
  btn: {
    backgroundColor: '#f97316',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

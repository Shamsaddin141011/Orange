import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { checkUsernameAvailable, saveUserSocialProfile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { colors, radius } from '../theme';

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
        <GlassCard glow intensity={30} padding={28} borderRadius={radius.xl} style={styles.card}>
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
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.hint}>3–20 chars · lowercase letters, numbers, underscores</Text>

          <GlassButton
            label="Claim Username →"
            loading={saving}
            disabled={saving || value.length < 3}
            onPress={handleClaim}
            style={styles.btn}
          />
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 400, alignItems: 'center', alignSelf: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.orangeBorder,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 8,
    backgroundColor: colors.glassInput,
  },
  at: { fontSize: 18, fontWeight: '700', color: colors.orange, marginRight: 4 },
  input: { flex: 1, fontSize: 18, color: colors.textPrimary, paddingVertical: 12 },
  error: { fontSize: 13, color: colors.danger, marginBottom: 4, alignSelf: 'flex-start' },
  hint: { fontSize: 12, color: colors.textTertiary, alignSelf: 'flex-start', marginBottom: 24 },
  btn: { width: '100%' },
});

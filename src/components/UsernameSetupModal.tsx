import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { checkUsernameAvailable, saveUserSocialProfile } from '../lib/supabase';
import { GlassButton } from './GlassButton';
import { useThemeColors, radius, fonts, shadow } from '../theme';

const MIN_LEN = 4;
const MAX_LEN = 20;

type Availability = 'idle' | 'checking' | 'available' | 'taken';

export function UsernameSetupModal({ visible }: { visible: boolean }) {
  const c = useThemeColors();
  const { setUsername, session } = useAppStore();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Availability>('idle');

  const sanitize = (t: string) => t.toLowerCase().replace(/[^a-z0-9_]/g, '');

  const validate = (u: string) => {
    if (u.length < MIN_LEN) return `At least ${MIN_LEN} characters`;
    if (u.length > MAX_LEN) return `Max ${MAX_LEN} characters`;
    if (!/^[a-z0-9_]+$/.test(u)) return 'Letters, numbers and underscores only';
    return '';
  };

  // Live availability check, debounced while typing
  useEffect(() => {
    if (value.length < MIN_LEN) { setAvailability('idle'); return; }
    setAvailability('checking');
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const ok = await checkUsernameAvailable(value);
        if (!cancelled) setAvailability(ok ? 'available' : 'taken');
      } catch {
        if (!cancelled) setAvailability('idle');
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [value]);

  const handleClaim = async () => {
    const err = validate(value);
    if (err) { setError(err); return; }
    setSaving(true);
    setError('');
    try {
      const available = await checkUsernameAvailable(value);
      if (!available) { setAvailability('taken'); setError('Username already taken'); return; }

      // Use the session already in the store — avoids a network-validated getUser() call
      // which fails when the access token is stale (e.g. right after a Supabase project unpause).
      const user = session?.user;
      if (!user) throw new Error('Not signed in');

      await saveUserSocialProfile(user.id, {
        username: value,
        display_name: user.user_metadata?.full_name ?? value,
        bio: '',
        is_public: true,
      });
      setUsername(value);
    } catch (e: any) {
      // Private profiles are hidden from the availability check by RLS, so the
      // UNIQUE constraint on profiles.username is the final word on duplicates.
      if (e?.code === '23505') {
        setAvailability('taken');
        setError('Username already taken');
      } else if (e?.code === '23503') {
        // Session points at a user that no longer exists — drop it so they can sign in fresh.
        await useAppStore.getState().signOut();
      } else {
        setError(e?.message ?? 'Something went wrong');
      }
    } finally {
      setSaving(false);
    }
  };

  const status =
    error ? { text: error, color: c.danger } :
    availability === 'checking' ? { text: 'Checking…', color: c.textTertiary } :
    availability === 'available' ? { text: `@${value} is available`, color: c.success } :
    availability === 'taken' ? { text: 'Username already taken', color: c.danger } :
    null;

  const borderColor =
    error || availability === 'taken' ? c.dangerBorder :
    availability === 'available' ? c.successBorder :
    c.primaryBorder;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: c.scrim }]}>
        <View style={[styles.card, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}>
          <Text style={styles.emoji}>🎓</Text>
          <Text style={[styles.title, { color: c.textPrimary }]}>Pick a username</Text>
          <Text style={[styles.sub, { color: c.textSecondary }]}>
            This is how other students find and message you on OrangeUni.
          </Text>

          <View style={[styles.inputRow, { backgroundColor: c.inputBg, borderColor }]}>
            <Text style={[styles.at, { color: c.primary }]}>@</Text>
            <TextInput
              style={[styles.input, { color: c.textPrimary }]}
              value={value}
              onChangeText={(t) => { setValue(sanitize(t)); setError(''); }}
              onSubmitEditing={handleClaim}
              placeholder="your_username"
              placeholderTextColor={c.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              maxLength={MAX_LEN}
            />
          </View>

          <Text style={[styles.status, { color: status?.color ?? 'transparent' }]}>{status?.text ?? ' '}</Text>
          <Text style={[styles.hint, { color: c.textTertiary }]}>
            {MIN_LEN}–{MAX_LEN} chars · lowercase letters, numbers, underscores
          </Text>

          <GlassButton
            label="Claim Username →"
            loading={saving}
            disabled={saving || value.length < MIN_LEN || availability === 'taken'}
            onPress={handleClaim}
            style={styles.btn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    alignSelf: 'center',
    padding: 28,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadow.lg,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontFamily: fonts.headingXBold, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, fontFamily: fonts.body, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 8,
  },
  at: { fontSize: 18, fontFamily: fonts.bodyBold, marginRight: 4 },
  input: { flex: 1, fontSize: 18, fontFamily: fonts.body, paddingVertical: 12, outlineStyle: 'none' } as any,
  status: { fontSize: 13, fontFamily: fonts.bodyMedium, marginBottom: 4, alignSelf: 'flex-start' },
  hint: { fontSize: 12, fontFamily: fonts.body, alignSelf: 'flex-start', marginBottom: 24 },
  btn: { width: '100%' },
});

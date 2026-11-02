import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { useThemeColors, radius } from '../theme';

interface Props {
  visible: boolean;
  username: string | null;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
}

const DELETED_ITEMS = [
  'Your profile, username and photo',
  'Your shortlist, application tracker and compare list',
  'Your conversations and messages',
];

/** Confirmation dialog for permanent account deletion. Typing DELETE (or the username) unlocks the button. */
export function DeleteAccountModal({ visible, username, onConfirm, onDismiss }: Props) {
  const c = useThemeColors();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) { setTyped(''); setError(''); setBusy(false); }
  }, [visible]);

  const answer = typed.trim();
  const confirmed = answer === 'DELETE' || (!!username && answer.toLowerCase() === username.toLowerCase());

  const dismiss = () => { if (!busy) onDismiss(); };

  const confirm = async () => {
    if (!confirmed || busy) return;
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (e) {
      console.error('Failed to delete account', e);
      setError('Could not delete your account. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={[styles.overlay, { backgroundColor: c.scrim }]} onPress={dismiss}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrap}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.card, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: c.dangerSurface }]}>
              <TriangleAlert size={22} color={c.danger} strokeWidth={2} />
            </View>
            <Text style={[styles.title, { color: c.textPrimary }]}>Delete your account?</Text>
            <Text style={[styles.body, { color: c.textSecondary }]}>
              This permanently deletes your OrangeUni account and everything in it:
            </Text>
            <View style={styles.list}>
              {DELETED_ITEMS.map((item) => (
                <View key={item} style={styles.listRow}>
                  <View style={[styles.bullet, { backgroundColor: c.danger }]} />
                  <Text style={[styles.listText, { color: c.textPrimary }]}>{item}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.body, { color: c.textSecondary }]}>
              This can’t be undone.
            </Text>

            <Text style={[styles.prompt, { color: c.textSecondary }]}>
              Type <Text style={[styles.code, { color: c.textPrimary }]}>DELETE</Text>
              {username ? <> or your username <Text style={[styles.code, { color: c.textPrimary }]}>{username}</Text></> : null} to confirm.
            </Text>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              editable={!busy}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="DELETE"
              placeholderTextColor={c.textTertiary}
              accessibilityLabel="Type DELETE to confirm"
              onSubmitEditing={confirm}
              style={[
                styles.input,
                { color: c.textPrimary, backgroundColor: c.inputBg, borderColor: confirmed ? c.dangerBorder : c.inputBorder },
                Platform.OS === 'web' && ({ outlineWidth: 0 } as any),
              ]}
            />

            {!!error && <Text style={[styles.error, { color: c.danger }]}>{error}</Text>}

            <View style={styles.actions}>
              <Pressable
                onPress={dismiss}
                disabled={busy}
                accessibilityRole="button"
                style={[styles.btn, { borderColor: c.surfaceBorder }, busy && styles.dim]}
              >
                <Text style={[styles.btnText, { color: c.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                disabled={!confirmed || busy}
                accessibilityRole="button"
                accessibilityState={{ disabled: !confirmed || busy }}
                style={[styles.btn, styles.deleteBtn, { backgroundColor: c.danger, borderColor: c.danger }, (!confirmed || busy) && styles.dim]}
              >
                {busy
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={[styles.btnText, { color: '#fff' }]}>Delete my account</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  cardWrap: { width: '100%', maxWidth: 400, maxHeight: '90%' },
  card: { borderRadius: radius.xl, borderWidth: 1, padding: 22, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontFamily: 'Syne_700Bold' },
  body: { fontSize: 14, lineHeight: 20, fontFamily: 'SpaceGrotesk_400Regular' },
  list: { gap: 8, paddingLeft: 2 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bullet: { width: 5, height: 5, borderRadius: 3 },
  listText: { flex: 1, fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' },
  prompt: { fontSize: 13, lineHeight: 19, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 4 },
  code: { fontFamily: 'SpaceGrotesk_700Bold' },
  input: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'SpaceGrotesk_500Medium' },
  error: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btn: { flex: 1, minHeight: 46, borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  deleteBtn: { flex: 1.4 },
  btnText: { fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
  dim: { opacity: 0.45 },
});

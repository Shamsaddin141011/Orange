import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LogIn } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { useThemeColors, radius, fonts, iconSize, shadow } from '../theme';

/** Shown to guests when they try something that needs an account. */
export function SignInPromptModal() {
  const c = useThemeColors();
  const { signInPrompt, dismissSignInPrompt, exitGuestMode } = useAppStore();

  return (
    <Modal visible={signInPrompt !== null} transparent animationType="fade" onRequestClose={dismissSignInPrompt}>
      <Pressable style={[styles.overlay, { backgroundColor: c.scrim }]} onPress={dismissSignInPrompt}>
        {/* Inner Pressable swallows taps so clicking the card doesn't dismiss it */}
        <Pressable style={[styles.card, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]} onPress={() => {}}>
          <View style={[styles.iconWrap, { backgroundColor: c.primarySurface }]}>
            <LogIn size={iconSize.lg} color={c.primary} strokeWidth={1.75} />
          </View>
          <Text style={[styles.title, { color: c.textPrimary }]}>Sign in to continue</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>
            Create a free account or sign in to {signInPrompt ?? 'use this feature'}.
          </Text>
          <Button label="Sign in" onPress={exitGuestMode} style={styles.btn} />
          <Pressable onPress={dismissSignInPrompt} style={styles.secondary} accessibilityRole="button">
            <Text style={[styles.secondaryText, { color: c.textTertiary }]}>Keep browsing</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: 28,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadow.lg,
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontFamily: fonts.headingXBold, textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 14, fontFamily: fonts.body, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn: { width: '100%' },
  secondary: { marginTop: 14, paddingVertical: 6, paddingHorizontal: 12 },
  secondaryText: { fontSize: 14, fontFamily: fonts.bodyMedium },
});

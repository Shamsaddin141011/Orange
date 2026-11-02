import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useThemeColors, radius, fonts } from '../theme';
import { Button } from '../components/ui/Button';

WebBrowser.maybeCompleteAuthSession();

const TERMS_URL = 'https://orangeuni.org/terms';
const PRIVACY_URL = 'https://orangeuni.org/privacy';

// Apple logo glyph from Font Awesome Free (CC BY 4.0, https://fontawesome.com/license/free).
function AppleLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 384 512">
      <Path
        fill={color}
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </Svg>
  );
}

export function AuthScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [nativeAppleAvailable, setNativeAppleAvailable] = useState(false);
  const enterGuestMode = useAppStore((s) => s.enterGuestMode);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setNativeAppleAvailable).catch(() => {});
    }
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      if (Platform.OS === 'web') {
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        if (oauthError) setError(oauthError.message);
        return;
      }

      const redirectTo = AuthSession.makeRedirectUri({ scheme: 'orangeuni' });
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (oauthError || !data.url) {
        setError(oauthError?.message ?? 'Could not start sign-in.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        const url = result.url;
        const params = new URL(url);
        const accessToken = params.searchParams.get('access_token');
        const refreshToken = params.searchParams.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } else {
          await supabase.auth.exchangeCodeForSession(url);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    setAppleLoading(true);
    setError('');
    try {
      // iOS: native Apple sheet -> identity token -> Supabase. Apple gets the SHA-256 of the
      // nonce in the request, while Supabase verifies the token against the raw nonce.
      if (Platform.OS === 'ios' && nativeAppleAvailable) {
        const rawNonce = Crypto.randomUUID();
        const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });
        if (!credential.identityToken) throw new Error('Apple did not return an identity token.');

        const { error: idError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: rawNonce,
        });
        if (idError) throw idError;

        // Apple only shares the name on the very first sign-in, so store it right away.
        const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
        if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } });
        return;
      }

      // Web / Android: Supabase-hosted Apple OAuth redirect.
      if (Platform.OS === 'web') {
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: window.location.origin },
        });
        if (oauthError) setError(oauthError.message);
        return;
      }

      const redirectTo = AuthSession.makeRedirectUri({ scheme: 'orangeuni' });
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oauthError || !data.url) throw oauthError ?? new Error('Could not start sign-in.');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') await supabase.auth.exchangeCodeForSession(result.url);
    } catch (e: any) {
      // User closed the Apple sheet: nothing to report.
      if (e?.code === 'ERR_REQUEST_CANCELED') return;
      setError(e?.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  const busy = loading || appleLoading;

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {/* Decorative blob */}
      <View style={[styles.blob, { backgroundColor: c.primarySurface }]} />

      {/* Branding */}
      <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.branding}>
        <View style={[styles.logoMark, { backgroundColor: c.primary }]}>
          <Text style={styles.logoText}>O</Text>
        </View>
        <Text style={[styles.appName, { color: c.primary }]}>OrangeUni</Text>
        <Text style={[styles.tagline, { color: c.textSecondary }]}>Find. Apply. Thrive.</Text>
        <Text style={[styles.subtitle, { color: c.textTertiary }]}>
          Your university journey starts here.
        </Text>
      </Animated.View>

      {/* Auth card */}
      <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.card}>
        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: c.dangerSurface, borderColor: c.dangerBorder }]}>
            <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
          </View>
        )}

        {Platform.OS === 'ios' && nativeAppleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={26}
            style={[styles.appleBtn, busy && { opacity: 0.6 }]}
            onPress={() => { if (!busy) signInWithApple(); }}
          />
        ) : (
          <Pressable
            style={({ pressed }) => [styles.appleBtn, styles.appleBtnWeb, (pressed || busy) && { opacity: 0.8 }]}
            onPress={signInWithApple}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
          >
            <AppleLogo size={18} color="#000" />
            <Text style={styles.appleBtnText}>{appleLoading ? 'Opening Apple…' : 'Continue with Apple'}</Text>
          </Pressable>
        )}

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
          <Text style={[styles.dividerText, { color: c.textTertiary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
        </View>

        <Button
          label={loading ? '' : 'Continue with Google'}
          onPress={signInWithGoogle}
          disabled={busy}
          loading={loading}
        />

        <Pressable
          style={({ pressed }) => [styles.guestBtn, { borderColor: c.surfaceBorder }, pressed && { opacity: 0.7 }]}
          onPress={enterGuestMode}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Continue as guest"
        >
          <Text style={[styles.guestBtnText, { color: c.textSecondary }]}>Continue as guest</Text>
        </Pressable>

        <Text style={[styles.terms, { color: c.textTertiary }]}>
          By signing up you agree to our{' '}
          <Text style={[styles.termsLink, { color: c.textSecondary }]} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
            Terms
          </Text>
          {' & '}
          <Text style={[styles.termsLink, { color: c.textSecondary }]} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
            Privacy Policy
          </Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  blob: {
    position: 'absolute',
    top: -120,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.7,
  },

  branding: { alignItems: 'center', marginBottom: 48 },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 36, fontFamily: 'Syne_800ExtraBold', color: '#fff' },
  appName: { fontSize: 36, fontFamily: 'Syne_800ExtraBold', marginBottom: 6 },
  tagline: { fontSize: 18, fontFamily: 'SpaceGrotesk_500Medium', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center', maxWidth: 260 },

  card: { width: '100%', paddingHorizontal: 24, gap: 12 },
  errorBox: { borderRadius: 12, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular' },

  // Apple HIG: white button with black logo and text on dark backgrounds, same height as the Google button.
  appleBtn: { height: 52, width: '100%' },
  appleBtnWeb: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleBtnText: { fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold', color: '#000000' },

  terms: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_400Regular',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  termsLink: { textDecorationLine: 'underline' },
  guestBtn: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: { fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },
});

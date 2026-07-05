import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { useThemeColors, radius, fonts } from '../theme';
import { Button } from '../components/ui/Button';

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

        <Button
          label={loading ? '' : 'Continue with Google'}
          onPress={signInWithGoogle}
          disabled={loading}
          loading={loading}
        />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
          <Text style={[styles.dividerText, { color: c.textTertiary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
        </View>

        <Pressable
          style={[styles.emailBtn, { borderColor: c.surfaceBorder }]}
          onPress={() => setError('Email sign-in coming soon — use Google for now.')}
          accessibilityRole="button"
        >
          <Text style={[styles.emailBtnText, { color: c.textSecondary }]}>Sign in with email</Text>
        </Pressable>

        <Text style={[styles.terms, { color: c.textTertiary }]}>
          By signing up you agree to our Terms & Privacy Policy
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

  emailBtn: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailBtnText: { fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },

  terms: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_400Regular',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
});

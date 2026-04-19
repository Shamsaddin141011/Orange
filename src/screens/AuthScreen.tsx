import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { useState } from 'react';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { GlassCard } from '../components/GlassCard';
import { GlassBackground } from '../components/GlassBackground';
import { colors, gradients, radius, shadow } from '../theme';

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
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
    <GlassBackground style={styles.container}>
      {/* Ambient glow blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Logo */}
      <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.logoArea}>
        <LinearGradient
          colors={gradients.orangeButton as [string, string]}
          style={styles.logoCircle}
        >
          <Text style={styles.logoEmoji}>🍊</Text>
        </LinearGradient>
        <Text style={styles.appName}>OrangeUni</Text>
        <Text style={styles.tagline}>Find the university that fits you — transparently.</Text>
      </Animated.View>

      {/* Sign in card */}
      <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.cardWrap}>
        <GlassCard glow intensity={25} style={styles.card}>
          <Text style={styles.cardTitle}>Get started</Text>
          <Text style={styles.cardSub}>
            Sign in to save your shortlist, track applications, and compare schools.
          </Text>

          <Pressable
            style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
            onPress={signInWithGoogle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.orange} />
            ) : (
              <>
                <AntDesign name="google" size={20} color="#ea4335" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.legal}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </GlassCard>
      </Animated.View>

      {/* Feature pills */}
      <Animated.View entering={FadeInUp.duration(600).delay(350)} style={styles.features}>
        {[
          { icon: '🎯', text: 'Personalised matches' },
          { icon: '❤️', text: 'Save your shortlist' },
          { icon: '⚖️', text: 'Compare side by side' },
          { icon: '📋', text: 'Track applications' },
        ].map((f) => (
          <View key={f.text} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </Animated.View>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },

  blobTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.orange,
    opacity: 0.08,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.orange,
    opacity: 0.06,
  },

  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    ...shadow.orange,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  cardWrap: { width: '100%', marginBottom: 28 },
  card: { width: '100%' },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: 16,
  },
  googleBtnDisabled: { opacity: 0.6 },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  errorBox: {
    backgroundColor: colors.dangerDim,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: colors.danger, fontSize: 13 },

  legal: { fontSize: 11, color: colors.textTertiary, textAlign: 'center', lineHeight: 16 },

  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureIcon: { fontSize: 16 },
  featureText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
});

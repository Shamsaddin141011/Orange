import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      if (Platform.OS === 'web') {
        // On web: just redirect the browser — Supabase handles the callback automatically
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        if (oauthError) setError(oauthError.message);
        // Browser will redirect — no further action needed here
        return;
      }

      // Native (iOS / Android)
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
    <View style={styles.container}>
      {/* Top decoration */}
      <View style={styles.topBlob} />

      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🍊</Text>
        </View>
        <Text style={styles.appName}>OrangeUni</Text>
        <Text style={styles.tagline}>Find the university that fits you — transparently.</Text>
      </View>

      {/* Sign in card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Get started</Text>
        <Text style={styles.cardSub}>
          Sign in to save your shortlist, track applications, and compare schools across devices.
        </Text>

        <Pressable
          style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
          onPress={signInWithGoogle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#111827" />
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
      </View>

      {/* Bottom features */}
      <View style={styles.features}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  topBlob: {
    position: 'absolute',
    top: -120,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#f97316',
    opacity: 0.12,
  },
  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#f97316',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoEmoji: { fontSize: 38 },
  appName: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 8 },
  tagline: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 20 },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  googleBtnDisabled: { opacity: 0.6 },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: '#111827' },

  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { color: '#dc2626', fontSize: 13 },

  legal: { fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 16 },

  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureIcon: { fontSize: 16 },
  featureText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
});

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getUserById, getOrCreateConversation } from '../lib/supabase';
import { UserPublicProfile } from '../types';
import { useAppStore } from '../store/useAppStore';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { colors, radius } from '../theme';

export function PublicProfileScreen({ route }: any) {
  const { userId } = route.params as { userId: string };
  const navigation = useNavigation<any>();
  const { session } = useAppStore();
  const myId = session?.user.id;

  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    getUserById(userId).then((p) => { setProfile(p); setLoading(false); });
  }, [userId]);

  const handleMessage = async () => {
    if (!myId || !profile) return;
    setMessaging(true);
    try {
      const convId = await getOrCreateConversation(myId, profile.id);
      navigation.navigate('Chat', { conversationId: convId, otherUsername: profile.username });
    } catch (e) {
      console.error('Failed to open conversation', e);
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <GlassBackground style={styles.center}>
        <ActivityIndicator color={colors.orange} size="large" />
      </GlassBackground>
    );
  }

  if (!profile) {
    return (
      <GlassBackground style={styles.center}>
        <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Profile not found</Text>
      </GlassBackground>
    );
  }

  const initials = (profile.display_name || profile.username).charAt(0).toUpperCase();
  const isOwnProfile = myId === profile.id;

  return (
    <GlassBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>

        {/* Hero */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.displayName}>{profile.display_name || profile.username}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {!isOwnProfile && (
            <GlassButton
              label="Send Message"
              loading={messaging}
              onPress={handleMessage}
              style={styles.messageBtn}
            />
          )}
        </Animated.View>

        {/* Info pills */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.pillsRow}>
          {profile.country && (
            <View style={styles.infoPill}>
              <Ionicons name="globe-outline" size={13} color={colors.orange} />
              <Text style={styles.infoPillText}>{profile.country}</Text>
            </View>
          )}
          {profile.degree_level && (
            <View style={styles.infoPill}>
              <Ionicons name="school-outline" size={13} color={colors.orange} />
              <Text style={styles.infoPillText}>{profile.degree_level}</Text>
            </View>
          )}
        </Animated.View>

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <GlassCard padding={16} style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestWrap}>
                {profile.interests.map((i) => (
                  <View key={i} style={styles.interestPill}>
                    <Text style={styles.interestText}>{i}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  content: { padding: 20, paddingTop: 56 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  hero: { alignItems: 'center', paddingVertical: 12, gap: 6, position: 'relative' },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.orange,
    opacity: 0.1,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.orange,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.orangeDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 40, fontWeight: '800', color: colors.orange },
  displayName: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  username: { fontSize: 14, color: colors.textTertiary, fontWeight: '500' },
  bio: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
  messageBtn: { marginTop: 12, paddingHorizontal: 24 },

  pillsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 20, flexWrap: 'wrap' },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.orangeDim,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  infoPillText: { fontSize: 13, fontWeight: '600', color: colors.orange },

  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  interestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestPill: {
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  interestText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
});

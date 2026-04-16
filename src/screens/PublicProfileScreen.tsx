import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserById, getOrCreateConversation } from '../lib/supabase';
import { UserPublicProfile } from '../types';
import { useAppStore } from '../store/useAppStore';

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
      <View style={styles.center}>
        <ActivityIndicator color="#f97316" size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>Profile not found</Text>
      </View>
    );
  }

  const initials = (profile.display_name || profile.username).charAt(0).toUpperCase();
  const isOwnProfile = myId === profile.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar + name */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.displayName}>{profile.display_name || profile.username}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        {!isOwnProfile && (
          <Pressable
            style={[styles.messageBtn, messaging && styles.messageBtnDisabled]}
            onPress={handleMessage}
            disabled={messaging}
          >
            {messaging
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                  <Text style={styles.messageBtnText}>Send Message</Text>
                </>
            }
          </Pressable>
        )}
      </View>

      {/* Info pills */}
      <View style={styles.pillsRow}>
        {profile.country && (
          <View style={styles.infoPill}>
            <Ionicons name="globe-outline" size={14} color="#f97316" />
            <Text style={styles.infoPillText}>{profile.country}</Text>
          </View>
        )}
        {profile.degree_level && (
          <View style={styles.infoPill}>
            <Ionicons name="school-outline" size={14} color="#f97316" />
            <Text style={styles.infoPillText}>{profile.degree_level}</Text>
          </View>
        )}
      </View>

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestWrap}>
            {profile.interests.map((i) => (
              <View key={i} style={styles.interestPill}>
                <Text style={styles.interestText}>{i}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#f9fafb' },
  emptyText: { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  hero: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#f97316', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  avatarText: { fontSize: 40, fontWeight: '800', color: '#f97316' },
  displayName: { fontSize: 24, fontWeight: '800', color: '#111827' },
  username: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
  bio: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginTop: 4, paddingHorizontal: 24 },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
  },
  messageBtnDisabled: { opacity: 0.6 },
  messageBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pillsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  infoPillText: { fontSize: 13, fontWeight: '600', color: '#f97316' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  interestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestPill: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  interestText: { fontSize: 13, color: '#374151', fontWeight: '500' },
});

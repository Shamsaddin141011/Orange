import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { searchUsers, getOrCreateConversation } from '../lib/supabase';
import { UserPublicProfile } from '../types';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { useAppStore } from '../store/useAppStore';
import { colors, radius } from '../theme';

export function PeopleScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAppStore();
  const myId = session?.user.id ?? '';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserPublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessage = async (user: UserPublicProfile) => {
    if (!myId || messagingId) return;
    setMessagingId(user.id);
    try {
      const conversationId = await getOrCreateConversation(myId, user.id);
      navigation.navigate('Chat', { conversationId, otherUsername: user.username });
    } finally {
      setMessagingId(null);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setSearched(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchUsers(query.trim());
        setResults(data);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <GlassBackground>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>People</Text>
        <Pressable style={styles.inboxBtn} onPress={() => navigation.navigate('Inbox')}>
          <Ionicons name="chatbubbles-outline" size={22} color={colors.orange} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username..."
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}><ActivityIndicator color={colors.orange} /></View>
        )}

        {!loading && searched && results.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="person-outline" size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No users found for "{query}"</Text>
          </View>
        )}

        {!loading && !searched && query.length < 2 && (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Find students by username</Text>
            <Text style={styles.emptyHint}>Type at least 2 characters to search</Text>
          </View>
        )}

        {results.map((user, i) => (
          <Animated.View key={user.id} entering={FadeInDown.duration(350).delay(i * 50)}>
            <Pressable onPress={() => navigation.navigate('PublicProfile', { userId: user.id })}>
              <GlassCard padding={14} style={styles.userCard} borderRadius={radius.lg}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(user.display_name || user.username).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.displayName}>{user.display_name || user.username}</Text>
                  <Text style={styles.username}>@{user.username}</Text>
                  {user.bio ? <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text> : null}
                </View>
                <View style={styles.meta}>
                  {user.country && (
                    <View style={styles.countryPill}>
                      <Text style={styles.countryText}>{user.country}</Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.msgBtn}
                    onPress={(e) => { e.stopPropagation?.(); handleMessage(user); }}
                    disabled={messagingId === user.id}
                  >
                    {messagingId === user.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <Ionicons name="chatbubble-outline" size={13} color="#fff" />
                          <Text style={styles.msgBtnText}>Message</Text>
                        </>
                    }
                  </Pressable>
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  inboxBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.orangeDim,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassInput,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.glassInputBorder,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  list: { flex: 1, paddingHorizontal: 16 },
  center: { alignItems: 'center', paddingTop: 64, gap: 10, paddingHorizontal: 24 },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  emptyHint: { fontSize: 13, color: colors.textTertiary, textAlign: 'center' },
  userCard: { marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.orangeDim,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.orange },
  userInfo: { flex: 1, gap: 2 },
  displayName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  username: { fontSize: 13, color: colors.textTertiary },
  bio: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  meta: { alignItems: 'flex-end', gap: 6 },
  countryPill: {
    backgroundColor: colors.orangeDim,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  countryText: { fontSize: 11, fontWeight: '600', color: colors.orange },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.orange,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    minWidth: 76,
    justifyContent: 'center',
  },
  msgBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

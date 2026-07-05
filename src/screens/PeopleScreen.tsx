import { MessageCircle, Search, Users, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchUsers, getOrCreateConversation } from '../lib/supabase';
import { UserPublicProfile } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useThemeColors, radius, iconSize, shadow } from '../theme';

export function PeopleScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
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
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>People</Text>
        <Pressable
          style={[styles.inboxBtn, { backgroundColor: c.primarySurface, borderColor: c.primaryBorder }]}
          onPress={() => navigation.navigate('Inbox')}
        >
          <MessageCircle size={20} color={c.primary} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
        <Search size={iconSize.sm} color={c.textTertiary} strokeWidth={1.5} />
        <TextInput
          style={[styles.searchInput, { color: c.textPrimary }, Platform.OS === 'web' && ({ outlineWidth: 0 } as any)]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username..."
          placeholderTextColor={c.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setResults([]); setSearched(false); }} hitSlop={8}>
            <X size={iconSize.sm} color={c.textTertiary} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}><ActivityIndicator color={c.primary} /></View>
        )}

        {!loading && searched && results.length === 0 && (
          <View style={styles.center}>
            <Users size={40} color={c.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No users found for "{query}"</Text>
          </View>
        )}

        {!loading && !searched && query.length < 2 && (
          <View style={styles.center}>
            <Users size={48} color={c.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>Find students by username</Text>
            <Text style={[styles.emptyHint, { color: c.textTertiary }]}>Type at least 2 characters to search</Text>
          </View>
        )}

        {results.map((user, i) => (
          <Animated.View key={user.id} entering={FadeInDown.duration(350).delay(i * 50)}>
            <Pressable onPress={() => navigation.navigate('PublicProfile', { userId: user.id })}>
              <View style={[styles.userCard, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }, shadow.sm]}>
                <View style={[styles.avatar, { backgroundColor: c.primarySurface, borderColor: c.primaryBorder }]}>
                  <Text style={[styles.avatarText, { color: c.primary }]}>
                    {(user.display_name || user.username).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.displayName, { color: c.textPrimary }]}>{user.display_name || user.username}</Text>
                  <Text style={[styles.username, { color: c.textTertiary }]}>@{user.username}</Text>
                  {user.bio ? <Text style={[styles.bio, { color: c.textSecondary }]} numberOfLines={1}>{user.bio}</Text> : null}
                </View>
                <View style={styles.meta}>
                  {user.country && (
                    <View style={[styles.countryPill, { backgroundColor: c.primarySurface, borderColor: c.primaryBorder }]}>
                      <Text style={[styles.countryText, { color: c.primary }]}>{user.country}</Text>
                    </View>
                  )}
                  <Pressable
                    style={[styles.msgBtn, { backgroundColor: c.primary }]}
                    onPress={(e) => { e.stopPropagation?.(); handleMessage(user); }}
                    disabled={messagingId === user.id}
                  >
                    {messagingId === user.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <MessageCircle size={13} color="#fff" strokeWidth={1.5} />
                          <Text style={styles.msgBtnText}>Message</Text>
                        </>
                    }
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 68, // leave room for the global HelpFAQ button (42px + 16px + gap)
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 32, fontFamily: 'Syne_800ExtraBold', letterSpacing: -0.5 },
  inboxBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'SpaceGrotesk_400Regular' },
  list: { flex: 1, paddingHorizontal: 16 },
  center: { alignItems: 'center', paddingTop: 64, gap: 10, paddingHorizontal: 24 },
  emptyText: { fontSize: 15, fontFamily: 'SpaceGrotesk_500Medium', textAlign: 'center' },
  emptyHint: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center' },
  userCard: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontFamily: 'Syne_700Bold' },
  userInfo: { flex: 1, gap: 2 },
  displayName: { fontSize: 15, fontFamily: 'Syne_700Bold' },
  username: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular' },
  bio: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 2 },
  meta: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  countryPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  countryText: { fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold' },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    minWidth: 76,
    justifyContent: 'center',
  },
  msgBtnText: { fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold', color: '#fff' },
});

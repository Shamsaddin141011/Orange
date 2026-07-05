import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getConversations } from '../lib/supabase';
import { Conversation } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useThemeColors, radius, iconSize } from '../theme';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function InboxScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { session } = useAppStore();
  const myId = session?.user.id ?? '';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getConversations(myId);
      setConversations(data);
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [myId]));
  const handleRefresh = () => { setRefreshing(true); load(); };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}
        >
          <ArrowLeft size={iconSize.sm} color={c.textPrimary} strokeWidth={1.5} />
        </Pressable>
        <Text style={[styles.title, { color: c.textPrimary }]}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={c.primary} size="large" /></View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />}
        >
          {conversations.length === 0 && (
            <View style={styles.center}>
              <MessageCircle size={52} color={c.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>No messages yet</Text>
              <Text style={[styles.emptyHint, { color: c.textTertiary }]}>Find a student in People and start a conversation</Text>
            </View>
          )}

          {conversations.map((conv, i) => {
            const other = conv.other_user;
            const initials = other ? (other.display_name || other.username).charAt(0).toUpperCase() : '?';
            return (
              <Animated.View key={conv.id} entering={FadeInDown.duration(350).delay(i * 50)}>
                <Pressable
                  onPress={() => navigation.navigate('Chat', {
                    conversationId: conv.id,
                    otherUsername: other?.username ?? 'Unknown',
                  })}
                  style={[styles.convRow, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}
                >
                  <View style={[styles.avatar, { backgroundColor: c.primarySurface, borderColor: c.primaryBorder }]}>
                    <Text style={[styles.avatarText, { color: c.primary }]}>{initials}</Text>
                  </View>
                  <View style={styles.convInfo}>
                    <View style={styles.convTop}>
                      <Text style={[styles.convName, { color: c.textPrimary }]}>
                        {other?.display_name || other?.username || 'Unknown'}
                      </Text>
                      <Text style={[styles.convTime, { color: c.textTertiary }]}>{timeAgo(conv.last_message_at)}</Text>
                    </View>
                    <Text style={[styles.convPreview, { color: c.textSecondary }]} numberOfLines={1}>
                      {conv.last_message_content ?? 'Start a conversation'}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontFamily: 'Syne_700Bold' },
  center: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontFamily: 'Syne_700Bold' },
  emptyHint: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center', lineHeight: 20 },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 22, fontFamily: 'Syne_700Bold' },
  convInfo: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
  convTime: { fontSize: 11, fontFamily: 'SpaceGrotesk_400Regular' },
  convPreview: { fontSize: 13, fontFamily: 'SpaceGrotesk_400Regular' },
});

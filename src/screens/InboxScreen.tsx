import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getConversations } from '../lib/supabase';
import { Conversation } from '../types';
import { useAppStore } from '../store/useAppStore';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { colors, radius } from '../theme';

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
    <GlassBackground>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.orange} size="large" /></View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.orange} />}
        >
          {conversations.length === 0 && (
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={52} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyHint}>Find a student in People and start a conversation</Text>
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
                >
                  <GlassCard padding={14} style={styles.convRow} borderRadius={radius.lg}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.convInfo}>
                      <View style={styles.convTop}>
                        <Text style={styles.convName}>{other?.display_name || other?.username || 'Unknown'}</Text>
                        <Text style={styles.convTime}>{timeAgo(conv.last_message_at)}</Text>
                      </View>
                      <Text style={styles.convPreview} numberOfLines={1}>
                        {conv.last_message_content ?? 'Start a conversation'}
                      </Text>
                    </View>
                  </GlassCard>
                </Pressable>
              </Animated.View>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  center: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.textSecondary },
  emptyHint: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', lineHeight: 20 },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  convRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.orangeDim,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.orange },
  convInfo: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  convTime: { fontSize: 11, color: colors.textTertiary },
  convPreview: { fontSize: 13, color: colors.textSecondary },
});

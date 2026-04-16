import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getConversations } from '../lib/supabase';
import { Conversation } from '../types';
import { useAppStore } from '../store/useAppStore';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#f97316" size="large" /></View>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f97316" />}
        >
          {conversations.length === 0 && (
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={52} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyHint}>Find a student in People and start a conversation</Text>
            </View>
          )}

          {conversations.map((conv) => {
            const other = conv.other_user;
            const initials = other ? (other.display_name || other.username).charAt(0).toUpperCase() : '?';
            return (
              <Pressable
                key={conv.id}
                style={styles.convRow}
                onPress={() => navigation.navigate('Chat', {
                  conversationId: conv.id,
                  otherUsername: other?.username ?? 'Unknown',
                })}
              >
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
              </Pressable>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  center: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  list: { flex: 1 },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#f97316' },
  convInfo: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  convTime: { fontSize: 12, color: '#9ca3af' },
  convPreview: { fontSize: 14, color: '#6b7280' },
});

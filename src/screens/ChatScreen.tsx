import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase, getMessages, sendMessage } from '../lib/supabase';
import { Message } from '../types';
import { useAppStore } from '../store/useAppStore';
import { GlassBackground } from '../components/GlassBackground';
import { colors, radius } from '../theme';

export function ChatScreen({ route }: any) {
  const { conversationId, otherUsername } = route.params as { conversationId: string; otherUsername: string };
  const navigation = useNavigation<any>();
  const { session } = useAppStore();
  const myId = session?.user.id ?? '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    let mounted = true;

    const fetchLatest = async () => {
      if (!mounted) return;
      const msgs = await getMessages(conversationId);
      if (mounted) setMessages(msgs);
    };

    fetchLatest();
    const pollInterval = setInterval(fetchLatest, 3000);

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await sendMessage(conversationId, myId, content);
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [messages.length]);

  const otherInitial = otherUsername.charAt(0).toUpperCase();

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === myId;
    return (
      <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampThem]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <GlassBackground>
      <KeyboardAvoidingView
        style={styles.flexWithTabBar}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{otherInitial}</Text>
            </View>
            <Text style={styles.headerName}>@{otherUsername}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyChatText}>Start the conversation!</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={Platform.OS !== 'web' ? handleSend : undefined}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexWithTabBar: { flex: 1, paddingBottom: 78 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
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
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orangeDim,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 15, fontWeight: '700', color: colors.orange },
  headerName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },

  messageList: { padding: 16, gap: 4, flexGrow: 1 },
  bubbleWrap: { marginBottom: 8 },
  bubbleWrapMe: { alignItems: 'flex-end' },
  bubbleWrapThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: {
    backgroundColor: colors.orange,
    borderBottomRightRadius: 4,
    shadowColor: colors.orange,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  bubbleThem: {
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: colors.textPrimary },
  timestamp: { fontSize: 10, color: colors.textTertiary, marginTop: 3, marginHorizontal: 4 },
  timestampMe: { textAlign: 'right' },
  timestampThem: { textAlign: 'left' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyChatText: { fontSize: 14, color: colors.textTertiary, fontWeight: '500' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    gap: 10,
    backgroundColor: 'rgba(13,10,6,0.6)',
  },
  input: {
    flex: 1,
    backgroundColor: colors.glassInput,
    borderWidth: 1.5,
    borderColor: colors.glassInputBorder,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sendBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
});

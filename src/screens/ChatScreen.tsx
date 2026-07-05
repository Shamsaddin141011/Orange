import { ArrowLeft, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, getMessages, sendMessage } from '../lib/supabase';
import { Message } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useThemeColors, radius, iconSize } from '../theme';

export function ChatScreen({ route }: any) {
  const { conversationId, otherUsername } = route.params as { conversationId: string; otherUsername: string };
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
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
        <View style={[
          styles.bubble,
          isMe
            ? [styles.bubbleMe, { backgroundColor: c.primary }]
            : [styles.bubbleThem, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }],
        ]}>
          <Text style={[styles.bubbleText, { color: isMe ? '#fff' : c.textPrimary }]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: c.textTertiary }, isMe ? styles.timestampMe : styles.timestampThem]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.divider }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: c.bgElevated, borderColor: c.surfaceBorder }]}
          >
            <ArrowLeft size={iconSize.sm} color={c.textPrimary} strokeWidth={1.5} />
          </Pressable>
          <View style={styles.headerInfo}>
            <View style={[styles.headerAvatar, { backgroundColor: c.primarySurface, borderColor: c.primaryBorder }]}>
              <Text style={[styles.headerAvatarText, { color: c.primary }]}>{otherInitial}</Text>
            </View>
            <Text style={[styles.headerName, { color: c.textPrimary }]}>@{otherUsername}</Text>
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
              <Text style={[styles.emptyChatText, { color: c.textTertiary }]}>Start the conversation!</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { borderTopColor: c.divider, backgroundColor: c.bg, paddingBottom: insets.bottom + 78 }]}>
          <TextInput
            style={[styles.input, { color: c.textPrimary, borderColor: c.inputBorder, backgroundColor: c.bgElevated },
              Platform.OS === 'web' && ({ outlineWidth: 0 } as any)]}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={c.textTertiary}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            onKeyPress={(e: any) => {
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault?.();
                handleSend();
              }
            }}
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: c.primary }, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Send size={18} color="#fff" strokeWidth={2} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 15, fontFamily: 'Syne_700Bold' },
  headerName: { fontSize: 16, fontFamily: 'Syne_700Bold' },

  messageList: { padding: 16, gap: 4, flexGrow: 1 },
  bubbleWrap: { marginBottom: 8 },
  bubbleWrapMe: { alignItems: 'flex-end' },
  bubbleWrapThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleThem: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 21 },
  timestamp: { fontSize: 10, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 3, marginHorizontal: 4 },
  timestampMe: { textAlign: 'right' },
  timestampThem: { textAlign: 'left' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyChatText: { fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_400Regular',
    maxHeight: 120,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});

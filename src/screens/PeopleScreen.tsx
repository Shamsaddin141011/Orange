import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchUsers } from '../lib/supabase';
import { UserPublicProfile } from '../types';

export function PeopleScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserPublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>People</Text>
        <Pressable style={styles.inboxBtn} onPress={() => navigation.navigate('Inbox')}>
          <Ionicons name="chatbubbles-outline" size={22} color="#f97316" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username..."
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* Results */}
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}><ActivityIndicator color="#f97316" /></View>
        )}

        {!loading && searched && results.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="person-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No users found for "{query}"</Text>
          </View>
        )}

        {!loading && !searched && query.length < 2 && (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Find students by username</Text>
            <Text style={styles.emptyHint}>Type at least 2 characters to search</Text>
          </View>
        )}

        {results.map((user) => (
          <Pressable
            key={user.id}
            style={styles.userCard}
            onPress={() => navigation.navigate('PublicProfile', { userId: user.id })}
          >
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
              {user.country && <Text style={styles.country}>{user.country}</Text>}
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </View>
          </Pressable>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  inboxBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  list: { flex: 1 },
  center: { alignItems: 'center', paddingTop: 64, gap: 10, paddingHorizontal: 24 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6b7280', textAlign: 'center' },
  emptyHint: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#f97316' },
  userInfo: { flex: 1, gap: 2 },
  displayName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  username: { fontSize: 13, color: '#9ca3af' },
  bio: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  meta: { alignItems: 'flex-end', gap: 4 },
  country: {
    fontSize: 11, fontWeight: '600', color: '#f97316',
    backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
});

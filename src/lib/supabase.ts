import { createClient } from '@supabase/supabase-js';
import { Conversation, Message, UserPublicProfile } from '../types';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // On web use localStorage; on native use AsyncStorage
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export interface UniversityRow {
  id: string;
  name: string;
  country: string;
  city: string;
  state: string;
  website: string;
  majors: string[];
  degrees: string[];
  sat_min: number | null;
  sat_max: number | null;
  acceptance_rate: number | null;
  tuition_estimate: number;
  intl_aid: 'yes' | 'no' | 'unknown';
  tags: string[];
  brief_description: string;
  student_size: number | null;
}

/** Fetch universities filtered server-side, scored client-side.
 *  On production web: routes through /api/universities (rate-limited, service key).
 *  On native or local dev: calls Supabase directly via anon key + RLS.
 */
export async function fetchUniversities(params: {
  country: string;
  satTotal?: number;
  budgetMin?: number;
  budgetMax?: number;
  degreeLevel?: string;
  limit?: number;
}): Promise<UniversityRow[]> {
  const { country, satTotal, budgetMin, budgetMax, degreeLevel } = params;

  // Use the secure proxy on web (not localhost — that's local dev without a Vercel server)
  const isProductionWeb =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost');

  if (isProductionWeb) {
    const url = new URL('/api/universities', window.location.origin);
    url.searchParams.set('country', country);
    if (satTotal    != null) url.searchParams.set('satTotal',    String(satTotal));
    if (budgetMin   != null) url.searchParams.set('budgetMin',   String(budgetMin));
    if (budgetMax   != null) url.searchParams.set('budgetMax',   String(budgetMax));
    if (degreeLevel != null) url.searchParams.set('degreeLevel', degreeLevel);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? body.error ?? 'Failed to fetch universities');
    }
    return res.json();
  }

  // Native or local dev — direct Supabase with anon key (protected by RLS)
  let query = supabase
    .from('universities')
    .select('*')
    .eq('country', country)
    .limit(2000);

  if (budgetMin)   query = query.gte('tuition_estimate', budgetMin);
  if (budgetMax)   query = query.lte('tuition_estimate', budgetMax);
  if (degreeLevel) query = query.contains('degrees', [degreeLevel]);
  if (satTotal) {
    query = query
      .or(`sat_min.is.null,sat_min.lte.${satTotal + 300}`)
      .or(`sat_max.is.null,sat_max.gte.${satTotal - 300}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as UniversityRow[];
}

// ── Social / People ───────────────────────────────────────────────────────────

/** Search users by username prefix (case-insensitive). */
export async function searchUsers(query: string): Promise<UserPublicProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, country, interests, degree_level, is_public')
    .ilike('username', `%${query}%`)
    .eq('is_public', true)
    .not('username', 'is', null)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as UserPublicProfile[];
}

/** Get a single user's public profile by their ID. */
export async function getUserById(userId: string): Promise<UserPublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, country, interests, degree_level, is_public')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as UserPublicProfile;
}

/** Check if a username is already taken. Returns true if available. */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .limit(1);
  return !data || data.length === 0;
}

/** Save username + display_name + bio to the profiles table. */
export async function saveUserSocialProfile(
  userId: string,
  fields: { username?: string; display_name?: string; bio?: string; is_public?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...fields }, { onConflict: 'id' });
  if (error) throw error;
}

// ── Conversations ─────────────────────────────────────────────────────────────

/** Find an existing 1-on-1 conversation or create a new one. Returns the conversation ID. */
export async function getOrCreateConversation(myId: string, theirId: string): Promise<string> {
  // Find existing conversation with both participants
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .contains('participant_ids', [myId, theirId])
    .limit(1);

  if (existing && existing.length > 0) return (existing[0] as { id: string }).id;

  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({ participant_ids: [myId, theirId] })
    .select('id')
    .single();

  if (error) throw error;
  return newConv.id;
}

/** Get all conversations for a user, with the other participant's profile attached. */
export async function getConversations(myId: string): Promise<Conversation[]> {
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('*')
    .contains('participant_ids', [myId])
    .order('last_message_at', { ascending: false });

  if (error || !convs || convs.length === 0) return [];

  // Batch-fetch other participants' profiles
  const otherIds = convs
    .map((c: any) => (c.participant_ids as string[]).find((id) => id !== myId))
    .filter(Boolean) as string[];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, country, interests, degree_level, is_public')
    .in('id', otherIds);

  const profileMap: Record<string, UserPublicProfile> = {};
  for (const p of profiles ?? []) profileMap[p.id] = p as UserPublicProfile;

  return convs.map((c: any) => ({
    ...c,
    other_user: profileMap[(c.participant_ids as string[]).find((id) => id !== myId) ?? ''],
  })) as Conversation[];
}

// ── Messages ──────────────────────────────────────────────────────────────────

/** Load all messages for a conversation (oldest first). */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

/** Send a message and update the conversation's last_message fields. */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw error;

  // Update conversation preview (fire-and-forget)
  supabase
    .from('conversations')
    .update({ last_message_at: data.created_at, last_message_content: content })
    .eq('id', conversationId)
    .then(() => {});

  return data as Message;
}

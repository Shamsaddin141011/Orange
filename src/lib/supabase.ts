import { createClient } from '@supabase/supabase-js';
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
      throw new Error(body.error ?? 'Failed to fetch universities');
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

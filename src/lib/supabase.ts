import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface UniversityRow {
  id: string;
  name: string;
  country: string;
  city: string;
  state: string;
  website: string;
  majors: string[];
  sat_min: number | null;
  sat_max: number | null;
  acceptance_rate: number | null;
  tuition_estimate: number;
  intl_aid: 'yes' | 'no' | 'unknown';
  tags: string[];
  brief_description: string;
  student_size: number | null;
}

/** Fetch universities filtered server-side, scored client-side */
export async function fetchUniversities(params: {
  country: string;
  satTotal?: number;
  budgetMax?: number;
  limit?: number;
}): Promise<UniversityRow[]> {
  const { country, satTotal, budgetMax, limit = 2000 } = params;

  let query = supabase
    .from('universities')
    .select('*')
    .eq('country', country)
    .limit(limit);

  if (budgetMax) {
    query = query.lte('tuition_estimate', budgetMax);
  }

  // Pre-filter SAT: only fetch schools where the range overlaps with user's score ±300
  if (satTotal) {
    query = query
      .or(`sat_min.is.null,sat_min.lte.${satTotal + 300}`)
      .or(`sat_max.is.null,sat_max.gte.${satTotal - 300}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as UniversityRow[];
}

import { createClient } from '@supabase/supabase-js';

// ── Simple in-memory rate limiter ─────────────────────────────────────────────
// Resets on cold start; good enough against casual abuse.
// For production-grade limiting swap this out for Vercel KV / Upstash.
const rl = new Map<string, { n: number; reset: number }>();
const LIMIT  = 30;          // max requests per window per IP
const WINDOW = 60_000;      // 1 minute

function isLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rl.get(ip);
  if (!entry || now > entry.reset) {
    rl.set(ip, { n: 1, reset: now + WINDOW });
    return false;
  }
  entry.n++;
  return entry.n > LIMIT;
}

// ── Allowed origins ───────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  'https://www.orangeuni.org',
  'https://orangeuni.org',
]);

const VALID_COUNTRIES = new Set(['USA', 'UK', 'EU', 'China']);

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  // CORS — only allow our own domain
  const origin = req.headers['origin'] ?? '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting by IP
  const ip = ((req.headers['x-forwarded-for'] as string) ?? '')
    .split(',')[0].trim() || 'unknown';
  if (isLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — please wait a moment.' });
  }

  // ── Input validation ────────────────────────────────────────────────────────
  const { country, satTotal, budgetMin, budgetMax } = req.query as Record<string, string>;

  if (!VALID_COUNTRIES.has(country)) {
    return res.status(400).json({ error: 'Invalid country' });
  }

  const sat  = satTotal  ? Number(satTotal)  : undefined;
  const bMin = budgetMin ? Number(budgetMin) : undefined;
  const bMax = budgetMax ? Number(budgetMax) : undefined;

  if (sat  !== undefined && (isNaN(sat)  || sat  < 400 || sat  > 1600))
    return res.status(400).json({ error: 'Invalid SAT value' });
  if (bMin !== undefined && (isNaN(bMin) || bMin < 0))
    return res.status(400).json({ error: 'Invalid budgetMin' });
  if (bMax !== undefined && (isNaN(bMax) || bMax < 0))
    return res.status(400).json({ error: 'Invalid budgetMax' });

  // ── Query DB using service key (never exposed to the browser) ────────────────
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  );

  let q = supabase
    .from('universities')
    .select('*')
    .eq('country', country)
    .limit(2000);

  if (bMin) q = q.gte('tuition_estimate', bMin);
  if (bMax) q = q.lte('tuition_estimate', bMax);
  if (sat) {
    q = q
      .or(`sat_min.is.null,sat_min.lte.${sat + 300}`)
      .or(`sat_max.is.null,sat_max.gte.${sat - 300}`);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[/api/universities]', error.message);
    return res.status(500).json({ error: 'Failed to load data' });
  }

  // Cache for 5 minutes at the CDN edge
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  return res.status(200).json(data ?? []);
}

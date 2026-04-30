/**
 * Backfill `image_url` for every university row using Wikidata P18
 * (with Wikipedia pageimage as fallback).
 *
 * Mirrors the runtime lookup in src/components/UniImage.tsx so the app
 * never has to do these network round-trips at render time.
 *
 * Usage:  node scripts/backfill-images.js [--all]
 *   default: only rows where image_url IS NULL
 *   --all:   re-resolve every row (use sparingly)
 *
 * Requires .env.local with SUPABASE_URL and SUPABASE_SERVICE_KEY.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const REFRESH_ALL = process.argv.includes('--all');

const API_CHUNK = 50;          // Wikipedia/Wikidata anonymous limit
const PAGE_SIZE = 1000;        // Supabase select page size
const REQUEST_DELAY_MS = 500;  // be polite between API requests
const MAX_429_RETRIES = 4;
// Wikimedia policy requires a descriptive User-Agent with contact info.
// Without it, anonymous traffic gets throttled aggressively.
const UA = 'OrangeUniBackfill/1.0 (https://orangeuni.org; shamsaddin141011@gmail.com)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, label) {
  for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
    if (res.status !== 429) return res;
    const wait = Math.min(60_000, 5_000 * Math.pow(2, attempt));
    console.warn(`  ${label} 429 — sleeping ${wait / 1000}s (attempt ${attempt + 1}/${MAX_429_RETRIES + 1})`);
    await sleep(wait);
  }
  // Final attempt without retry — return whatever response (likely 429)
  return fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
}

const WIKI_NAME_OVERRIDES = {
  'University of Wisconsin–Madison': 'University_of_Wisconsin–Madison',
  'London School of Economics': 'London_School_of_Economics_and_Political_Science',
};
const wikiTitle = (name) => WIKI_NAME_OVERRIDES[name] ?? name.replace(/ /g, '_');

function isCampusPhoto(filename) {
  const l = filename.toLowerCase();
  if (/logo|seal|coat.of.arm|flag|map|icon|emblem|shield|crest|wordmark|mascot|portrait|headshot/.test(l)) return false;
  if (!/\.(jpg|jpeg|png|webp)$/i.test(l)) return false;
  return true;
}

const commonsImageUrl = (filename, width = 800) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;

/**
 * Resolve a chunk of universities (≤50) to image URLs.
 * Returns Map<id, url|null>.
 */
async function resolveChunk(rows) {
  const titles = rows.map((r) => wikiTitle(r.name));
  const titlesParam = titles.join('|');

  let wiki;
  try {
    const res = await fetchWithRetry(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titlesParam)}&prop=pageimages%7Cpageprops&ppprop=wikibase_item&format=json&pithumbsize=800&pilicense=any&origin=*`,
      'wiki'
    );
    if (!res.ok) throw new Error(`wiki ${res.status}`);
    wiki = await res.json();
  } catch (err) {
    console.warn(`  wiki fetch failed: ${err.message}`);
    return new Map(rows.map((r) => [r.id, null]));
  }

  const pages = wiki.query?.pages ?? {};
  const normalized = wiki.query?.normalized ?? [];
  const normMap = Object.fromEntries(normalized.map((n) => [n.from, n.to]));

  const perRow = rows.map((row, i) => {
    const title = titles[i];
    const normalizedTitle = normMap[title] ?? title;
    const page = Object.values(pages).find(
      (p) => p.title === normalizedTitle || p.title === normalizedTitle.replace(/_/g, ' ')
    );
    if (!page || page.missing !== undefined) return { id: row.id, qid: null, fallback: null };
    const qid = page.pageprops?.wikibase_item ?? null;
    const pageImageTitle = page.pageimage;
    const thumb = page.thumbnail?.source;
    const fallback = thumb && (!pageImageTitle || isCampusPhoto(pageImageTitle)) ? thumb : null;
    return { id: row.id, qid, fallback };
  });

  const qids = [...new Set(perRow.map((r) => r.qid).filter(Boolean))];
  const p18 = {};
  if (qids.length) {
    await sleep(REQUEST_DELAY_MS);
    try {
      const res = await fetchWithRetry(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(qids.join('|'))}&props=claims&format=json&origin=*`,
        'wikidata'
      );
      if (res.ok) {
        const wd = await res.json();
        for (const [qid, ent] of Object.entries(wd.entities ?? {})) {
          for (const c of ent.claims?.P18 ?? []) {
            const fname = c.mainsnak?.datavalue?.value;
            if (fname && isCampusPhoto(fname)) { p18[qid] = fname; break; }
          }
        }
      }
    } catch (err) {
      console.warn(`  wikidata fetch failed: ${err.message}`);
    }
  }

  const out = new Map();
  for (const { id, qid, fallback } of perRow) {
    const filename = qid && p18[qid];
    out.set(id, filename ? commonsImageUrl(filename) : fallback);
  }
  return out;
}

async function fetchAllRows() {
  const rows = [];
  let from = 0;
  for (;;) {
    let q = supabase.from('universities').select('id, name, image_url').range(from, from + PAGE_SIZE - 1);
    if (!REFRESH_ALL) q = q.is('image_url', null);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function updateRow(id, url) {
  const { error } = await supabase.from('universities').update({ image_url: url }).eq('id', id);
  if (error) console.warn(`  update failed for ${id}: ${error.message}`);
}

(async () => {
  console.log(`Mode: ${REFRESH_ALL ? 'refresh ALL rows' : 'only rows with NULL image_url'}`);
  const rows = await fetchAllRows();
  console.log(`Resolving ${rows.length} universities...`);

  let resolved = 0;
  let written = 0;

  for (let i = 0; i < rows.length; i += API_CHUNK) {
    const chunk = rows.slice(i, i + API_CHUNK);
    const results = await resolveChunk(chunk);

    const writes = [];
    for (const [id, url] of results) {
      resolved++;
      if (url) { written++; writes.push(updateRow(id, url)); }
    }
    await Promise.all(writes);

    const pct = ((resolved / rows.length) * 100).toFixed(1);
    console.log(`  ${resolved}/${rows.length} (${pct}%) — ${written} URLs written so far`);
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\nDone. Resolved ${resolved}, wrote ${written} image URLs (${rows.length - written} had no usable photo).`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Static, crawlable page per university for search engines.
 *
 * Runs after `expo export -p web` (see vercel.json buildCommand) and writes into dist/:
 *   dist/university/<slug>.html      one page per university (served as /university/<slug>)
 *   dist/universities.html           A–Z index of every university, grouped by country
 *   dist/sitemap-universities.xml    referenced from public/sitemap.xml
 *
 * The app itself is a client-rendered SPA, so Google only sees one page; these give every
 * school its own indexable URL with real content and a link into the app.
 *
 * Needs EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY (Vercel env, or .env.local locally).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(process.argv[2] ?? join(ROOT, 'dist'));
const SITE = 'https://www.orangeuni.org';

// ── env ──────────────────────────────────────────────────────────────────────
function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile(join(ROOT, '.env.local'));
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON_KEY) {
  // Never block the app deploy over SEO pages: warn and skip.
  console.warn('[university-pages] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY; skipping.');
  process.exit(0);
}

// ── data ─────────────────────────────────────────────────────────────────────
async function fetchAllUniversities() {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/universities?select=*&order=name.asc`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, Range: `${from}-${from + pageSize - 1}` },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

/** Commons file name from a Special:FilePath URL, or null for non-Commons images. */
function commonsFile(url) {
  const m = url?.match(/commons\.wikimedia\.org\/wiki\/Special:FilePath\/([^?]+)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]).replace(/_/g, ' '); } catch { return null; }
}

const stripHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** Author + licence for Commons photos (CC BY / BY-SA require attribution). Best effort. */
async function fetchPhotoCredits(files) {
  const credits = new Map();
  const unique = [...new Set(files)];
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const titles = chunk.map((f) => `File:${f}`).join('|');
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&format=json&titles=${encodeURIComponent(titles)}`,
        { headers: { 'User-Agent': 'OrangeUniSiteBuilder/1.0 (https://www.orangeuni.org)' }, signal: AbortSignal.timeout(20_000) },
      );
      if (!res.ok) continue;
      const data = await res.json();
      const normalized = new Map((data.query?.normalized ?? []).map((n) => [n.to, n.from]));
      for (const page of Object.values(data.query?.pages ?? {})) {
        const meta = page.imageinfo?.[0]?.extmetadata;
        if (!meta) continue;
        const title = normalized.get(page.title) ?? page.title;
        credits.set(title.replace(/^File:/, ''), {
          author: stripHtml(meta.Artist?.value).slice(0, 80) || 'Unknown author',
          license: stripHtml(meta.LicenseShortName?.value) || 'see file page',
        });
      }
    } catch {
      // Credits are best effort; pages still link to the Commons file page.
    }
  }
  return credits;
}

// ── formatting ───────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'university';
}

const pct = (r) => (r == null ? null : `${(r * 100 < 10 ? (r * 100).toFixed(1) : Math.round(r * 100))}%`);
const money = (n) => (n == null ? null : `$${Math.round(n).toLocaleString('en-US')}`);
const num = (n) => (n == null ? null : Math.round(n).toLocaleString('en-US'));
const place = (u) => [u.city, u.state, u.country].filter(Boolean).join(', ');
const AID_LABEL = { yes: 'Available', no: 'Not offered', limited: 'Limited', unknown: null };

function metaDescription(u) {
  const bits = [];
  if (u.acceptance_rate != null) bits.push(`${pct(u.acceptance_rate)} acceptance rate`);
  if (u.tuition_estimate != null) bits.push(`${money(u.tuition_estimate)}/yr tuition`);
  if (u.sat_min && u.sat_max) bits.push(`SAT ${u.sat_min}–${u.sat_max}`);
  const stats = bits.length ? `: ${bits.join(', ')}` : '';
  return `${u.name} in ${place(u)}${stats}. See programs, costs and how well you match on OrangeUni.`;
}

// ── page shell (matches public/about.html) ───────────────────────────────────
const STYLE = `
:root{--bg:#0F0A04;--card:#1A1008;--border:rgba(255,255,255,.10);--text:#FFFAF5;--muted:rgba(255,250,245,.62);--faint:rgba(255,250,245,.40);--primary:#FF6B1A}
@media (prefers-color-scheme: light){:root{--bg:#FFFAF5;--card:#FFFFFF;--border:rgba(0,0,0,.08);--text:#0F0A04;--muted:rgba(15,10,4,.60);--faint:rgba(15,10,4,.40);--primary:#FF5500}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:880px;margin:0 auto;padding:28px 16px 72px}a{color:var(--primary)}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.brand{color:var(--primary);font-weight:800;text-decoration:none;font-size:18px}
.crumbs{font-size:13px;color:var(--faint);margin-bottom:8px}.crumbs a{color:var(--faint)}
h1{font-size:34px;line-height:1.15;margin:0 0 4px;letter-spacing:-.5px}h2{font-size:19px;margin:32px 0 10px}
.loc{color:var(--muted);margin:0 0 18px}
.hero{position:relative;border-radius:18px;overflow:hidden;background:var(--card);aspect-ratio:16/8;margin-bottom:8px}
.hero img{width:100%;height:100%;object-fit:cover;display:block}
.credit{font-size:12px;color:var(--faint);margin:0 0 20px}.credit a{color:var(--faint)}
.cta{display:inline-block;background:var(--primary);color:#fff;font-weight:700;padding:13px 22px;border-radius:12px;text-decoration:none}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:20px 0}
.stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px}
.stat b{display:block;font-size:22px;color:var(--primary)}.stat span{font-size:13px;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0;list-style:none}
.chips li{border:1px solid var(--border);border-radius:999px;padding:5px 12px;font-size:14px;color:var(--muted)}
.list{columns:2 240px;padding-left:18px}.list li{margin:2px 0;break-inside:avoid}
p,li{color:var(--muted)}
footer{margin-top:48px;padding-top:16px;border-top:1px solid var(--border);color:var(--faint);font-size:14px}
`;

function shell({ title, description, canonical, body, jsonLd, ogImage }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#0F0A04">
<meta property="og:type" content="website"><meta property="og:site_name" content="OrangeUni">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
<link rel="icon" href="/favicon.ico">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
<style>${STYLE}</style>
</head><body><main>
<div class="top"><a class="brand" href="/">OrangeUni</a><a href="/" style="font-size:14px">Open the app</a></div>
${body}
<footer><a href="/universities">All universities</a> · <a href="/about">About</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a><br>
Admission statistics are estimates from public data and may be out of date. Always confirm with the university.</footer>
</main></body></html>
`;
}

function universityPage(u, slug, credit, related) {
  const url = `${SITE}/university/${slug}`;
  const file = commonsFile(u.image_url);
  const stats = [
    [pct(u.acceptance_rate), 'Acceptance rate'],
    [u.tuition_estimate != null ? `${money(u.tuition_estimate)}` : null, 'Tuition per year (est.)'],
    [u.sat_min && u.sat_max ? `${u.sat_min}–${u.sat_max}` : null, 'SAT middle 50%'],
    [num(u.student_size), 'Students'],
    [AID_LABEL[u.intl_aid] ?? null, 'Aid for international students'],
  ].filter(([v]) => v);

  const facts = [];
  if (u.acceptance_rate != null) facts.push(`admits about ${pct(u.acceptance_rate)} of applicants`);
  if (u.sat_min && u.sat_max) facts.push(`most admitted students score ${u.sat_min}–${u.sat_max} on the SAT`);
  if (u.tuition_estimate != null) facts.push(`tuition is around ${money(u.tuition_estimate)} a year`);
  const tags = (u.tags ?? []).map((t) => t.toLowerCase());
  const kind = tags.includes('public') ? 'public' : tags.includes('private') ? 'private' : '';
  const intro =
    `${u.name} is a ${kind ? `${kind} ` : ''}university in ${place(u)}.` +
    (facts.length ? ` It ${facts.join(', ')}.` : '') +
    ' On OrangeUni you can see how your own scores, interests and budget match this school, save it to your shortlist and track your application.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: u.name,
    url: u.website || undefined,
    address: { '@type': 'PostalAddress', addressLocality: u.city || undefined, addressRegion: u.state || undefined, addressCountry: u.country },
    image: u.image_url || undefined,
    mainEntityOfPage: url,
  };

  const body = `
<div class="crumbs"><a href="/universities">Universities</a> › <a href="/universities#${esc(slugify(u.country))}">${esc(u.country)}</a> › ${esc(u.name)}</div>
<h1>${esc(u.name)}</h1>
<p class="loc">${esc(place(u))}${kind ? ` · ${kind}` : ''}</p>
${u.image_url ? `<div class="hero"><img src="${esc(u.image_url)}" alt="Campus of ${esc(u.name)}" loading="eager"></div>
<p class="credit">${file ? `Photo: <a href="https://commons.wikimedia.org/wiki/File:${esc(encodeURIComponent(file.replace(/ /g, '_')))}" rel="nofollow">${esc(credit?.author ?? 'Wikimedia Commons')}${credit?.license ? ` · ${esc(credit.license)}` : ''}</a>` : `Photo: ${esc(u.name)}`}</p>` : ''}
<p>${esc(intro)}</p>
<p><a class="cta" href="/">See how you match with ${esc(u.name)}</a></p>
${stats.length ? `<div class="grid">${stats.map(([v, l]) => `<div class="stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
${u.majors?.length ? `<h2>Popular programs</h2><ul class="chips">${u.majors.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
${u.degrees?.length ? `<h2>Degrees offered</h2><ul class="chips">${u.degrees.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
${u.website ? `<h2>Official website</h2><p><a href="${esc(u.website)}" rel="nofollow noopener">${esc(u.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></p>` : ''}
${related.length ? `<h2>Similar universities</h2><ul class="list">${related.map((r) => `<li><a href="/university/${r.slug}">${esc(r.u.name)}</a> <span style="color:var(--faint)">· ${esc(place(r.u))}</span></li>`).join('')}</ul>` : ''}
`;
  return shell({
    title: `${u.name}: acceptance rate, tuition and SAT scores | OrangeUni`,
    description: metaDescription(u),
    canonical: url,
    body,
    jsonLd,
    ogImage: u.image_url,
  });
}

function indexPage(entries) {
  const byCountry = new Map();
  for (const e of entries) {
    const c = e.u.country || 'Other';
    if (!byCountry.has(c)) byCountry.set(c, []);
    byCountry.get(c).push(e);
  }
  const countries = [...byCountry.keys()].sort((a, b) => byCountry.get(b).length - byCountry.get(a).length);
  const body = `
<h1>All universities</h1>
<p class="loc">${entries.length.toLocaleString('en-US')} universities in ${countries.length} countries. Open any school to see its acceptance rate, tuition and programs, or <a href="/">find your matches in the app</a>.</p>
<ul class="chips" style="margin:16px 0 8px">${countries.map((c) => `<li><a href="#${esc(slugify(c))}" style="color:inherit;text-decoration:none">${esc(c)} (${byCountry.get(c).length})</a></li>`).join('')}</ul>
${countries
  .map(
    (c) => `<h2 id="${esc(slugify(c))}">${esc(c)}</h2><ul class="list">${byCountry
      .get(c)
      .map((e) => `<li><a href="/university/${e.slug}">${esc(e.u.name)}</a></li>`)
      .join('')}</ul>`,
  )
  .join('\n')}
`;
  return shell({
    title: 'All universities: acceptance rates, tuition and SAT scores | OrangeUni',
    description: `Browse ${entries.length.toLocaleString('en-US')} universities by country. Compare acceptance rates, tuition and SAT ranges, then see how you match on OrangeUni.`,
    canonical: `${SITE}/universities`,
    body,
  });
}

// ── build ────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(OUT)) {
    console.error(`[university-pages] Output dir ${OUT} not found; run expo export first.`);
    process.exit(1);
  }
  const rows = await fetchAllUniversities();
  console.log(`[university-pages] ${rows.length} universities`);

  // Unique slugs: name, then name-city, then name-id.
  const used = new Set();
  const entries = rows.map((u) => {
    let slug = slugify(u.name);
    if (used.has(slug)) slug = slugify(`${u.name} ${u.city ?? ''}`);
    if (used.has(slug)) slug = slugify(`${u.name} ${u.id}`);
    used.add(slug);
    return { u, slug };
  });

  const credits = await fetchPhotoCredits(entries.map((e) => commonsFile(e.u.image_url)).filter(Boolean));
  console.log(`[university-pages] ${credits.size} photo credits`);

  // Related: same state (or country), photo first, then by acceptance rate closeness.
  const byRegion = new Map();
  for (const e of entries) {
    const key = `${e.u.country}|${e.u.state || ''}`;
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key).push(e);
  }

  const dir = join(OUT, 'university');
  mkdirSync(dir, { recursive: true });
  for (const e of entries) {
    const pool = (byRegion.get(`${e.u.country}|${e.u.state || ''}`) ?? []).filter((r) => r !== e);
    const ar = e.u.acceptance_rate ?? 0.5;
    const related = pool
      .sort((a, b) => Math.abs((a.u.acceptance_rate ?? 0.5) - ar) - Math.abs((b.u.acceptance_rate ?? 0.5) - ar))
      .slice(0, 8);
    const credit = credits.get(commonsFile(e.u.image_url) ?? '');
    writeFileSync(join(dir, `${e.slug}.html`), universityPage(e.u, e.slug, credit, related));
  }

  writeFileSync(join(OUT, 'universities.html'), indexPage(entries));

  const today = new Date().toISOString().slice(0, 10);
  const urls = [`${SITE}/universities`, ...entries.map((e) => `${SITE}/university/${e.slug}`)];
  writeFileSync(
    join(OUT, 'sitemap-universities.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  console.log(`[university-pages] wrote ${entries.length} pages, universities.html and sitemap-universities.xml to ${OUT}`);
}

main().catch((e) => {
  // Never block the app deploy over SEO pages: warn and ship the app without them.
  console.warn('[university-pages] failed, skipping university pages:', e);
  process.exit(0);
});

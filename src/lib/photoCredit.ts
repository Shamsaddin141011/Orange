// Attribution for campus photos hosted on Wikimedia Commons.
// Most Commons files are CC BY / CC BY-SA, which require crediting the author
// and the licence, so the detail screen shows "Photo: <author> · <licence>".

export type PhotoCredit = {
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
  /** Commons file description page (where the full licence terms live). */
  pageUrl: string;
};

const cache: Record<string, PhotoCredit | null> = {};
const inflight: Record<string, Promise<PhotoCredit | null>> = {};

/**
 * Extracts the Commons file name from an image URL. Handles:
 *  - commons.wikimedia.org/wiki/Special:FilePath/<File>?width=800
 *  - commons.wikimedia.org/wiki/File:<File>
 *  - upload.wikimedia.org/wikipedia/commons/[thumb/]a/ab/<File>[/800px-<File>]
 * Returns null for anything else (school websites, en-wiki local uploads, etc).
 */
export function commonsFileName(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  let raw: string | undefined;
  if (u.hostname === 'commons.wikimedia.org') {
    raw = u.pathname.match(/^\/wiki\/(?:Special:FilePath\/|File:)(.+)$/)?.[1];
  } else if (u.hostname === 'upload.wikimedia.org') {
    raw = u.pathname.match(/^\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/)?.[1];
  }
  if (!raw) return null;
  try { raw = decodeURIComponent(raw); } catch { /* keep as-is */ }
  return raw.replace(/_/g, ' ');
}

/** Bare host for a non-Commons image, e.g. "www.mit.edu" → "mit.edu". */
export function photoSourceDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (/(^|\.)wiki(media|pedia|data)\.org$/.test(host)) return null;
    return host || null;
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function pageUrlFor(file: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
}

// ── Batching: collect file names within 50ms, one Commons request per 50 titles ──
type Pending = { file: string; resolve: (c: PhotoCredit | null) => void };
let queue: Pending[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
const API_CHUNK = 50;

async function processChunk(chunk: Pending[]) {
  const titles = Array.from(new Set(chunk.map(p => `File:${p.file}`)));
  const byTitle: Record<string, PhotoCredit | null> = {};
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join('|'))}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`
    );
    if (res.ok) {
      const data = await res.json();
      const normMap: Record<string, string> = {};
      for (const n of data.query?.normalized ?? []) normMap[n.from] = n.to;
      const pages: any[] = Object.values(data.query?.pages ?? {});
      for (const t of titles) {
        const target = normMap[t] ?? t;
        const page = pages.find(p => p.title === target);
        const meta = page?.imageinfo?.[0]?.extmetadata;
        if (!meta) { byTitle[t] = null; continue; }
        const author = meta.Artist?.value ? stripHtml(meta.Artist.value) : null;
        const license = meta.LicenseShortName?.value ? stripHtml(meta.LicenseShortName.value) : null;
        byTitle[t] = {
          author: author || null,
          license: license || null,
          licenseUrl: meta.LicenseUrl?.value || null,
          pageUrl: pageUrlFor(target.replace(/^File:/, '')),
        };
      }
    }
  } catch { /* resolve null below */ }
  for (const p of chunk) p.resolve(byTitle[`File:${p.file}`] ?? null);
}

async function flush() {
  const batch = queue.splice(0);
  timer = null;
  const chunks: Pending[][] = [];
  for (let i = 0; i < batch.length; i += API_CHUNK) chunks.push(batch.slice(i, i + API_CHUNK));
  await Promise.all(chunks.map(processChunk));
}

/** Author + licence for a Commons image URL; null for non-Commons URLs or on failure. */
export function fetchPhotoCredit(url: string | null | undefined): Promise<PhotoCredit | null> {
  const file = commonsFileName(url);
  if (!file) return Promise.resolve(null);
  if (cache[file] !== undefined) return Promise.resolve(cache[file]);
  const pending = inflight[file];
  if (pending) return pending;
  const p = new Promise<PhotoCredit | null>(resolve => {
    queue.push({ file, resolve });
    if (!timer) timer = setTimeout(flush, 50);
  }).then(credit => {
    cache[file] = credit;
    delete inflight[file];
    return credit;
  });
  inflight[file] = p;
  return p;
}

/** "Jane Doe · CC BY-SA 4.0" (either half may be missing). */
export function formatPhotoCredit(c: PhotoCredit): string {
  return [c.author, c.license].filter(Boolean).join(' · ');
}

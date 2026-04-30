import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, StyleProp, Text, View, ViewStyle } from 'react-native';
import { getFallbackColor } from '../data/universityImages';

type Props = {
  name: string;
  idx: number;
  imageUrl?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

const cache: Record<string, string | null> = {};

const WIKI_NAME_OVERRIDES: Record<string, string> = {
  'University of Wisconsin–Madison': 'University_of_Wisconsin–Madison',
  'London School of Economics': 'London_School_of_Economics_and_Political_Science',
};

function wikiTitle(name: string): string {
  return WIKI_NAME_OVERRIDES[name] ?? name.replace(/ /g, '_');
}

function isCampusPhoto(title: string): boolean {
  const l = title.toLowerCase();
  if (/logo|seal|coat.of.arm|flag|map|icon|emblem|shield|crest|wordmark|mascot|portrait|headshot/.test(l)) return false;
  if (!/\.(jpg|jpeg|png|webp)$/i.test(l)) return false;
  return true;
}

function commonsImageUrl(filename: string, width = 800): string {
  // Special:FilePath redirects to the actual upload.wikimedia.org thumbnail URL.
  // Browsers follow the redirect transparently when used as an <img src>.
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

// ── Batching: collect titles within 50ms, fire one Wikipedia request for all ──
// Two-step: Wikipedia (title → wikibase Q-id + fallback pageimage), then Wikidata (Q-id → P18 image).
// Wikidata P18 is curated as the entity's main photo and almost always points to a campus shot,
// whereas Wikipedia's pageimage typically returns the seal/coat-of-arms.
type PendingItem = { title: string; resolve: (url: string | null) => void };
let batchQueue: PendingItem[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

async function flushBatch() {
  const batch = batchQueue.splice(0);
  batchTimer = null;
  if (!batch.length) return;

  const titlesParam = batch.map(b => b.title).join('|');
  let wikiData: any;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titlesParam)}&prop=pageimages%7Cpageprops&ppprop=wikibase_item&format=json&pithumbsize=800&pilicense=any&origin=*`
    );
    if (!res.ok) { batch.forEach(b => b.resolve(null)); return; }
    wikiData = await res.json();
  } catch {
    batch.forEach(b => b.resolve(null));
    return;
  }

  const pages: Record<string, any> = wikiData.query?.pages ?? {};
  const normalized: { from: string; to: string }[] = wikiData.query?.normalized ?? [];
  const normMap: Record<string, string> = {};
  for (const n of normalized) normMap[n.from] = n.to;

  // Per-item: { qid, pageThumb (logo/seal fallback) }
  type Resolved = { qid: string | null; pageThumb: string | null };
  const resolvedByItem: Resolved[] = batch.map(({ title }) => {
    const normalizedTitle = normMap[title] ?? title;
    const page = Object.values(pages).find(
      (p: any) => p.title === normalizedTitle || p.title === normalizedTitle.replace(/_/g, ' ')
    ) as any;
    if (!page || page.missing !== undefined) return { qid: null, pageThumb: null };
    const qid: string | null = page.pageprops?.wikibase_item ?? null;
    const pageImageTitle: string | undefined = page.pageimage;
    const thumbSrc: string | undefined = page.thumbnail?.source;
    const pageThumb = thumbSrc && (!pageImageTitle || isCampusPhoto(pageImageTitle)) ? thumbSrc : null;
    return { qid, pageThumb };
  });

  // Wikidata P18 lookup for real campus photos
  const qids = Array.from(new Set(resolvedByItem.map(r => r.qid).filter((q): q is string => !!q)));
  const p18ByQid: Record<string, string> = {};
  if (qids.length) {
    try {
      const wdRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(qids.join('|'))}&props=claims&format=json&origin=*`
      );
      if (wdRes.ok) {
        const wd = await wdRes.json();
        for (const [qid, ent] of Object.entries<any>(wd.entities ?? {})) {
          const claims = ent.claims?.P18 ?? [];
          for (const c of claims) {
            const filename: string | undefined = c.mainsnak?.datavalue?.value;
            if (filename && isCampusPhoto(filename)) { p18ByQid[qid] = filename; break; }
          }
        }
      }
    } catch { /* fall through to thumb fallback */ }
  }

  for (let i = 0; i < batch.length; i++) {
    const { resolve } = batch[i];
    const { qid, pageThumb } = resolvedByItem[i];
    const p18 = qid ? p18ByQid[qid] : undefined;
    if (p18) { resolve(commonsImageUrl(p18)); continue; }
    resolve(pageThumb);
  }
}

function fetchCampusImage(name: string): Promise<string | null> {
  const title = wikiTitle(name);
  return new Promise(resolve => {
    batchQueue.push({ title, resolve });
    if (!batchTimer) batchTimer = setTimeout(flushBatch, 50);
  });
}

export function UniImage({ name, idx, imageUrl, style, containerStyle }: Props) {
  const bg = getFallbackColor(idx);
  const dbUri = imageUrl || null;

  const [uri, setUri] = useState<string | null | undefined>(() => {
    if (dbUri) return dbUri;
    return cache[name] !== undefined ? cache[name] : undefined;
  });

  useEffect(() => {
    if (dbUri) { setUri(dbUri); return; }
    if (cache[name] !== undefined) { setUri(cache[name]); return; }
    fetchCampusImage(name).then((url) => {
      cache[name] = url;
      setUri(url);
    });
  }, [name, dbUri]);

  const initials = name
    .split(' ')
    .filter((w) => w.length > 2 && !/^(of|the|at|and)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  const fallback = (
    <View
      style={[
        style as ViewStyle,
        containerStyle,
        { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 28, fontWeight: '800', letterSpacing: 2 }}>
        {initials}
      </Text>
    </View>
  );

  if (uri === undefined) {
    return (
      <View
        style={[
          style as ViewStyle,
          containerStyle,
          { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator color="rgba(255,255,255,0.5)" />
      </View>
    );
  }

  if (!uri) return fallback;

  return (
    <Image
      source={{ uri }}
      style={[{ resizeMode: 'cover' }, style]}
      onError={() => {
        cache[name] = null;
        setUri(null);
      }}
    />
  );
}

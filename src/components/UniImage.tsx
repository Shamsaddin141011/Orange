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
  'University of California, Berkeley': 'University_of_California,_Berkeley',
  'University of Illinois Urbana-Champaign': 'University_of_Illinois_Urbana-Champaign',
  'University of Wisconsin\u2013Madison': 'University_of_Wisconsin%E2%80%93Madison',
  'Georgia Institute of Technology': 'Georgia_Institute_of_Technology',
  'Massachusetts Institute of Technology': 'Massachusetts_Institute_of_Technology',
  'London School of Economics': 'London_School_of_Economics',
  "King's College London": "King%27s_College_London",
  'Queen Mary University of London': 'Queen_Mary_University_of_London',
};

function wikiTitle(name: string): string {
  return WIKI_NAME_OVERRIDES[name] ?? name.replace(/ /g, '_');
}

// Exclude logos, seals, coats of arms, flags, icons — keep actual campus/building photos
function isCampusPhoto(title: string): boolean {
  const l = title.toLowerCase();
  if (/logo|seal|coat.of.arm|flag|map|icon|emblem|shield|crest|wordmark|mascot|portrait|headshot/.test(l)) return false;
  if (!/\.(jpg|jpeg|png|webp)$/i.test(l)) return false;
  return true;
}

async function fetchCampusImage(name: string): Promise<string | null> {
  const title = wikiTitle(name);
  try {
    // media-list gives every image used on the Wikipedia article
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${title}`,
      { headers: { 'Api-User-Agent': 'OrangeUni/1.0' } }
    );
    const data = await res.json();
    const items: any[] = data.items ?? [];

    // Prefer wide/landscape images (srcset may have larger versions)
    const candidate = items.find(
      (item) =>
        item.type === 'image' &&
        item.title &&
        isCampusPhoto(item.title) &&
        item.srcset?.[0]?.src
    );

    if (candidate) {
      // Use the largest srcset entry
      const largest = candidate.srcset[candidate.srcset.length - 1];
      const src: string = largest?.src ?? candidate.srcset[0].src;
      return src.startsWith('//') ? `https:${src}` : src;
    }

    // Fallback: page summary thumbnail (might still be a logo, but better than nothing)
    const summary = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { headers: { 'Api-User-Agent': 'OrangeUni/1.0' } }
    );
    const sData = await summary.json();
    return sData?.originalimage?.source ?? sData?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export function UniImage({ name, idx, imageUrl, style, containerStyle }: Props) {
  const bg = getFallbackColor(idx);

  // If a DB URL is provided, use it directly — no Wikipedia fetch needed
  const dbUri = imageUrl || null;
  const cacheKey = `db:${name}`;

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

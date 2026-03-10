// Fallback colors shown when a Wikipedia image fails to load or is still fetching
const FALLBACK_COLORS = [
  '#1e3a5f', '#7c2d12', '#14532d', '#312e81', '#713f12',
  '#1c4532', '#4c1d95', '#7f1d1d', '#0c4a6e', '#3b0764',
];

export function getFallbackColor(idx: number): string {
  return FALLBACK_COLORS[idx % FALLBACK_COLORS.length] ?? '#1e3a5f';
}

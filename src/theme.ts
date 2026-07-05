import { useColorScheme } from 'react-native';

// ─── Light palette ───────────────────────────────────────────────────────────
const light = {
  primary:         '#FF5500',
  primaryLight:    '#FF8C00',
  primarySurface:  '#FFF0E6',
  primaryBorder:   'rgba(255,85,0,0.30)',

  accent:          '#0EA5E9',
  accentSurface:   '#E0F2FE',
  accentBorder:    'rgba(14,165,233,0.30)',

  bg:              '#FFFAF5',
  bgElevated:      '#FFFFFF',
  bgMuted:         '#F5F0EB',

  surface:         '#FFFFFF',
  surfaceBorder:   'rgba(0,0,0,0.08)',

  textPrimary:     '#0F0A04',
  textSecondary:   'rgba(15,10,4,0.60)',
  textTertiary:    'rgba(15,10,4,0.35)',

  success:         '#16A34A',
  successSurface:  '#DCFCE7',
  successBorder:   'rgba(22,163,74,0.30)',

  warning:         '#D97706',
  warningSurface:  '#FEF3C7',
  warningBorder:   'rgba(217,119,6,0.30)',

  danger:          '#DC2626',
  dangerSurface:   '#FEE2E2',
  dangerBorder:    'rgba(220,38,38,0.30)',

  scrim:           'rgba(0,0,0,0.50)',
  tabBarBg:        'rgba(255,250,245,0.88)',
  tabBarBorder:    'rgba(0,0,0,0.08)',
  tabActive:       '#FF5500',
  tabInactive:     'rgba(15,10,4,0.35)',

  inputBg:         '#FFFFFF',
  inputBorder:     'rgba(0,0,0,0.12)',
  inputFocusBorder:'#FF5500',

  divider:         'rgba(0,0,0,0.07)',
};

// ─── Dark palette ────────────────────────────────────────────────────────────
const dark = {
  primary:         '#FF6B1A',
  primaryLight:    '#FF9933',
  primarySurface:  'rgba(255,85,0,0.15)',
  primaryBorder:   'rgba(255,85,0,0.35)',

  accent:          '#38BDF8',
  accentSurface:   'rgba(14,165,233,0.15)',
  accentBorder:    'rgba(56,189,248,0.30)',

  bg:              '#0F0A04',
  bgElevated:      '#1A1008',
  bgMuted:         '#241508',

  surface:         'rgba(255,255,255,0.06)',
  surfaceBorder:   'rgba(255,255,255,0.10)',

  textPrimary:     '#FFFAF5',
  textSecondary:   'rgba(255,250,245,0.62)',
  textTertiary:    'rgba(255,250,245,0.36)',

  success:         '#22C55E',
  successSurface:  'rgba(34,197,94,0.15)',
  successBorder:   'rgba(34,197,94,0.30)',

  warning:         '#FBBF24',
  warningSurface:  'rgba(251,191,36,0.15)',
  warningBorder:   'rgba(251,191,36,0.30)',

  danger:          '#F87171',
  dangerSurface:   'rgba(248,113,113,0.15)',
  dangerBorder:    'rgba(248,113,113,0.30)',

  scrim:           'rgba(0,0,0,0.65)',
  tabBarBg:        'rgba(15,10,4,0.88)',
  tabBarBorder:    'rgba(255,255,255,0.10)',
  tabActive:       '#FF6B1A',
  tabInactive:     'rgba(255,250,245,0.36)',

  inputBg:         'rgba(255,255,255,0.06)',
  inputBorder:     'rgba(255,255,255,0.12)',
  inputFocusBorder:'#FF6B1A',

  divider:         'rgba(255,255,255,0.07)',
};

export type ThemeColors = typeof light;

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

// ─── Static theme tokens (not color-scheme dependent) ────────────────────────

export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
} as const;

export const iconSize = {
  xs:   14,
  sm:   16,
  md:   20,
  lg:   24,
  xl:   32,
  hero: 48,
} as const;

export const layout = {
  screenPadding:    16,
  cardGap:          12,
  sectionGap:       32,
  tabBarHeight:     62,
  tabBarBottomOffset: 16,
  headerHeight:     56,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  orange: {
    shadowColor: '#FF5500',
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  // Legacy aliases used by Glass* components
  orangeSubtle: {
    shadowColor: '#FF5500',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  dark: {
    shadowColor: '#000',
    shadowOpacity: 0.50,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  darkSubtle: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
} as const;

// ─── Spring / animation configs ───────────────────────────────────────────────

export const spring = {
  snappy:   { damping: 20,  stiffness: 300, mass: 0.8 },
  standard: { damping: 22,  stiffness: 220, mass: 1   },
  gentle:   { damping: 28,  stiffness: 160, mass: 1   },
} as const;

export const duration = {
  instant:  80,
  fast:     150,
  normal:   250,
  slow:     350,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const fonts = {
  heading:       'Syne_700Bold',
  headingXBold:  'Syne_800ExtraBold',
  body:          'SpaceGrotesk_400Regular',
  bodyMedium:    'SpaceGrotesk_500Medium',
  bodyBold:      'SpaceGrotesk_700Bold',
} as const;

export const fontSize = {
  xs:  12,
  sm:  14,
  md:  16,
  lg:  18,
  xl:  20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

// ─── Legacy aliases (kept for gradual migration of Glass* components) ────────
export const colors = {
  ...light,
  // Old names still referenced by legacy Glass* components
  orange:               light.primary,
  orangeLight:          light.primaryLight,
  orangeDim:            light.primarySurface,
  orangeGlow:           'rgba(255,85,0,0.25)',
  orangeBorder:         light.primaryBorder,
  bgDeep:               '#0F0A04',
  bgGradientStart:      '#1A0A00',
  bgGradientEnd:        '#0D0D1A',
  glassCard:            'rgba(255,255,255,0.07)',
  glassCardHover:       'rgba(255,255,255,0.11)',
  glassBorder:          light.surfaceBorder,
  glassInput:           'rgba(255,255,255,0.06)',
  glassInputBorder:     'rgba(255,255,255,0.18)',
  glassInputFocusBorder:light.inputFocusBorder,
  textOrange:           light.primary,
  successDim:           light.successSurface,
  dangerDim:            light.dangerSurface,
  warningDim:           light.warningSurface,
  tabBarBg:             light.tabBarBg,
  tabBarBorder:         light.tabBarBorder,
  tabActive:            light.tabActive,
  tabInactive:          light.tabInactive,
};
export const gradients = {
  background: [light.bg, light.bgMuted] as string[],
  orangeButton: ['#FF6B1A', '#FF4400'] as string[],
  card: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)'] as string[],
  heroBanner: ['#2A1000', '#1A0A00'] as string[],
};
export const blur = { card: 20, modal: 40, tabBar: 30 };

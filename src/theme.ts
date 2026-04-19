/**
 * OrangeUni Design System — Glassmorphism theme
 * Dark orange → dark slate gradient background
 * Orange (#FF7A2F) as hero accent
 * Frosted glass cards with refined glows
 */

export const colors = {
  // Backgrounds
  bgDeep: '#0D0A06',        // near-black warm
  bgGradientStart: '#1A0A00', // dark burnt orange
  bgGradientEnd: '#0D0D1A',   // dark slate

  // Orange accent
  orange: '#FF7A2F',
  orangeLight: '#FF9A5C',
  orangeDim: 'rgba(255,122,47,0.18)',
  orangeGlow: 'rgba(255,122,47,0.25)',
  orangeBorder: 'rgba(255,122,47,0.45)',

  // Glass surfaces
  glassCard: 'rgba(255,255,255,0.07)',
  glassCardHover: 'rgba(255,255,255,0.11)',
  glassBorder: 'rgba(255,255,255,0.13)',
  glassInput: 'rgba(255,255,255,0.06)',
  glassInputBorder: 'rgba(255,255,255,0.18)',
  glassInputFocusBorder: 'rgba(255,122,47,0.6)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textTertiary: 'rgba(255,255,255,0.38)',
  textOrange: '#FF7A2F',

  // Status
  success: '#22C55E',
  successDim: 'rgba(34,197,94,0.18)',
  danger: '#F87171',
  dangerDim: 'rgba(248,113,113,0.18)',
  warning: '#FBBF24',
  warningDim: 'rgba(251,191,36,0.18)',

  // Tab bar
  tabBarBg: 'rgba(20,12,4,0.85)',
  tabBarBorder: 'rgba(255,255,255,0.10)',
  tabActive: '#FF7A2F',
  tabInactive: 'rgba(255,255,255,0.38)',
};

export const blur = {
  card: 20,
  modal: 40,
  tabBar: 30,
  overlay: 60,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
};

export const shadow = {
  orange: {
    shadowColor: '#FF7A2F',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  orangeSubtle: {
    shadowColor: '#FF7A2F',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  dark: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
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
};

export const gradients = {
  background: [colors.bgGradientStart, '#130D18', colors.bgGradientEnd] as string[],
  card: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)'] as string[],
  orangeButton: ['#FF8C42', '#FF6B1A'] as string[],
  heroBanner: ['#2A1000', '#1A0A00'] as string[],
};

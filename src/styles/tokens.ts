// Design tokens for Buddy Up – extracted from design system docs
// Light and dark palettes with semantic naming. Numbers follow 4px grid.

export const COLORS = {
  primary: {
    50: '#F0FDE8',
    100: '#E8F5E9',
    200: '#C8E6C9',
    300: '#A3E85C',
    400: '#7DE02A',
    500: '#58CC02',
    600: '#45A802',
    700: '#357A00',
    800: '#265700',
    900: '#1E4400',
  },
  secondary: {
    50: '#E1F5FE',
    100: '#B3E5FC',
    200: '#81D4FA',
    300: '#4FC3F7',
    400: '#38BDF8',
    500: '#1CB0F6',
    600: '#0EA5E9',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  neutral: {
    50: '#FAFBFC',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E5E7EB',
    400: '#BDBDBD',
    500: '#9CA3AF',
    600: '#757575',
    700: '#6B6B6B',
    800: '#424242',
    900: '#1F1F1F',
  },
  semantic: {
    success: '#58CC02',
    error: '#FF4444',
    warning: '#FF9600',
    info: '#1CB0F6',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #58CC02 0%, #45A802 100%)',
    secondary: 'linear-gradient(135deg, #1CB0F6 0%, #0EA5E9 100%)',
  },
} as const;

export const SPACING = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const RADIUS = {
  none: 0,
  sm: 8,
  md: 12,
  base: 14, // buttons
  lg: 16, // cards
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const SHADOWS = {
  none: { shadowColor: '#000', shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 20 },
    elevation: 9,
  },
} as const;

export const SIZES = {
  button: { sm: 40, md: 52, lg: 60 },
  input: { sm: 40, md: 52, lg: 60 },
  icon: { xs: 12, sm: 16, md: 20, lg: 24, xl: 32, xxl: 40, xxxl: 56 },
  avatar: { xs: 24, sm: 32, md: 40, lg: 48, xl: 56, xxl: 64, xxxl: 80 },
  touchTarget: 44,
} as const;

export const TYPOGRAPHY = {
  families: {
    display: 'Poppins',
    body: 'Inter',
  },
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  scale: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.6 },
} as const;

export const TRANSITIONS = {
  duration: { instant: 100, fast: 200, base: 300, slow: 500 },
  easing: {
    easeIn: 'cubic-bezier(0.4,0,1,1)',
    easeOut: 'cubic-bezier(0,0,0.2,1)',
    easeInOut: 'cubic-bezier(0.4,0,0.2,1)',
  },
} as const;

export type Colors = typeof COLORS;
export type Spacing = typeof SPACING;
export type Radius = typeof RADIUS;
export type Shadows = typeof SHADOWS;
export type Sizes = typeof SIZES;
export type Typography = typeof TYPOGRAPHY;
export type Transitions = typeof TRANSITIONS;

import { COLORS, SPACING, RADIUS, SHADOWS, SIZES, TYPOGRAPHY, TRANSITIONS } from './tokens';

export const lightTheme = {
  colors: {
    ...COLORS,
    background: COLORS.neutral[50],
    surface: '#FFFFFF',
    text: {
      primary: COLORS.neutral[900],
      secondary: COLORS.neutral[700],
      tertiary: COLORS.neutral[500],
      inverse: '#FFFFFF',
    },
    border: COLORS.neutral[300],
    code: {
      ...COLORS.code,
    },
  },
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  sizes: SIZES,
  typography: TYPOGRAPHY,
  transitions: TRANSITIONS,
  dark: false,
} as const;

export const darkTheme = {
  colors: {
    ...COLORS,
    background: '#0D1117',
    surface: '#161B22',
    text: {
      primary: '#E6EDF3',
      secondary: '#9AA4AE',
      tertiary: '#7D8893',
      inverse: '#0D1117',
    },
    border: '#30363D',
    code: {
      background: '#111827',
      text: '#E6EDF3',
      border: '#1F2937',
    },
  },
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  sizes: SIZES,
  typography: TYPOGRAPHY,
  transitions: TRANSITIONS,
  dark: true,
} as const;

export type Theme = typeof lightTheme | typeof darkTheme;

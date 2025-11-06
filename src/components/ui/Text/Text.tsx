import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../../../styles';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'bodySmall'
  | 'caption';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: TextColor;
};

const stylesForVariant = (variant: TextVariant, theme: ReturnType<typeof useTheme>['theme']) => {
  const s = theme.typography.scale;
  switch (variant) {
    case 'h1':
      return {
        fontFamily: theme.typography.families.display,
        fontSize: s['4xl'],
        lineHeight: Math.round(s['4xl'] * 1.25),
        fontWeight: '700' as const,
      };
    case 'h2':
      return {
        fontFamily: theme.typography.families.display,
        fontSize: s['3xl'],
        lineHeight: Math.round(s['3xl'] * 1.28),
        fontWeight: '700' as const,
      };
    case 'h3':
      return {
        fontFamily: theme.typography.families.display,
        fontSize: s['2xl'],
        lineHeight: Math.round(s['2xl'] * 1.33),
        fontWeight: '600' as const,
      };
    case 'h4':
      return {
        fontFamily: theme.typography.families.display,
        fontSize: theme.typography.scale.xl,
        lineHeight: Math.round(theme.typography.scale.xl * 1.4),
        fontWeight: '600' as const,
      };
    case 'h5':
      return {
        fontFamily: theme.typography.families.display,
        fontSize: theme.typography.scale.lg + 2,
        lineHeight: Math.round((theme.typography.scale.lg + 2) * 1.4),
        fontWeight: '600' as const,
      };
    case 'h6':
      return {
        fontFamily: theme.typography.families.display,
        fontSize: theme.typography.scale.lg,
        lineHeight: Math.round(theme.typography.scale.lg * 1.4),
        fontWeight: '600' as const,
      };
    case 'caption':
      return {
        fontFamily: theme.typography.families.body,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '400' as const,
      };
    case 'bodySmall':
      return {
        fontFamily: theme.typography.families.body,
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '400' as const,
      };
    default:
      return {
        fontFamily: theme.typography.families.body,
        fontSize: theme.typography.scale.base,
        lineHeight: 24,
        fontWeight: '400' as const,
      };
  }
};

const colorFor = (color: TextColor, theme: ReturnType<typeof useTheme>['theme']) => {
  const c = theme.colors;
  switch (color) {
    case 'secondary':
      return c.text.secondary;
    case 'tertiary':
      return c.text.tertiary;
    case 'inverse':
      return c.text.inverse;
    case 'success':
      return c.semantic.success;
    case 'error':
      return c.semantic.error;
    case 'warning':
      return c.semantic.warning;
    case 'info':
      return c.semantic.info;
    default:
      return c.text.primary;
  }
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const base = stylesForVariant(variant, theme);
  const resolvedColor = colorFor(color, theme);
  return (
    <RNText style={[base, { color: resolvedColor } as any, style]} {...rest}>
      {children}
    </RNText>
  );
};

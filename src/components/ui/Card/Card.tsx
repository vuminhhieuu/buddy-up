import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../../styles';
import type { Spacing } from '../../../styles/tokens';
import type { Shadows } from '../../../styles/tokens';

export type CardProps = ViewProps & {
  padding?: keyof Spacing;
  elevation?: keyof Shadows;
};

export const Card: React.FC<CardProps> = ({
  children,
  padding = 5,
  elevation = 'md',
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing[padding],
        },
        theme.shadows[elevation],
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

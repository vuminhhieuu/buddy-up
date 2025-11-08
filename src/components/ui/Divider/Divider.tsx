import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../../styles';

export type DividerProps = ViewProps & { inset?: number };

export const Divider: React.FC<DividerProps> = ({ inset = 0, style, ...rest }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[{ height: 1, backgroundColor: theme.colors.border, marginLeft: inset }, style]}
      {...rest}
    />
  );
};

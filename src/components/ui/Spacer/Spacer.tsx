import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../styles';
import type { Spacing } from '../../../styles/tokens';

export type SpacerProps = {
  size?: keyof Spacing | number;
  horizontal?: boolean;
};

export const Spacer: React.FC<SpacerProps> = ({ size = 4, horizontal = false }) => {
  const { theme } = useTheme();
  const value = typeof size === 'number' ? size : (theme.spacing as any)[size];
  return <View style={horizontal ? { width: value } : { height: value }} />;
};

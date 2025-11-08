import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../styles';

export type SpacerProps = {
  size?: keyof typeof theme.spacing | number;
  horizontal?: boolean;
};

export const Spacer: React.FC<SpacerProps> = ({ size = 4, horizontal = false }) => {
  const { theme } = useTheme();
  const value = typeof size === 'number' ? size : (theme.spacing as any)[size];
  return <View style={horizontal ? { width: value } : { height: value }} />;
};

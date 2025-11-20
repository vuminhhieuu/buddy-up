import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';

export type ProgressBarVariant = 'primary' | 'secondary' | 'blue' | 'orange' | 'green';

export type ProgressBarProps = {
  progress: number;
  variant?: ProgressBarVariant;
  height?: number;
  style?: ViewStyle;
  showBackground?: boolean;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'primary',
  height = 8,
  style,
  showBackground = true,
}) => {
  const { theme } = useTheme();
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const getVariantColor = (): string => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary[500];
      case 'secondary':
        return theme.colors.secondary[500];
      case 'blue':
        return theme.colors.secondary[500];
      case 'orange':
        return theme.colors.semantic.warning;
      case 'green':
        return theme.colors.primary[500];
      default:
        return theme.colors.primary[500];
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: showBackground ? theme.colors.neutral[200] : 'transparent',
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: getVariantColor(),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fill: {},
});

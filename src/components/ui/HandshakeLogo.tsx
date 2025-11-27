import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../styles';

interface HandshakeLogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const HandshakeLogo: React.FC<HandshakeLogoProps> = ({ size = 'medium', style }) => {
  const { theme } = useTheme();

  const sizeConfig = {
    small: {
      containerSize: 40,
      iconSize: 20,
      borderRadius: theme.radius.md,
    },
    medium: {
      containerSize: 56,
      iconSize: 28,
      borderRadius: theme.radius.lg,
    },
    large: {
      containerSize: 72,
      iconSize: 36,
      borderRadius: theme.radius.xl,
    },
  };

  const config = sizeConfig[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: config.containerSize,
          height: config.containerSize,
          borderRadius: config.borderRadius,
          backgroundColor: theme.colors.primary[400],
        },
        style,
      ]}
    >
      <Text style={[styles.icon, { fontSize: config.iconSize }]}>🤝</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});

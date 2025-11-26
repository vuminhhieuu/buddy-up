import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../styles';

type HandshakeLogoSize = 'small' | 'medium' | 'large';

interface HandshakeLogoProps {
  size?: HandshakeLogoSize;
  style?: ViewStyle;
  emoji?: string;
  backgroundColor?: string;
}

export const HandshakeLogo: React.FC<HandshakeLogoProps> = ({
  size = 'medium',
  style,
  emoji = '🤝',
  backgroundColor,
}) => {
  const { theme } = useTheme();
  const config: Record<
    HandshakeLogoSize,
    { containerSize: number; iconSize: number; borderRadius: number }
  > = {
    small: { containerSize: 40, iconSize: 20, borderRadius: theme.radius.md },
    medium: { containerSize: 56, iconSize: 28, borderRadius: theme.radius.lg },
    large: { containerSize: 72, iconSize: 36, borderRadius: theme.radius.xl },
  };
  const sizeStyle = config[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeStyle.containerSize,
          height: sizeStyle.containerSize,
          borderRadius: sizeStyle.borderRadius,
          backgroundColor: backgroundColor ?? theme.colors.primary[400],
        },
        style,
      ]}
    >
      <Text style={[styles.icon, { fontSize: sizeStyle.iconSize }]}>{emoji}</Text>
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

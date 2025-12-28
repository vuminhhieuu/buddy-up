import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../styles';

type HandshakeLogoSize = 'small' | 'medium' | 'large';

interface HandshakeLogoProps {
  size?: HandshakeLogoSize;
  style?: ViewStyle;
  backgroundColor?: string;
}

export const HandshakeLogo: React.FC<HandshakeLogoProps> = ({
  size = 'medium',
  style,
  backgroundColor,
}) => {
  const { theme } = useTheme();
  const config: Record<
    HandshakeLogoSize,
    { containerSize: number; iconSize: number; borderRadius: number }
  > = {
    small: { containerSize: 40, iconSize: 24, borderRadius: theme.radius.md },
    medium: { containerSize: 56, iconSize: 32, borderRadius: theme.radius.lg },
    large: { containerSize: 72, iconSize: 40, borderRadius: theme.radius.xl },
  };
  const sizeStyle = config[size];

  // Use appropriate logo size based on container size
  const logoSource = (() => {
    if (sizeStyle.iconSize <= 24) {
      return require('../../../assets/buddyup-logo-64.png');
    } else if (sizeStyle.iconSize <= 32) {
      return require('../../../assets/buddyup-logo-128.png');
    } else {
      return require('../../../assets/buddyup-logo-192.png');
    }
  })();

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeStyle.containerSize,
          height: sizeStyle.containerSize,
          borderRadius: sizeStyle.borderRadius,
          backgroundColor: backgroundColor ?? theme.colors.surface,
        },
        style,
      ]}
    >
      <Image
        source={logoSource}
        style={[
          styles.logo,
          {
            width: sizeStyle.iconSize,
            height: sizeStyle.iconSize,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    tintColor: undefined, // Keep original colors
  },
});

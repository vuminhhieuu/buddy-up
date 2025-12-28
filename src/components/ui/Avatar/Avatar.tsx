import React from 'react';
import { Image, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type AvatarProps = {
  uri?: string;
  name?: string; // for initials fallback
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | number;
  style?: ViewStyle;
};

function getInitials(name?: string) {
  if (!name) return null; // Will use logo instead
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '');
  return letters.join('');
}

// Get logo source and size based on avatar dimension
function getLogoConfig(avatarDim: number) {
  // Logo should be about 60-70% of avatar size
  const logoSize = Math.round(avatarDim * 0.65);

  // Choose appropriate logo asset based on size
  let logoSource;
  if (logoSize <= 24) {
    logoSource = require('../../../../assets/buddyup-logo-64.png');
  } else if (logoSize <= 32) {
    logoSource = require('../../../../assets/buddyup-logo-128.png');
  } else {
    logoSource = require('../../../../assets/buddyup-logo-192.png');
  }

  return { logoSource, logoSize };
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 'md', style }) => {
  const { theme } = useTheme();
  const dim = typeof size === 'number' ? size : theme.sizes.avatar[size];
  const common = { width: dim, height: dim, borderRadius: dim / 2 } as const;
  if (uri) {
    return <Image source={{ uri }} style={[common as any, style as any]} />;
  }

  const initials = getInitials(name);
  const { logoSource, logoSize } = getLogoConfig(dim);

  return (
    <View
      style={[
        common,
        {
          backgroundColor: theme.colors.primary[500],
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {initials ? (
        <Text
          variant="body"
          color="inverse"
          style={{ fontFamily: theme.typography.families.display, fontWeight: '600' as const }}
        >
          {initials}
        </Text>
      ) : (
        <Image
          source={logoSource}
          style={{
            width: logoSize,
            height: logoSize,
          }}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

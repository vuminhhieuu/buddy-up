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
  if (!name) return '🤝';
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '');
  return letters.join('');
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 'md', style }) => {
  const { theme } = useTheme();
  const dim = typeof size === 'number' ? size : theme.sizes.avatar[size];
  const common = { width: dim, height: dim, borderRadius: dim / 2 } as const;
  if (uri) {
    return <Image source={{ uri }} style={[common as any, style as any]} />;
  }
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
      <Text
        variant="body"
        color="inverse"
        style={{ fontFamily: theme.typography.families.display, fontWeight: '600' as const }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
};

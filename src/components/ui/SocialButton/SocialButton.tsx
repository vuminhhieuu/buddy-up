import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../../styles';
import { GoogleIcon, FacebookIcon } from '../../../assets/icons';
import { Text } from '../Text/Text';
import type { ViewStyle } from 'react-native';

export type SocialButtonProps = {
  provider: 'google' | 'facebook';
  onPress: () => void;
  style?: ViewStyle;
};

export const SocialButton: React.FC<SocialButtonProps> = ({ provider, onPress, style }) => {
  const { theme } = useTheme();

  return (
    <Pressable
      style={[
        {
          flex: 1,
          height: theme.sizes.button.md,
          backgroundColor: theme.colors.surface,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.base,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          marginHorizontal: 6,
        },
        style,
      ]}
      onPress={onPress}
    >
      {provider === 'google' ? <GoogleIcon size={20} /> : <FacebookIcon size={20} />}
      <View style={{ width: theme.spacing[2] }} />
      <Text variant="body" style={{ fontWeight: '600' as const }}>
        {provider === 'google' ? 'Google' : 'Facebook'}
      </Text>
    </Pressable>
  );
};

import React from 'react';
import { Pressable, View, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../styles';
import { GoogleIcon, FacebookIcon } from '../../../assets/icons';
import { Text } from '../Text/Text';
import type { ViewStyle } from 'react-native';

export type SocialButtonProps = {
  provider: 'google' | 'facebook';
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
};

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  loading = false,
  style,
}) => {
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
          opacity: loading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
      ) : (
        <>
          {provider === 'google' ? <GoogleIcon size={20} /> : <FacebookIcon size={20} />}
          <View style={{ width: theme.spacing[2] }} />
          <Text variant="body" style={{ fontWeight: '600' as const }}>
            {provider === 'google' ? 'Google' : 'Facebook'}
          </Text>
        </>
      )}
    </Pressable>
  );
};

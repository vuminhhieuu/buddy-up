import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';

export type LoadingProps = {
  message?: string;
  fullScreen?: boolean;
};

export const Loading: React.FC<LoadingProps> = ({ message, fullScreen }) => {
  const { theme } = useTheme();
  const body = (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: theme.spacing[6] }}>
      <ActivityIndicator color={theme.colors.primary[500]} />
      {message ? (
        <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.spacing[3] }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
  if (fullScreen) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }}>{body}</View>;
  }
  return body;
};

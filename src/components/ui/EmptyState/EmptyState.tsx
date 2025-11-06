import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';
import { Button } from '../Button/Button';

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onActionPress,
  icon,
}) => {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: theme.spacing[8] }}>
      {icon ? <View style={{ marginBottom: theme.spacing[4] }}>{icon}</View> : null}
      <Text variant="h4" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text
          variant="bodySmall"
          color="secondary"
          style={{ marginTop: theme.spacing[2], textAlign: 'center' }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onActionPress ? (
        <View style={{ marginTop: theme.spacing[6] }}>
          <Button label={actionLabel} onPress={onActionPress} />
        </View>
      ) : null}
    </View>
  );
};

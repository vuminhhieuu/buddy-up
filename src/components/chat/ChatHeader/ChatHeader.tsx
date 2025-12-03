/**
 * ChatHeader Component
 * Header for chat detail screen with participant info and back button
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Avatar } from '../../ui/Avatar/Avatar';
import { BackButton } from '../../navigation/BackButton';
import { Spacer } from '../../ui/Spacer/Spacer';

export type ChatHeaderProps = {
  participantName: string;
  participantAvatar?: string | null;
  onBack?: () => void;
  showBackButton?: boolean;
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  participantName,
  participantAvatar,
  onBack,
  showBackButton = true,
}) => {
  const { theme } = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  };

  return (
    <View style={containerStyle}>
      {showBackButton && (
        <>
          <BackButton onPress={onBack} accessibilityLabel="Quay lại" />
          <Spacer size={3} horizontal />
        </>
      )}
      <Avatar uri={participantAvatar || undefined} name={participantName} size="md" />
      <Spacer size={3} horizontal />
      <View style={{ flex: 1 }}>
        <Text variant="h6" numberOfLines={1}>
          {participantName}
        </Text>
        <Text variant="caption" color="secondary">
          Đang hoạt động
        </Text>
      </View>
    </View>
  );
};

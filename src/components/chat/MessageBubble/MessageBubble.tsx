/**
 * MessageBubble Component
 * Displays a single chat message with different styling for sent/received messages
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Spacer } from '../../ui/Spacer/Spacer';
import { formatRelativeTime } from '../../../utils/date';
import type { Message } from '../../../services/chat';

export type MessageBubbleProps = {
  message: Message;
  isSent: boolean; // true if message is from current user
  showAvatar?: boolean; // show avatar (for received messages)
  showTimestamp?: boolean; // show timestamp
  senderName?: string; // sender name for received messages
  senderAvatar?: string | null; // sender avatar URL
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSent,
  showAvatar = false,
  showTimestamp = true,
  senderName,
  senderAvatar,
}) => {
  const { theme } = useTheme();

  const bubbleStyle: ViewStyle = {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.radius.lg,
    backgroundColor: isSent ? theme.colors.primary[500] : theme.colors.surface,
    borderWidth: isSent ? 0 : 1.5,
    borderColor: theme.colors.border,
  };

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: isSent ? 'flex-end' : 'flex-start',
    marginVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[4],
  };

  return (
    <View style={containerStyle}>
      {!isSent && showAvatar && (
        <>
          <Avatar uri={senderAvatar || undefined} name={senderName} size="sm" />
          <Spacer size={2} horizontal />
        </>
      )}
      <View style={{ alignItems: isSent ? 'flex-end' : 'flex-start' }}>
        {!isSent && senderName && (
          <>
            <Text variant="caption" color="secondary" style={{ marginBottom: theme.spacing[1] }}>
              {senderName}
            </Text>
          </>
        )}
        <View style={bubbleStyle}>
          {message.content ? (
            <Text variant="body" color={isSent ? 'inverse' : 'primary'} style={{ lineHeight: 20 }}>
              {message.content}
            </Text>
          ) : null}
          {message.attachments && message.attachments.length > 0 ? (
            <Text variant="caption" color={isSent ? 'inverse' : 'secondary'}>
              📎 {message.attachments.length} file đính kèm
            </Text>
          ) : null}
        </View>
        {showTimestamp && (
          <Text
            variant="caption"
            color="tertiary"
            style={{ marginTop: theme.spacing[1], paddingHorizontal: theme.spacing[1] }}
          >
            {formatRelativeTime(message.created_at, 'full')}
          </Text>
        )}
      </View>
      {isSent && showAvatar && (
        <>
          <Spacer size={2} horizontal />
          <Avatar uri={senderAvatar || undefined} name={senderName} size="sm" />
        </>
      )}
    </View>
  );
};

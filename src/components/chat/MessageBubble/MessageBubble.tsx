/**
 * MessageBubble Component
 * Simple bubble renderer for chat messages.
 */

import React, { useMemo } from 'react';
import { View, ViewStyle, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../styles';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Spacer } from '../../ui/Spacer/Spacer';
import { Text } from '../../ui/Text/Text';
import { formatRelativeTime } from '../../../utils/date';
import type { Message } from '../../../services/chat';

type BubbleVariant = 'text' | 'code' | 'status';

export type MessageBubbleProps = {
  message: Message;
  isSent: boolean;
  variant?: BubbleVariant;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  senderName?: string;
  senderAvatar?: string | null;
  statusIcon?: string;
  isSelected?: boolean;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSent,
  variant = 'text',
  showAvatar = false,
  showTimestamp = true,
  senderName,
  senderAvatar,
  statusIcon = '✓',
  isSelected = false,
}) => {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const horizontalPadding = theme.spacing[6] ?? 24;

  const maxBubbleWidth = useMemo(() => {
    const cappedWidth = Math.max(windowWidth - horizontalPadding, 0);
    return Math.min(windowWidth * 0.65, cappedWidth);
  }, [windowWidth, horizontalPadding]);

  const bubbleStyle: ViewStyle = {
    maxWidth: maxBubbleWidth,
    paddingHorizontal: variant === 'code' ? theme.spacing[5] : theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.radius.lg,
    borderTopRightRadius: isSent ? theme.radius.sm : theme.radius.lg,
    borderTopLeftRadius: isSent ? theme.radius.lg : theme.radius.sm,
    backgroundColor:
      variant === 'code'
        ? '#1F1F1F'
        : variant === 'status'
          ? theme.colors.surface
          : isSent
            ? theme.colors.primary[500]
            : theme.colors.surface,
    borderWidth: variant === 'status' ? 0 : isSent ? 0 : 1.5,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: variant === 'status' ? 0 : 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: variant === 'status' ? 0 : 3,
  };
  if (isSelected) {
    bubbleStyle.borderColor = theme.colors.primary[200];
    bubbleStyle.borderWidth = 2;
  }

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: isSent ? 'flex-end' : 'flex-start',
    marginVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[1],
  };

  return (
    <View style={containerStyle}>
      {!isSent && showAvatar && (
        <>
          <Avatar
            uri={senderAvatar || undefined}
            name={senderName}
            size="sm"
            style={{ marginRight: theme.spacing[1] }}
          />
          <Spacer size={0} horizontal />
        </>
      )}
      <View style={{ alignItems: isSent ? 'flex-end' : 'flex-start' }}>
        {!isSent && senderName && (
          <Text variant="caption" color="secondary" style={{ marginBottom: theme.spacing[1] }}>
            {senderName}
          </Text>
        )}
        <View style={bubbleStyle}>
          {variant === 'status' ? (
            <Text variant="bodySmall" color="secondary">
              {statusIcon} {message.content}
            </Text>
          ) : variant === 'code' ? (
            <Text style={{ color: '#F7F7F7', fontFamily: 'Courier', lineHeight: 20 }}>
              {message.content}
            </Text>
          ) : (
            message.content && (
              <Text
                variant="body"
                color={isSent ? 'inverse' : 'primary'}
                style={{ lineHeight: 20 }}
              >
                {message.content}
              </Text>
            )
          )}
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
          <Spacer size={0} horizontal />
          <Avatar
            uri={senderAvatar || undefined}
            name={senderName}
            size="sm"
            style={{ marginLeft: theme.spacing[1] }}
          />
        </>
      )}
    </View>
  );
};

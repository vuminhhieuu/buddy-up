/**
 * MessageBubble Component
 * Displays a single chat message with different styling for sent/received messages
 */

import React, { useMemo } from 'react';
import { View, ViewStyle, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Spacer } from '../../ui/Spacer/Spacer';
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

  const maxBubbleWidth = useMemo(() => {
    const horizontalPadding = theme.spacing[6]; // tighter spacing to keep avatar + bubble gọn
    const cappedWidth = Math.max(windowWidth - horizontalPadding, 0);
    return Math.min(windowWidth * 0.6, cappedWidth);
  }, [theme.spacing, windowWidth]);

  const bubbleBackground =
    variant === 'code'
      ? theme.colors.code.background
      : variant === 'status'
        ? theme.colors.surface
        : isSent
          ? isSelected
            ? theme.colors.primary[400]
            : theme.colors.primary[500]
          : isSelected
            ? theme.colors.neutral[100]
            : theme.colors.surface;

  const bubbleStyle: ViewStyle = {
    maxWidth: maxBubbleWidth,
    paddingHorizontal: variant === 'code' ? theme.spacing[5] : theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: 24,
    borderTopRightRadius: isSent ? 12 : 24,
    borderTopLeftRadius: isSent ? 24 : 12,
    backgroundColor: bubbleBackground,
    borderWidth: variant === 'code' ? 1 : variant === 'status' || isSent ? 0 : 1,
    borderColor: variant === 'code' ? theme.colors.code.border : theme.colors.border,
    shadowColor: theme.shadows.md.shadowColor,
    shadowOpacity: variant === 'status' ? 0 : theme.shadows.md.shadowOpacity,
    shadowRadius: theme.shadows.md.shadowRadius,
    shadowOffset: theme.shadows.md.shadowOffset,
    elevation: variant === 'status' ? 0 : theme.shadows.md.elevation,
  };

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
          <>
            <Text variant="caption" color="secondary" style={{ marginBottom: theme.spacing[1] }}>
              {senderName}
            </Text>
          </>
        )}
        <View style={bubbleStyle}>
          {variant === 'status' ? (
            <Text variant="bodySmall" color="secondary">
              {statusIcon} {message.content}
            </Text>
          ) : variant === 'code' ? (
            <Text
              style={{
                color: theme.colors.code.text,
                fontFamily: theme.typography.code.fontFamily,
                fontSize: theme.typography.code.fontSize,
                lineHeight: theme.typography.code.lineHeight,
              }}
            >
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
          {variant === 'text' && message.attachments && message.attachments.length > 0 ? (
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

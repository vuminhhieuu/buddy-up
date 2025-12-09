/**
 * Chat Notification Handler
 * Handles chat-related notifications
 */

import { logger } from '../../../utils/logger';
import type { NotificationData, NotificationType } from '../../../types/notifications';
import { sendNotification } from '../sendNotification';

export interface ChatNotificationParams {
  chatId: string;
  senderId: string;
  senderName: string;
  messageContent: string;
  recipientIds: string[];
  title?: string; // Optional: if not provided, will use default
}

/**
 * Prepare chat notification data
 */
export function prepareChatNotification(params: ChatNotificationParams): {
  title: string;
  body: string;
  data: NotificationData;
} {
  // Truncate message preview
  const preview =
    params.messageContent.length > 100
      ? params.messageContent.substring(0, 97) + '...'
      : params.messageContent;

  return {
    title: params.title || 'Tin nhắn mới',
    body: `${params.senderName}: ${preview}`,
    data: {
      type: 'chat_message' as NotificationType,
      chatId: params.chatId,
      senderId: params.senderId,
      senderName: params.senderName,
    },
  };
}

/**
 * Send chat notification
 */
export async function sendChatNotification(
  params: ChatNotificationParams,
): Promise<{ success: boolean; error?: string; sent?: number }> {
  try {
    const notification = prepareChatNotification(params);

    const result = await sendNotification({
      type: 'chat_message',
      userIds: params.recipientIds,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: 'default',
    });

    return result;
  } catch (error) {
    logger.error('sendChatNotification', 'Failed to send chat notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

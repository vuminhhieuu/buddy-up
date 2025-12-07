/**
 * Send Notification Service
 * Calls Edge Function to send notifications
 * Note: In production, this should be called from backend/trigger
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import type { NotificationData, NotificationType } from '../../types/notifications';

interface SendNotificationParams {
  type: NotificationType;
  userIds: string[];
  title: string;
  body: string;
  data: NotificationData;
  sound?: string;
}

/**
 * Send notification via Edge Function
 * This is a helper function - in production, notifications should be sent
 * automatically from backend triggers
 */
export async function sendNotification(
  params: SendNotificationParams,
): Promise<{ success: boolean; error?: string; sent?: number }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: params,
    });

    if (error) {
      logger.error('sendNotification', 'Failed to send notification:', error);
      return { success: false, error: `Failed to send notification: ${error.message}` };
    }

    logger.debug('sendNotification', 'Notification sent:', data);
    return {
      success: true,
      sent: data?.sent || 0,
    };
  } catch (error) {
    logger.error('sendNotification', 'Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

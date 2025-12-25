/**
 * Notification Types
 * Type definitions for push notifications
 */

export enum NotificationType {
  CHAT_MESSAGE = 'chat_message',
  BUDDY_REQUEST = 'buddy_request',
  BUDDY_ACCEPTED = 'buddy_accepted',
  BUDDY_REJECTED = 'buddy_rejected',
  SESSION_REMINDER = 'session_reminder',
  SESSION_INVITATION = 'session_invitation',
  SESSION_CANCELLED = 'session_cancelled',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
}

export interface NotificationData {
  type: NotificationType;
  // Chat
  chatId?: string;
  senderId?: string;
  senderName?: string;
  // Buddy
  connectionId?: string;
  buddyId?: string;
  buddyName?: string;
  // Session
  sessionId?: string;
  sessionTitle?: string;
  // Achievement
  achievementId?: string;
  // Navigation
  screen?: string;
  params?: Record<string, any>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data: NotificationData;
  sound?: string;
  badge?: number;
}

export interface NotificationPreferences {
  chat_enabled: boolean;
  buddy_enabled: boolean;
  session_enabled: boolean;
  achievement_enabled: boolean;
  sound_enabled: boolean;
}

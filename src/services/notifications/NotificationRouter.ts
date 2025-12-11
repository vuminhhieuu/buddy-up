/**
 * Notification Router
 * Routes notifications to appropriate screens
 */

import type { NavigationContainerRef } from '@react-navigation/native';
import { logger } from '../../utils/logger';
import type { NotificationData, NotificationType } from '../../types/notifications';

export class NotificationRouter {
  private navigationRef: NavigationContainerRef<any> | null = null;

  setNavigationRef(ref: NavigationContainerRef<any> | null) {
    this.navigationRef = ref;
  }

  /**
   * Route notification to appropriate screen
   */
  routeNotification(data: NotificationData): void {
    if (!this.navigationRef) {
      logger.warn('NotificationRouter', 'Navigation ref not set');
      return;
    }

    try {
      switch (data.type) {
        case 'chat_message':
          this.routeToChat(data);
          break;
        case 'buddy_request':
        case 'buddy_accepted':
        case 'buddy_rejected':
          this.routeToBuddy(data);
          break;
        case 'session_reminder':
        case 'session_invitation':
        case 'session_cancelled':
          this.routeToSession(data);
          break;
        case 'achievement_unlocked':
          this.routeToAchievement(data);
          break;
        default:
          logger.warn('NotificationRouter', `Unknown notification type: ${data.type}`);
      }
    } catch (error) {
      logger.error('NotificationRouter', 'Failed to route notification:', error);
    }
  }

  private routeToChat(data: NotificationData): void {
    if (!data.chatId) {
      logger.warn('NotificationRouter', 'Chat ID missing');
      return;
    }

    // Navigate to ChatRoom
    this.navigationRef?.navigate('MainTabs', {
      screen: 'Chat',
      params: {
        screen: 'ChatRoom',
        params: {
          chatId: data.chatId,
          type: 'direct' as const,
          participant: data.senderName
            ? {
                name: data.senderName,
                avatar: undefined,
              }
            : undefined,
        },
      },
    });
  }

  private routeToBuddy(data: NotificationData): void {
    // Navigate to Buddy Requests screen
    this.navigationRef?.navigate('MainTabs', {
      screen: 'Buddy',
    });
    // Note: BuddyRequests is a nested screen, navigation will handle it
  }

  private routeToSession(data: NotificationData): void {
    // Support both sessionId and session_id for backward compatibility
    const sessionId = data.sessionId || (data as any).session_id;

    logger.debug('NotificationRouter', 'Routing to session with data:', {
      type: data.type,
      sessionId: data.sessionId,
      session_id: (data as any).session_id,
      hasSessionId: !!sessionId,
    });

    if (sessionId) {
      logger.debug('NotificationRouter', `Navigating to SessionDetail with ID: ${sessionId}`);

      // Use setTimeout to ensure navigation happens after any pending state updates
      setTimeout(() => {
        this.navigationRef?.navigate('SessionDetail', {
          sessionId: sessionId,
          fromNotification: true,
        });
      }, 100);
    } else {
      logger.warn(
        'NotificationRouter',
        'Session ID missing in notification data. Data:',
        JSON.stringify(data),
      );

      // Fallback: Navigate to Home screen
      setTimeout(() => {
        this.navigationRef?.navigate('MainTabs', {
          screen: 'Home',
        });
      }, 100);
    }
  }

  private routeToAchievement(data: NotificationData): void {
    this.navigationRef?.navigate('MainTabs', {
      screen: 'Profile',
      params: {
        screen: 'ProfileAchievements',
      },
    });
  }
}

export const notificationRouter = new NotificationRouter();

/**
 * useNotifications Hook
 * Main hook for managing notifications
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { notificationService } from '../services/notifications';
import { notificationRouter } from '../services/notifications/NotificationRouter';
import { logger } from '../utils/logger';
import type { NotificationData } from '../types/notifications';
import * as Notifications from 'expo-notifications';

export const useNotifications = () => {
  const userId = useAppSelector((state) => state.auth.userId);
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Initialize notification service when user is logged in
    if (userId) {
      notificationService
        .initialize(userId)
        .then((result) => {
          if (result.success) {
            logger.debug('useNotifications', 'Notification service initialized');
          } else {
            logger.warn('useNotifications', 'Failed to initialize notifications:', result.error);
          }
        })
        .catch((error) => {
          logger.error('useNotifications', 'Failed to initialize notifications:', error);
        });
    }

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
    });

    // Listen to notification received (foreground)
    const receivedSubscription = notificationService.addNotificationReceivedListener(
      (notification) => {
        handleForegroundNotification(notification);
      },
    );

    // Listen to notification response (user tapped)
    const responseSubscription = notificationService.addNotificationResponseListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      subscription.remove();
      receivedSubscription();
      responseSubscription();

      // Cleanup notification service on unmount or logout
      if (userId) {
        notificationService.cleanup(userId).catch((error) => {
          logger.error('useNotifications', 'Failed to cleanup notifications:', error);
        });
      }
    };
  }, [userId]);

  const handleForegroundNotification = (notification: Notifications.Notification) => {
    const data = notification.request.content.data as NotificationData;

    // Don't show notification if user is viewing that chat
    if (data.type === 'chat_message' && data.chatId === activeChatId) {
      logger.debug('useNotifications', 'User is viewing this chat, skipping notification');
      return;
    }

    // Notification will be shown automatically by handler
    logger.debug('useNotifications', 'Foreground notification received:', data.type);
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;
    logger.debug('useNotifications', 'Notification tapped:', data.type);
    notificationRouter.routeNotification(data);
  };
};

/**
 * useNotifications Hook
 * Main hook for managing notifications
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { notificationService } from '../services/notifications';
import { notificationRouter } from '../services/notifications/NotificationRouter';
import { logger } from '../utils/logger';
import type { NotificationData } from '../types/notifications';
import * as Notifications from 'expo-notifications';
import { incrementUnreadCount, fetchConversationsAsync } from '../store/slices/chatSlice';
import { supabase } from '../config/supabase';

export const useNotifications = () => {
  const userId = useAppSelector((state) => state.auth.userId);
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const dispatch = useAppDispatch();
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId || null;
  }, [activeChatId]);

  const markNotificationAsRead = useCallback(
    async (data: Partial<NotificationData>) => {
      if (!userId) return;

      try {
        // Find and mark the notification as read based on type and related IDs
        const sessionId = data.sessionId || (data as any).session_id;

        if (!sessionId && !data.chatId && !data.buddyId) {
          logger.warn('useNotifications', 'No identifier found to mark notification as read');
          return;
        }

        let query = supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('type', data.type!)
          .eq('read', false);

        // Add specific filters based on notification type
        if (
          data.type === 'session_reminder' ||
          data.type === 'session_invitation' ||
          data.type === 'session_cancelled'
        ) {
          if (sessionId) {
            // Query JSONB field
            query = query.or(
              `data->>'sessionId'.eq.${sessionId},data->>'session_id'.eq.${sessionId}`,
            );
          }
        } else if (data.type === 'chat_message' && data.chatId) {
          query = query.eq('data->>chatId', data.chatId);
        } else if (data.type?.startsWith('buddy_') && data.buddyId) {
          query = query.eq('data->>buddyId', data.buddyId);
        }

        const { error } = await query;

        if (error) {
          logger.error('useNotifications', 'Error marking notification as read:', error);
        } else {
          logger.debug('useNotifications', 'Notification marked as read');
        }
      } catch (error) {
        logger.error('useNotifications', 'Failed to mark notification as read:', error);
      }
    },
    [userId],
  );

  const handleForegroundNotification = useCallback(
    (notification: Notifications.Notification) => {
      const data = notification.request.content.data as Partial<NotificationData>;

      // Suppress if user is viewing that chat (foreground)
      if (
        data.type === 'chat_message' &&
        data.chatId &&
        notificationService.shouldSuppressNotification(data as NotificationData)
      ) {
        logger.debug('useNotifications', 'User is viewing this chat, suppress foreground alert');
      }

      // Nếu là chat_message và không suppress, cập nhật unread ngay khi đang foreground và không ở chat đó
      if (data.type === 'chat_message' && data.chatId && activeChatIdRef.current !== data.chatId) {
        dispatch(incrementUnreadCount(data.chatId));
        dispatch(fetchConversationsAsync()).catch(() => null);
      }

      // Notification will be shown automatically by handler
      logger.debug('useNotifications', 'Foreground notification received:', data.type);
    },
    [dispatch],
  );

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as Partial<NotificationData>;
      logger.debug('useNotifications', 'Notification tapped:', data.type);
      logger.debug('useNotifications', 'Notification data:', JSON.stringify(data));

      // Mark notification as read in database when tapped from system notification
      if (userId && data.type) {
        markNotificationAsRead(data).catch((error) => {
          logger.error('useNotifications', 'Failed to mark notification as read:', error);
        });
      }

      // Route to appropriate screen
      if (data.type) {
        notificationRouter.routeNotification(data as NotificationData);
      } else {
        logger.warn('useNotifications', 'No notification type found, cannot route');
      }
    },
    [userId, markNotificationAsRead],
  );

  useEffect(() => {
    // Provide active chat resolver for suppression logic
    notificationService.setActiveChatResolver(() => activeChatIdRef.current);

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
      notificationService.setActiveChatResolver(null);

      // Cleanup notification service on unmount or logout
      if (userId) {
        notificationService.cleanup(userId).catch((error) => {
          logger.error('useNotifications', 'Failed to cleanup notifications:', error);
        });
      }
    };
  }, [userId, handleForegroundNotification, handleNotificationResponse]);
};

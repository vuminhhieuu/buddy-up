/**
 * Notification Service
 * Core service for managing push notifications
 */

import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Application from 'expo-application';
import { logger } from '../../utils/logger';
import { requestNotificationPermissions } from './permissions';
import { getExpoPushToken, registerPushToken, unregisterPushToken } from './pushTokens';

type ActiveChatResolver = () => string | null | undefined;

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const service = NotificationService.getInstance();
    const data = notification.request?.content?.data as { chatId?: string; type?: string };
    const suppress = data?.type === 'chat_message' && service.shouldSuppressNotification(data);
    logger.debug('NotificationHandler', `suppress=${suppress} chatId=${data?.chatId ?? 'none'}`);

    return {
      shouldShowAlert: !suppress,
      shouldPlaySound: !suppress,
      shouldSetBadge: true,
    } as Notifications.NotificationBehavior;
  },
});

export class NotificationService {
  private static instance: NotificationService;
  private listeners: Array<() => void> = [];
  private currentUserId: string | null = null;
  private currentToken: string | null = null;
  private activeChatResolver: ActiveChatResolver | null = null;

  private constructor() {
    this.setupNotificationChannels();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Setup Android notification channels
   */
  private async setupNotificationChannels() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }
  }

  /**
   * Initialize notification service
   */
  async initialize(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.currentUserId = userId;

      // Request permissions
      const permissionStatus = await requestNotificationPermissions();
      if (!permissionStatus.granted) {
        logger.warn('NotificationService', 'Notification permissions not granted');
        return {
          success: false,
          error: 'Notification permissions not granted',
        };
      }

      // Get and register push token
      const tokenResult = await getExpoPushToken();
      if (!tokenResult.success || !tokenResult.token) {
        // Log warning but don't fail initialization if Firebase is not setup
        // This allows app to continue working, notifications just won't work until Firebase is configured
        if (tokenResult.error?.includes('Firebase')) {
          logger.warn(
            'NotificationService',
            'Push token registration failed due to Firebase setup. Notifications will not work until Firebase is configured.',
          );
          return {
            success: false,
            error: tokenResult.error || 'Firebase not configured',
          };
        }
        return {
          success: false,
          error: tokenResult.error || 'Failed to get push token',
        };
      }

      this.currentToken = tokenResult.token;

      // Get device ID (prefer Android ID / installation ID)
      let deviceId: string | undefined;
      try {
        if (Platform.OS === 'android') {
          const maybeAndroidId =
            (Application as any).androidId ||
            (typeof (Application as any).getAndroidId === 'function'
              ? (Application as any).getAndroidId()
              : undefined);
          deviceId = (maybeAndroidId as string | undefined) || undefined;
        } else if (Platform.OS === 'ios' && (Application as any).getIosIdForVendorAsync) {
          deviceId =
            ((await (Application as any).getIosIdForVendorAsync()) as string | undefined) ||
            undefined;
        }
      } catch (e) {
        logger.warn('NotificationService', 'Failed to get deviceId', e);
      }

      // Register token in database (supports multi-device)
      const registerResult = await registerPushToken(userId, tokenResult.token, deviceId);
      if (!registerResult.success) {
        return {
          success: false,
          error: registerResult.error || 'Failed to register push token',
        };
      }

      logger.debug('NotificationService', 'Notification service initialized');
      return { success: true };
    } catch (error) {
      logger.error('NotificationService', 'Failed to initialize:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cleanup on logout
   */
  async cleanup(userId: string): Promise<void> {
    try {
      if (this.currentToken) {
        await unregisterPushToken(userId, this.currentToken);
      }
      this.removeAllListeners();
      this.currentUserId = null;
      this.currentToken = null;
    } catch (error) {
      logger.error('NotificationService', 'Failed to cleanup:', error);
    }
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    handler: (notification: Notifications.Notification) => void,
  ): () => void {
    const subscription = Notifications.addNotificationReceivedListener(handler);
    this.listeners.push(() => subscription.remove());
    return () => subscription.remove();
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void,
  ): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(handler);
    this.listeners.push(() => subscription.remove());
    return () => subscription.remove();
  }

  /**
   * Remove all listeners
   */
  private removeAllListeners(): void {
    this.listeners.forEach((remove) => remove());
    this.listeners = [];
  }

  /**
   * Get current app state
   */
  getAppState(): AppStateStatus {
    return AppState.currentState;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get current push token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Set resolver to get current active chat id (from UI)
   */
  setActiveChatResolver(resolver: ActiveChatResolver | null) {
    this.activeChatResolver = resolver;
  }

  /**
   * Check if notification should be suppressed (e.g., user is viewing the chat)
   */
  shouldSuppressNotification(data: { chatId?: string }): boolean {
    try {
      if (!data?.chatId) return false;
      const activeChatId = this.activeChatResolver ? this.activeChatResolver() : null;
      const isForeground = AppState.currentState === 'active';
      return isForeground && activeChatId === data.chatId;
    } catch (error) {
      logger.warn('NotificationService', 'Failed to check suppression', error);
      return false;
    }
  }
}

export const notificationService = NotificationService.getInstance();

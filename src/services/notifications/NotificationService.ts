/**
 * Notification Service
 * Core service for managing push notifications
 */

import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { logger } from '../../utils/logger';
import { requestNotificationPermissions } from './permissions';
import { getExpoPushToken, registerPushToken, unregisterPushToken } from './pushTokens';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private listeners: Array<() => void> = [];
  private currentUserId: string | null = null;
  private currentToken: string | null = null;

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
        return {
          success: false,
          error: tokenResult.error || 'Failed to get push token',
        };
      }

      this.currentToken = tokenResult.token;

      // Register token in database
      const registerResult = await registerPushToken(userId, tokenResult.token);
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
}

export const notificationService = NotificationService.getInstance();

/**
 * Notification Permissions Service
 * Handles notification permission requests
 */

import * as Notifications from 'expo-notifications';
import { logger } from '../../utils/logger';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: false,
      },
    });

    const granted = status === 'granted';

    logger.debug('requestNotificationPermissions', `Permission status: ${status}`);

    return {
      granted,
      canAskAgain,
      status,
    };
  } catch (error) {
    logger.error('requestNotificationPermissions', 'Failed to request permissions:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'undetermined',
    };
  }
}

/**
 * Get current permission status
 */
export async function getNotificationPermissions(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();

    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  } catch (error) {
    logger.error('getNotificationPermissions', 'Failed to get permissions:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'undetermined',
    };
  }
}

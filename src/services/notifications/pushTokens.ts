/**
 * Push Tokens Service
 * Manages push token registration and storage
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export interface PushTokenResponse {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Get Expo push token
 */
export async function getExpoPushToken(): Promise<PushTokenResponse> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      logger.error('getExpoPushToken', 'EAS project ID not found');
      return {
        success: false,
        error: 'EAS project ID not configured',
      };
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return {
      success: true,
      token: tokenData.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a Firebase initialization error
    if (errorMessage.includes('FirebaseApp') || errorMessage.includes('FCM')) {
      logger.warn(
        'getExpoPushToken',
        'Firebase not initialized. Push notifications may not work on Android. See: https://docs.expo.dev/push-notifications/fcm-credentials/',
      );
      return {
        success: false,
        error:
          'Firebase not initialized. Please setup Firebase credentials for Android push notifications.',
      };
    }

    logger.error('getExpoPushToken', 'Failed to get push token:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Register push token in database
 */
export async function registerPushToken(
  userId: string,
  token: string,
  deviceId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure we have an authenticated session; otherwise RLS will reject the insert
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      logger.warn('registerPushToken', 'No active session, skip registering push token');
      return { success: false, error: 'Not authenticated' };
    }

    if (session.user.id !== userId) {
      logger.warn(
        'registerPushToken',
        `Session user mismatch (session=${session.user.id}, arg=${userId}), skip registering push token`,
      );
      return { success: false, error: 'Session user mismatch' };
    }

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    // 1) Nếu có deviceId: upsert theo (user_id, device_id)
    if (deviceId) {
      const { data: existingByDevice } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .maybeSingle();

      if (existingByDevice) {
        const { error: updateError } = await supabase
          .from('push_tokens')
          .update({
            token,
            platform,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingByDevice.id);

        if (updateError) {
          logger.error('registerPushToken', 'Failed to update token by device:', updateError);
          return { success: false, error: `Failed to update token: ${updateError.message}` };
        }

        return { success: true };
      }
    }

    // 2) Nếu token đã tồn tại: update chủ sở hữu/platform/device
    const { data: existingByToken } = await supabase
      .from('push_tokens')
      .select('id')
      .eq('token', token)
      .maybeSingle();

    if (existingByToken) {
      const { error: updateError } = await supabase
        .from('push_tokens')
        .update({
          user_id: userId,
          platform,
          device_id: deviceId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingByToken.id);

      if (updateError) {
        logger.error('registerPushToken', 'Failed to update token:', updateError);
        return { success: false, error: `Failed to update token: ${updateError.message}` };
      }
      return { success: true };
    }

    // 3) Insert mới (giữ nguyên token của các device khác)
    const { error: insertError } = await supabase.from('push_tokens').insert({
      user_id: userId,
      token,
      platform,
      device_id: deviceId,
    });

    if (insertError) {
      logger.error('registerPushToken', 'Failed to register token:', insertError);
      return { success: false, error: `Failed to register token: ${insertError.message}` };
    }

    return { success: true };
  } catch (error) {
    logger.error('registerPushToken', 'Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unregister push token (on logout)
 */
export async function unregisterPushToken(
  userId: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) {
      logger.error('unregisterPushToken', 'Failed to unregister token:', error);
      return { success: false, error: `Failed to unregister token: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    logger.error('unregisterPushToken', 'Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

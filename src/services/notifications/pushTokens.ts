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
    logger.error('getExpoPushToken', 'Failed to get push token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    // Check if token already exists
    const { data: existing } = await supabase
      .from('push_tokens')
      .select('id')
      .eq('token', token)
      .maybeSingle();

    if (existing) {
      // Update existing token
      const { error: updateError } = await supabase
        .from('push_tokens')
        .update({
          user_id: userId,
          platform,
          device_id: deviceId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        logger.error('registerPushToken', 'Failed to update token:', updateError);
        return { success: false, error: `Failed to update token: ${updateError.message}` };
      }

      return { success: true };
    }

    // Insert new token
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

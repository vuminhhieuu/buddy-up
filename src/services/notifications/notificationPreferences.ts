/**
 * Notification Preferences Service
 * Manages user notification preferences
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import type { NotificationPreferences } from '../../types/notifications';

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(
  userId: string,
): Promise<{ success: boolean; preferences?: NotificationPreferences; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('getNotificationPreferences', 'Failed to fetch preferences:', error);
      return { success: false, error: `Failed to fetch preferences: ${error.message}` };
    }

    // If no preferences exist, create default
    if (!data) {
      return await createDefaultPreferences(userId);
    }

    return {
      success: true,
      preferences: {
        chat_enabled: data.chat_enabled,
        buddy_enabled: data.buddy_enabled,
        session_enabled: data.session_enabled,
        achievement_enabled: data.achievement_enabled,
        sound_enabled: data.sound_enabled,
      },
    };
  } catch (error) {
    logger.error('getNotificationPreferences', 'Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create default notification preferences
 */
async function createDefaultPreferences(
  userId: string,
): Promise<{ success: boolean; preferences?: NotificationPreferences; error?: string }> {
  try {
    const defaultPreferences: NotificationPreferences = {
      chat_enabled: true,
      buddy_enabled: true,
      session_enabled: true,
      achievement_enabled: true,
      sound_enabled: true,
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        ...defaultPreferences,
      })
      .select()
      .single();

    if (error) {
      logger.error('createDefaultPreferences', 'Failed to create preferences:', error);
      return { success: false, error: `Failed to create preferences: ${error.message}` };
    }

    return {
      success: true,
      preferences: defaultPreferences,
    };
  } catch (error) {
    logger.error('createDefaultPreferences', 'Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('notification_preferences').upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('updateNotificationPreferences', 'Failed to update preferences:', error);
      return { success: false, error: `Failed to update preferences: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    logger.error('updateNotificationPreferences', 'Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

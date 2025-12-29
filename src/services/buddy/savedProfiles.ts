/**
 * Saved Profiles Service
 * Functions for saving/unsaving buddy profiles
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { formatErrorMessage } from '../helpers';

export interface SavedProfile {
  id: string;
  user_id: string;
  saved_user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Save a profile
 * @param userId - Current user ID
 * @param savedUserId - Profile ID to save
 * @returns Saved profile record or null if error
 */
export async function saveProfile(
  userId: string,
  savedUserId: string,
): Promise<SavedProfile | null> {
  try {
    if (!userId || !savedUserId) {
      throw new Error('User ID and saved user ID are required');
    }

    if (userId === savedUserId) {
      throw new Error('Cannot save your own profile');
    }

    const { data, error } = await supabase
      .from('saved_profiles')
      .insert({
        user_id: userId,
        saved_user_id: savedUserId,
      })
      .select()
      .single();

    if (error) {
      // If duplicate, it means already saved - return success
      if (error.code === '23505') {
        logger.debug('savedProfiles', 'Profile already saved', { userId, savedUserId });
        // Fetch existing record
        const { data: existing } = await supabase
          .from('saved_profiles')
          .select()
          .eq('user_id', userId)
          .eq('saved_user_id', savedUserId)
          .is('deleted_at', null)
          .single();
        return existing as SavedProfile | null;
      }
      throw error;
    }

    logger.debug('savedProfiles', 'Profile saved successfully', { userId, savedUserId });
    return data as SavedProfile;
  } catch (error) {
    logger.error('savedProfiles', 'Failed to save profile', error);
    throw new Error(formatErrorMessage(error) || 'Failed to save profile');
  }
}

/**
 * Unsave a profile (soft delete)
 * @param userId - Current user ID
 * @param savedUserId - Profile ID to unsave
 * @returns true if successful
 */
export async function unsaveProfile(userId: string, savedUserId: string): Promise<boolean> {
  try {
    if (!userId || !savedUserId) {
      throw new Error('User ID and saved user ID are required');
    }

    const { error } = await supabase
      .from('saved_profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('saved_user_id', savedUserId)
      .is('deleted_at', null);

    if (error) {
      throw error;
    }

    logger.debug('savedProfiles', 'Profile unsaved successfully', { userId, savedUserId });
    return true;
  } catch (error) {
    logger.error('savedProfiles', 'Failed to unsave profile', error);
    throw new Error(formatErrorMessage(error) || 'Failed to unsave profile');
  }
}

/**
 * Check if a profile is saved
 * @param userId - Current user ID
 * @param savedUserId - Profile ID to check
 * @returns true if saved, false otherwise
 */
export async function isProfileSaved(userId: string, savedUserId: string): Promise<boolean> {
  try {
    if (!userId || !savedUserId) {
      return false;
    }

    const { data, error } = await supabase
      .from('saved_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('saved_user_id', savedUserId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      logger.error('savedProfiles', 'Failed to check if profile is saved', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    logger.error('savedProfiles', 'Error checking saved status', error);
    return false;
  }
}

/**
 * Fetch all saved profile IDs for a user
 * @param userId - Current user ID
 * @returns Array of saved user IDs
 */
export async function fetchSavedProfileIds(userId: string): Promise<string[]> {
  try {
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('saved_profiles')
      .select('saved_user_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((row) => row.saved_user_id);
  } catch (error) {
    logger.error('savedProfiles', 'Failed to fetch saved profile IDs', error);
    throw new Error(formatErrorMessage(error) || 'Failed to fetch saved profiles');
  }
}

/**
 * Fetch saved profiles with full profile data
 * @param userId - Current user ID
 * @returns Array of saved profiles
 */
export async function fetchSavedProfiles(userId: string) {
  try {
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('saved_profiles')
      .select(
        `
        saved_user_id,
        created_at,
        profiles: saved_user_id (
          user_id,
          display_name,
          avatar_url,
          bio,
          learning_goals,
          available_times,
          learning_style,
          age,
          level,
          location,
          main_learning_goal,
          learning_interests,
          interests,
          is_online,
          is_verified,
          created_at,
          updated_at
        )
      `,
      )
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('savedProfiles', 'Failed to fetch saved profiles', error);
    throw new Error(formatErrorMessage(error) || 'Failed to fetch saved profiles');
  }
}

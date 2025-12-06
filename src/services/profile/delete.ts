/**
 * Profile Delete Service
 * Functions for deleting user account
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    // First, attempt to delete the auth user via Edge Function (server-side service role)
    // This prevents orphaned auth records if app data deletion fails
    const { data: funcRes, error: funcErr } = await supabase.functions.invoke('delete-user', {
      method: 'POST',
      body: {},
    });

    if (funcErr) {
      logger.error('deleteUserAccount', 'Edge Function delete-user failed:', funcErr);
      throw new Error('Failed to delete auth user');
    }

    logger.info('deleteUserAccount', 'Edge Function delete-user response:', funcRes);

    // Delete all user-related data from application tables
    // Use Promise.allSettled to attempt all deletions even if one fails
    const deletions = await Promise.allSettled([
      supabase.from('profiles').delete().eq('user_id', userId),
      supabase.from('user_progress').delete().eq('user_id', userId),
      supabase.from('user_badges').delete().eq('user_id', userId),
    ]);

    // Log results of each deletion
    const [profileResult, progressResult, badgesResult] = deletions;

    if (profileResult.status === 'rejected') {
      logger.error('deleteUserAccount', 'Failed to delete profile:', profileResult.reason);
    } else if (profileResult.value.error) {
      logger.error('deleteUserAccount', 'Failed to delete profile:', profileResult.value.error);
    }

    if (progressResult.status === 'rejected') {
      logger.warn('deleteUserAccount', 'Failed to delete progress:', progressResult.reason);
    } else if (progressResult.value.error) {
      logger.warn('deleteUserAccount', 'Failed to delete progress:', progressResult.value.error);
    }

    if (badgesResult.status === 'rejected') {
      logger.warn('deleteUserAccount', 'Failed to delete badges:', badgesResult.reason);
    } else if (badgesResult.value.error) {
      logger.warn('deleteUserAccount', 'Failed to delete badges:', badgesResult.value.error);
    }

    // Sign the user out after successful deletion
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      logger.warn('deleteUserAccount', 'Sign out failed after deletion:', signOutError);
    }

    logger.info('deleteUserAccount', 'Successfully deleted user data and signed out:', userId);
  } catch (error) {
    logger.error('deleteUserAccount', 'Error deleting account:', error);
    throw error;
  }
}

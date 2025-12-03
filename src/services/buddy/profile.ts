/**
 * Buddy Profile
 * Functions for fetching buddy profile data
 */

import { supabase } from '../../config/supabase';
import type { BuddyProfile } from '../../types/buddy';
import type { UserProgress } from '../../utils/matchCalculation';
import { logger } from '../../utils/logger';
import { isPgrst116Error } from '../helpers';
import { normalizeProfile, type SupabaseProfileRow } from './normalize';

/**
 * Fetch a buddy profile by user ID
 */
export async function fetchBuddyProfile(userId: string): Promise<BuddyProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      logger.error('fetchBuddyProfile', 'Error fetching buddy profile:', error);
      return null;
    }

    const row = data as SupabaseProfileRow;
    return normalizeProfile(row);
  } catch (error) {
    logger.error('fetchBuddyProfile', 'Error in fetchBuddyProfile:', error);
    return null;
  }
}

/**
 * Fetch user progress (streak) for match calculation
 */
export async function fetchUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('streak')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && !isPgrst116Error(error)) {
      logger.error('fetchUserProgress', 'Error fetching user progress:', error);
      return null;
    }

    const streakValue = data?.streak ?? 0;
    return { streak: streakValue };
  } catch (error) {
    logger.error('fetchUserProgress', 'Error in fetchUserProgress:', error);
    return null;
  }
}

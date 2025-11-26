/**
 * Buddy Profile
 * Functions for fetching buddy profile data
 */

import { supabase } from '../../config/supabase';
import type { BuddyProfile } from '../../types/buddy';
import type { UserProgress } from '../../utils/matchCalculation';
import { logger } from '../../utils/logger';
import { isPgrst116Error } from '../helpers';

/**
 * Supabase profile row type
 */
type SupabaseProfileRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  learning_goals: string[] | null;
  available_times: string[] | null;
  available_times_detail: string[] | null;
  learning_style: string | null;
  age: number | null;
  level: string | null;
  is_online: boolean | null;
  is_verified: boolean | null;
  location: string | null;
  main_learning_goal: string | null;
  learning_interests: string[] | null;
  created_at: string;
  updated_at: string;
};

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
    return {
      user_id: row.user_id,
      display_name: row.display_name,
      avatar_url: row.avatar_url ?? null,
      bio: row.bio ?? null,
      interests: row.interests ?? [],
      learning_goals: row.learning_goals ?? [],
      available_times: (row.available_times ?? []) as BuddyProfile['available_times'],
      available_times_detail: row.available_times_detail ?? [],
      learning_style: (row.learning_style as BuddyProfile['learning_style']) ?? null,
      age: row.age ?? null,
      level: (row.level as BuddyProfile['level']) ?? null,
      is_online: row.is_online ?? false,
      is_verified: row.is_verified ?? false,
      location: row.location ?? null,
      main_learning_goal: row.main_learning_goal ?? null,
      learning_interests: row.learning_interests ?? [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
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

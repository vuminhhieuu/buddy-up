/**
 * Profile Achievements
 * Functions for fetching user achievements/badges
 */

import { supabase } from '../../config/supabase';
import type { Achievement } from '../../types/profile';
import { logger } from '../../utils/logger';
import { FALLBACK_ACHIEVEMENTS, PROGRESS_MAX_PERCENTAGE } from '../../constants/profile';
import { mapBadgeToEmoji } from './utils';

/**
 * Fetch user achievements
 */
export async function fetchAchievements(userId: string): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_id,obtained_at,badges(name,description)')
      .eq('user_id', userId)
      .order('obtained_at', { ascending: false });

    if (error) throw error;
    if (!data) return FALLBACK_ACHIEVEMENTS;

    return data.map((row, index) => {
      const badge = Array.isArray(row.badges) ? row.badges[0] : row.badges;
      return {
        id: row.badge_id,
        name: badge?.name || row.badge_id,
        description: badge?.description || '',
        emoji: mapBadgeToEmoji(row.badge_id, index),
        progress: PROGRESS_MAX_PERCENTAGE,
        completed: true,
        completedAt: row.obtained_at ? new Date(row.obtained_at) : undefined,
      };
    });
  } catch (error) {
    logger.error('fetchAchievements', 'Failed:', error);
    return FALLBACK_ACHIEVEMENTS;
  }
}

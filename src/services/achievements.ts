/**
 * Achievements Service
 * Functions for checking and awarding achievements/badges
 */

import { supabase } from '../config/supabase';

/**
 * Response from checking/awarding achievement
 */
export interface AchievementResponse {
  success: boolean;
  awarded: boolean; // Whether badge was newly awarded (false if already had it)
  error?: string;
  errorCode?: 'NETWORK_ERROR' | 'BADGE_NOT_FOUND';
}

/**
 * Badge ID for first match achievement
 */
export const FIRST_MATCH_BADGE_ID = 'first_match';

/**
 * Check if user has their first accepted connection and award "First Match" badge
 * @param userId - User ID to check
 * @returns Response indicating if badge was awarded
 */
export async function checkAndAwardFirstMatch(userId: string): Promise<AchievementResponse> {
  try {
    // Check if user already has the badge
    const { data: existingBadge, error: checkError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .eq('badge_id', FIRST_MATCH_BADGE_ID)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing badge:', checkError);
      return {
        success: false,
        awarded: false,
        error: checkError.message || 'Failed to check existing badge',
        errorCode: 'NETWORK_ERROR',
      };
    }

    // If user already has the badge, return early
    if (existingBadge) {
      return {
        success: true,
        awarded: false,
      };
    }

    // Check if user has at least one accepted connection
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('id, status')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'accepted')
      .is('deleted_at', null)
      .limit(1);

    if (connectionsError) {
      console.error('Error checking connections:', connectionsError);
      return {
        success: false,
        awarded: false,
        error: connectionsError.message || 'Failed to check connections',
        errorCode: 'NETWORK_ERROR',
      };
    }

    // If user has no accepted connections, don't award badge
    if (!connections || connections.length === 0) {
      return {
        success: true,
        awarded: false,
      };
    }

    // Verify badge exists in badges table (create if it doesn't exist)
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('id')
      .eq('id', FIRST_MATCH_BADGE_ID)
      .maybeSingle();

    if (badgeError && badgeError.code !== 'PGRST116') {
      console.error('Error checking badge:', badgeError);
      return {
        success: false,
        awarded: false,
        error: badgeError.message || 'Failed to check badge',
        errorCode: 'NETWORK_ERROR',
      };
    }

    // Create badge if it doesn't exist
    if (!badge) {
      const { error: createBadgeError } = await supabase.from('badges').insert({
        id: FIRST_MATCH_BADGE_ID,
        name: 'First Match',
        description: 'Kết nối với bạn học đầu tiên',
        icon_url: null,
      });

      if (createBadgeError) {
        console.error('Error creating badge:', createBadgeError);
        // Continue anyway - badge might have been created by another request
      }
    }

    // Award badge to user
    const { error: awardError } = await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: FIRST_MATCH_BADGE_ID,
      obtained_at: new Date().toISOString(),
    });

    if (awardError) {
      // Check if it's a duplicate (race condition)
      if (awardError.code === '23505') {
        // Unique constraint violation - badge was already awarded
        return {
          success: true,
          awarded: false,
        };
      }

      console.error('Error awarding badge:', awardError);
      return {
        success: false,
        awarded: false,
        error: awardError.message || 'Failed to award badge',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: true,
      awarded: true,
    };
  } catch (error) {
    console.error('Error in checkAndAwardFirstMatch:', error);
    return {
      success: false,
      awarded: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Achievements Service
 * Functions for checking and awarding achievements/badges
 */

import { supabase } from '../config/supabase';
import { POSTGRES_ERROR_CODES } from '../constants/errors';
import { logger } from '../utils/logger';
import {
  isPgrst116Error,
  isRlsError,
  formatErrorMessage,
  handleSupabaseError,
  handleUnknownError,
} from './helpers';

/**
 * Response from checking/awarding achievement
 */
export interface AchievementResponse {
  success: boolean;
  awarded: boolean; // Whether badge was newly awarded (false if already had it)
  error?: string;
  errorCode?: 'NETWORK_ERROR' | 'BADGE_NOT_FOUND' | 'PERMISSION_DENIED' | 'RLS_VIOLATION';
}

/**
 * Map ServiceErrorCode to AchievementResponse errorCode
 */
function mapToAchievementErrorCode(
  errorCode: import('./helpers').ServiceErrorCode,
): AchievementResponse['errorCode'] {
  if (errorCode === 'PERMISSION_DENIED' || errorCode === 'RLS_VIOLATION') {
    return 'PERMISSION_DENIED';
  }
  if (errorCode === 'BADGE_NOT_FOUND') {
    return 'BADGE_NOT_FOUND';
  }
  return 'NETWORK_ERROR';
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

    if (checkError && !isPgrst116Error(checkError)) {
      logger.error('checkAndAwardFirstMatch', 'Error checking existing badge:', checkError);
      const errorResponse = handleSupabaseError(checkError, 'Failed to check existing badge');
      return {
        success: false,
        awarded: false,
        error: errorResponse.error,
        errorCode: mapToAchievementErrorCode(errorResponse.errorCode),
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
      logger.error('checkAndAwardFirstMatch', 'Error checking connections:', connectionsError);
      const errorResponse = handleSupabaseError(connectionsError, 'Failed to check connections');
      return {
        success: false,
        awarded: false,
        error: errorResponse.error,
        errorCode: mapToAchievementErrorCode(errorResponse.errorCode),
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

    if (badgeError && !isPgrst116Error(badgeError)) {
      logger.error('checkAndAwardFirstMatch', 'Error checking badge:', badgeError);
      const errorResponse = handleSupabaseError(badgeError, 'Failed to check badge');
      return {
        success: false,
        awarded: false,
        error: errorResponse.error,
        errorCode: mapToAchievementErrorCode(errorResponse.errorCode),
      };
    }

    if (!badge) {
      logger.warn(
        'checkAndAwardFirstMatch',
        'Badge not seeded or not accessible. Skipping award attempt.',
      );
      return {
        success: false,
        awarded: false,
        error: 'Badge not available',
        errorCode: 'BADGE_NOT_FOUND',
      };
    }

    // Award badge to user
    const { error: awardError } = await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: FIRST_MATCH_BADGE_ID,
      obtained_at: new Date().toISOString(),
    });

    if (awardError) {
      // Check if it's a duplicate (race condition)
      if (awardError.code === POSTGRES_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION) {
        // Unique constraint violation - badge was already awarded
        return {
          success: true,
          awarded: false,
        };
      }

      logger.error('checkAndAwardFirstMatch', 'Error awarding badge:', awardError);
      if (isRlsError(awardError)) {
        return {
          success: false,
          awarded: false,
          error: 'Permission denied',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      const errorResponse = handleSupabaseError(awardError, 'Failed to award badge');
      return {
        success: false,
        awarded: false,
        error: errorResponse.error,
        errorCode: mapToAchievementErrorCode(errorResponse.errorCode),
      };
    }

    return {
      success: true,
      awarded: true,
    };
  } catch (error) {
    logger.error('checkAndAwardFirstMatch', 'Error in checkAndAwardFirstMatch:', error);
    const errorResponse = handleUnknownError(error, 'Failed to check and award achievement');
    return {
      success: false,
      awarded: false,
      error: errorResponse.error,
      errorCode: mapToAchievementErrorCode(errorResponse.errorCode),
    };
  }
}

/**
 * Buddy Search
 * Functions for searching and filtering buddy profiles
 */

import { supabase } from '../../config/supabase';
import type { BuddyFilters, BuddySearchResult, PaginationOptions } from '../../types/buddy';
import { DEFAULT_PAGE, DEFAULT_PAGE_LIMIT } from '../../constants/buddy';
import { logger } from '../../utils/logger';
import { getExcludedUserIds } from './connections';
import { normalizeProfile, type SupabaseProfileRow } from './normalize';

/**
 * Search buddies based on filters
 */
export async function searchBuddies(
  filters: BuddyFilters,
  currentUserId: string,
  options: PaginationOptions = { page: DEFAULT_PAGE, limit: DEFAULT_PAGE_LIMIT },
): Promise<BuddySearchResult> {
  try {
    const excludedIds = await getExcludedUserIds(currentUserId);

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .neq('user_id', currentUserId)
      .is('deleted_at', null);

    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      query = query.ilike('display_name', `%${filters.searchQuery.trim()}%`);
    }

    if (filters.learningGoals && filters.learningGoals.length > 0) {
      query = query.overlaps('learning_goals', filters.learningGoals);
    }

    if (filters.availableTimes && filters.availableTimes.length > 0) {
      query = query.overlaps('available_times', filters.availableTimes);
    }

    if (filters.learningStyle) {
      query = query.eq('learning_style', filters.learningStyle);
    }

    if (filters.level) {
      query = query.eq('level', filters.level);
    }

    if (filters.onlyOnline) {
      query = query.eq('is_online', true);
    }

    if (filters.onlyVerified) {
      query = query.eq('is_verified', true);
    }

    if (filters.hideRejected) {
      const { data: rejectedConnections } = await supabase
        .from('connections')
        .select('user_id_1, user_id_2')
        .eq('status', 'rejected')
        .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
        .is('deleted_at', null);

      if (rejectedConnections && rejectedConnections.length > 0) {
        const rejectedIds = rejectedConnections
          .map((conn) => (conn.user_id_1 === currentUserId ? conn.user_id_2 : conn.user_id_1))
          .filter((id) => id !== currentUserId);
        if (rejectedIds.length > 0) {
          rejectedIds.forEach((id) => {
            query = query.neq('user_id', id);
          });
        }
      }
    }

    if (filters.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (filters.sortBy === 'nearest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const page = options.page || DEFAULT_PAGE;
    const limit = options.limit || DEFAULT_PAGE_LIMIT;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const excludedSet = new Set(excludedIds);
    // Normalize profiles to ensure all fields have proper default values
    const profiles = (data || [])
      .map((row) => normalizeProfile(row as SupabaseProfileRow))
      .filter((profile) => !excludedSet.has(profile.user_id));

    const filteredCount = profiles.length;
    const totalCount = count ? Math.max(0, count - (excludedIds.length - 1)) : filteredCount;
    const hasMore = totalCount > to + 1 || filteredCount === limit;

    return {
      profiles,
      totalCount,
      hasMore,
      currentPage: page,
    };
  } catch (error) {
    logger.error('searchBuddies', 'Error in searchBuddies:', error);
    throw error;
  }
}

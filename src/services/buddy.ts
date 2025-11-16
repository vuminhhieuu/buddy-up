import { supabase } from '../config/supabase';
import type {
  BuddyFilters,
  BuddyProfile,
  BuddySearchResult,
  PaginationOptions,
} from '../types/buddy';

/**
 * Get list of user IDs that should be excluded from search results
 * (current user + users with existing connections)
 */
export async function getExcludedUserIds(currentUserId: string): Promise<string[]> {
  try {
    const excludedIds = new Set<string>([currentUserId]);

    // Get all connections where current user is involved
    const { data: connections, error } = await supabase
      .from('connections')
      .select('user_id_1, user_id_2, status')
      .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching connections:', error);
      return Array.from(excludedIds);
    }

    // Add all connected users to excluded list
    connections?.forEach((conn) => {
      if (conn.user_id_1 === currentUserId) {
        excludedIds.add(conn.user_id_2);
      } else {
        excludedIds.add(conn.user_id_1);
      }
    });

    return Array.from(excludedIds);
  } catch (error) {
    console.error('Error in getExcludedUserIds:', error);
    return [currentUserId];
  }
}

/**
 * Search buddies based on filters
 */
export async function searchBuddies(
  filters: BuddyFilters,
  currentUserId: string,
  options: PaginationOptions = { page: 1, limit: 20 },
): Promise<BuddySearchResult> {
  try {
    // Get excluded user IDs
    const excludedIds = await getExcludedUserIds(currentUserId);

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .neq('user_id', currentUserId)
      .is('deleted_at', null);

    // Exclude users with existing connections
    // Note: Supabase doesn't support .not().in() directly, so we filter in code after query
    // For better performance with many excluded IDs, consider using a subquery or RPC function

    // Filter by search query (name search)
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      query = query.ilike('display_name', `%${filters.searchQuery.trim()}%`);
    }

    // Filter by learning goals (array overlap)
    if (filters.learningGoals && filters.learningGoals.length > 0) {
      query = query.overlaps('learning_goals', filters.learningGoals);
    }

    // Filter by available times (array overlap)
    if (filters.availableTimes && filters.availableTimes.length > 0) {
      query = query.overlaps('available_times', filters.availableTimes);
    }

    // Filter by learning style
    if (filters.learningStyle) {
      query = query.eq('learning_style', filters.learningStyle);
    }

    // Filter by age range
    if (filters.age) {
      if (filters.age.min) {
        query = query.gte('age', filters.age.min);
      }
      if (filters.age.max) {
        query = query.lte('age', filters.age.max);
      }
    }

    // Filter by level
    if (filters.level) {
      query = query.eq('level', filters.level);
    }

    // Filter by online status
    if (filters.onlyOnline) {
      query = query.eq('is_online', true);
    }

    // Filter by verified status
    if (filters.onlyVerified) {
      query = query.eq('is_verified', true);
    }

    // Hide rejected connections if filter is enabled
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
          // Filter out rejected users
          rejectedIds.forEach((id) => {
            query = query.neq('user_id', id);
          });
        }
      }
    }

    // Apply sorting
    if (filters.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (filters.sortBy === 'nearest') {
      // For nearest, we would need location data and calculate distance
      // For now, fallback to newest
      query = query.order('created_at', { ascending: false });
    } else {
      // best_match: Sort by compatibility (for now, use created_at as fallback)
      // TODO: Implement compatibility scoring
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Filter out excluded users (current user is already excluded in query)
    const excludedSet = new Set(excludedIds);
    let profiles = ((data || []) as BuddyProfile[]).filter(
      (profile) => !excludedSet.has(profile.user_id),
    );

    // Recalculate count after filtering
    // Note: This is approximate since we filter after query
    // For exact count, we'd need to query with all filters including exclusions
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
    console.error('Error in searchBuddies:', error);
    throw error;
  }
}

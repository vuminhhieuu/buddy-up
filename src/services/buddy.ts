import { supabase } from '../config/supabase';
import type {
  BuddyFilters,
  BuddyProfile,
  BuddySearchResult,
  PaginationOptions,
  ConnectionRequest,
  SendBuddyRequestResponse,
  ConnectionStatusResult,
  ConnectionStatus,
} from '../types/buddy';

/**
 * Get connection status between two users
 */
export async function getConnectionStatus(
  currentUserId: string,
  targetUserId: string,
): Promise<ConnectionStatusResult> {
  try {
    if (currentUserId === targetUserId) {
      return {
        exists: false,
        status: null,
        connectionId: null,
        isRequestedByMe: false,
      };
    }

    const { data: connections, error } = await supabase
      .from('connections')
      .select('id, user_id_1, user_id_2, status, requested_by')
      .or(
        `and(user_id_1.eq.${currentUserId},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${currentUserId})`,
      )
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching connection status:', error);
      return {
        exists: false,
        status: null,
        connectionId: null,
        isRequestedByMe: false,
      };
    }

    // Find connection where both users are involved
    const connection = connections?.find(
      (conn) =>
        (conn.user_id_1 === currentUserId && conn.user_id_2 === targetUserId) ||
        (conn.user_id_1 === targetUserId && conn.user_id_2 === currentUserId),
    );

    if (!connection) {
      return {
        exists: false,
        status: null,
        connectionId: null,
        isRequestedByMe: false,
      };
    }

    return {
      exists: true,
      status: connection.status as ConnectionStatus,
      connectionId: connection.id,
      isRequestedByMe: connection.requested_by === currentUserId,
    };
  } catch (error) {
    console.error('Error in getConnectionStatus:', error);
    return {
      exists: false,
      status: null,
      connectionId: null,
      isRequestedByMe: false,
    };
  }
}

/**
 * Send a buddy connection request
 */
export async function sendBuddyRequest(
  currentUserId: string,
  targetUserId: string,
): Promise<SendBuddyRequestResponse> {
  try {
    // Validate: cannot send request to self
    if (currentUserId === targetUserId) {
      return {
        success: false,
        error: 'Cannot send connection request to yourself',
        errorCode: 'SELF_CONNECTION',
      };
    }

    // Check if connection already exists
    const existingStatus = await getConnectionStatus(currentUserId, targetUserId);
    if (existingStatus.exists) {
      return {
        success: false,
        error: 'Connection request already exists',
        errorCode: 'ALREADY_EXISTS',
      };
    }

    // Verify target user exists
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', targetUserId)
      .is('deleted_at', null)
      .single();

    if (profileError || !targetProfile) {
      return {
        success: false,
        error: 'Target user not found',
        errorCode: 'INVALID_USER',
      };
    }

    // Create connection request
    // Ensure user_id_1 < user_id_2 for consistency (or use any order, database will handle)
    const { data: connection, error: insertError } = await supabase
      .from('connections')
      .insert({
        user_id_1: currentUserId,
        user_id_2: targetUserId,
        status: 'pending',
        requested_by: currentUserId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating connection request:', insertError);
      // Check if it's a duplicate (race condition)
      if (insertError.code === '23505') {
        // Unique constraint violation
        return {
          success: false,
          error: 'Connection request already exists',
          errorCode: 'ALREADY_EXISTS',
        };
      }
      return {
        success: false,
        error: insertError.message || 'Failed to send connection request',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: true,
      connection: connection as ConnectionRequest,
    };
  } catch (error) {
    console.error('Error in sendBuddyRequest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get list of user IDs that should be excluded from search results
 * (current user + users with existing connections including pending requests)
 */
export async function getExcludedUserIds(currentUserId: string): Promise<string[]> {
  try {
    const excludedIds = new Set<string>([currentUserId]);

    const { data: connections, error } = await supabase
      .from('connections')
      .select('user_id_1, user_id_2, status')
      .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching connections:', error);
      return Array.from(excludedIds);
    }

    // Exclude all users with any connection status (pending, accepted, blocked, rejected)
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

    const page = options.page || 1;
    const limit = options.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const excludedSet = new Set(excludedIds);
    let profiles = ((data || []) as BuddyProfile[]).filter(
      (profile) => !excludedSet.has(profile.user_id),
    );

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

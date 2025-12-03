/**
 * Buddy Connection Management
 * Functions for managing buddy connection requests and status
 */

import { supabase } from '../../config/supabase';
import type {
  ConnectionRequest,
  ConnectionStatus,
  ConnectionStatusResult,
  IncomingRequest,
  SendBuddyRequestResponse,
} from '../../types/buddy';
import { POSTGRES_ERROR_CODES } from '../../constants/errors';
import { logger } from '../../utils/logger';
import { formatErrorMessage, handleSupabaseError, handleUnknownError } from '../helpers';

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
      logger.error('getConnectionStatus', 'Error fetching connection status:', error);
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
    logger.error('getConnectionStatus', 'Error in getConnectionStatus:', error);
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
      logger.error('sendBuddyRequest', 'Error creating connection request:', insertError);
      // Check if it's a duplicate (race condition)
      if (insertError.code === POSTGRES_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION) {
        return {
          success: false,
          error: 'Connection request already exists',
          errorCode: 'ALREADY_EXISTS',
        };
      }
      const errorResponse = handleSupabaseError(insertError, 'Failed to send connection request');
      return {
        success: false,
        error: errorResponse.error,
        errorCode: errorResponse.errorCode,
      };
    }

    return {
      success: true,
      connection: connection as ConnectionRequest,
    };
  } catch (error) {
    logger.error('sendBuddyRequest', 'Error in sendBuddyRequest:', error);
    const errorResponse = handleUnknownError(error, 'Failed to send connection request');
    return {
      success: false,
      error: errorResponse.error,
      errorCode: errorResponse.errorCode,
    };
  }
}

/**
 * Response from responding to a buddy request
 */
export interface RespondToBuddyRequestResponse {
  success: boolean;
  connection?: ConnectionRequest;
  error?: string;
  errorCode?: 'INVALID_CONNECTION' | 'UNAUTHORIZED' | 'NETWORK_ERROR';
}

/**
 * Respond to a buddy connection request (accept or reject)
 * @param connectionId - Connection request ID
 * @param currentUserId - Current user ID (receiver)
 * @param action - 'accept' or 'reject'
 * @returns Response with updated connection or error
 */
export async function respondToBuddyRequest(
  connectionId: string,
  currentUserId: string,
  action: 'accept' | 'reject',
): Promise<RespondToBuddyRequestResponse> {
  try {
    // First, verify the connection exists and user is authorized
    // Only select required fields for authorization check
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('id, user_id_1, user_id_2, status')
      .eq('id', connectionId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !connection) {
      return {
        success: false,
        error: 'Connection request not found',
        errorCode: 'INVALID_CONNECTION',
      };
    }

    // Verify user is the receiver (user_id_2)
    if (connection.user_id_2 !== currentUserId) {
      return {
        success: false,
        error: 'Unauthorized: You are not the receiver of this request',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Verify request is still pending
    if (connection.status !== 'pending') {
      return {
        success: false,
        error: `Connection request is already ${connection.status}`,
        errorCode: 'INVALID_CONNECTION',
      };
    }

    // Update connection status
    const newStatus: ConnectionStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { data: updatedConnection, error: updateError } = await supabase
      .from('connections')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (updateError) {
      logger.error('respondToBuddyRequest', 'Error updating connection status:', updateError);
      return {
        success: false,
        error: updateError.message || 'Failed to update connection status',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: true,
      connection: updatedConnection as ConnectionRequest,
    };
  } catch (error) {
    logger.error('respondToBuddyRequest', 'Error in respondToBuddyRequest:', error);
    const errorResponse = handleUnknownError(error, 'Failed to respond to connection request');
    return {
      success: false,
      error: errorResponse.error,
      errorCode: errorResponse.errorCode,
    };
  }
}

/**
 * Fetch incoming connection requests for a user
 * @param userId - Current user ID (receiver)
 * @returns Array of incoming requests with sender profiles
 */
export async function fetchIncomingRequests(userId: string): Promise<IncomingRequest[]> {
  try {
    // Fetch all pending connections where user is the receiver (user_id_2)
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id_2', userId)
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (connectionsError) {
      logger.error('fetchIncomingRequests', 'Error fetching incoming requests:', connectionsError);
      return [];
    }

    if (!connections || connections.length === 0) {
      return [];
    }

    // Fetch sender profiles for all requests
    const senderIds = connections.map((conn) => conn.requested_by);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', senderIds)
      .is('deleted_at', null);

    if (profilesError) {
      logger.error('fetchIncomingRequests', 'Error fetching sender profiles:', profilesError);
      return [];
    }

    // Create a map of user_id to profile for quick lookup
    const profileMap = new Map<string, import('../../types/buddy').BuddyProfile>();
    profiles?.forEach((profile) => {
      profileMap.set(profile.user_id, profile as import('../../types/buddy').BuddyProfile);
    });

    // Combine connections with sender profiles
    const incomingRequests: IncomingRequest[] = connections
      .map((connection) => {
        const sender = profileMap.get(connection.requested_by);
        if (!sender) {
          logger.warn(
            'fetchIncomingRequests',
            `Sender profile not found for user: ${connection.requested_by}`,
          );
          return null;
        }

        return {
          id: connection.id,
          connection: connection as ConnectionRequest,
          sender,
          read: false, // Default to unread, will be updated by Redux
          createdAt: connection.created_at,
        };
      })
      .filter((req): req is IncomingRequest => req !== null);

    return incomingRequests;
  } catch (error) {
    logger.error('fetchIncomingRequests', 'Error in fetchIncomingRequests:', error);
    return [];
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
      logger.error('getExcludedUserIds', 'Error fetching connections:', error);
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
    logger.error('getExcludedUserIds', 'Error in getExcludedUserIds:', error);
    return [currentUserId];
  }
}

/**
 * Fetch accepted buddies (profiles) for the given user.
 * Returns an array of BuddyProfile for users that have an accepted connection with currentUserId.
 */
export async function fetchAcceptedBuddies(currentUserId: string) {
  try {
    const { data: connections, error } = await supabase
      .from('connections')
      .select('user_id_1, user_id_2')
      .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
      .eq('status', 'accepted')
      .is('deleted_at', null);

    if (error) {
      logger.error('fetchAcceptedBuddies', 'Error fetching accepted connections:', error);
      return [];
    }

    if (!connections || connections.length === 0) return [];

    const otherIds = connections
      .map((c: any) => (c.user_id_1 === currentUserId ? c.user_id_2 : c.user_id_1))
      .filter((id) => !!id);

    if (otherIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', otherIds)
      .is('deleted_at', null);

    if (profilesError) {
      logger.error(
        'fetchAcceptedBuddies',
        'Error fetching profiles for accepted buddies:',
        profilesError,
      );
      return [];
    }

    return (profiles || []) as import('../../types/buddy').BuddyProfile[];
  } catch (err) {
    logger.error('fetchAcceptedBuddies', 'Unexpected error', err);
    return [];
  }
}

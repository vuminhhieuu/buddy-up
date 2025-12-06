/**
 * Chat Rooms
 * Functions for creating and managing chat rooms
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { handleUnknownError } from '../helpers';
import type { ChatRoom, CreateDirectChatResponse } from './types';

/**
 * Create a direct chat room between two users
 * If a direct chat already exists, returns the existing chat
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @param retryCount - Internal retry counter (max 3 retries)
 * @returns Response with chat room or error
 */
export async function createDirectChat(
  userId1: string,
  userId2: string,
): Promise<CreateDirectChatResponse> {
  try {
    // Validate: cannot create chat with self
    if (userId1 === userId2) {
      return {
        success: false,
        error: 'Cannot create chat with yourself',
        errorCode: 'INVALID_USERS',
      };
    }

    const { data: chatId, error: rpcError } = await supabase.rpc('create_direct_chat', {
      p_user_id_1: userId1,
      p_user_id_2: userId2,
    });

    if (rpcError || !chatId) {
      logger.error('createDirectChat', 'RPC create_direct_chat failed', rpcError);
      return {
        success: false,
        error: rpcError?.message || 'Failed to create chat room',
        errorCode: 'NETWORK_ERROR',
      };
    }

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id, type, title, created_by, created_at, updated_at, deleted_at')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      logger.error('createDirectChat', 'Failed to fetch chat after RPC', chatError);
      return {
        success: false,
        error: chatError?.message || 'Failed to fetch chat room',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: true,
      chat: chat as ChatRoom,
    };
  } catch (error) {
    logger.error('createDirectChat', 'Error in createDirectChat:', error);
    const errorResponse = handleUnknownError(error, 'Failed to create chat room');
    return {
      success: false,
      error: errorResponse.error,
      errorCode: errorResponse.errorCode,
    };
  }
}

/**
 * Chat Rooms
 * Functions for creating and managing chat rooms
 */

import { supabase } from '../../config/supabase';
import { MAX_RETRY_COUNT, RETRY_DELAY_MS, PARTICIPANT_ROLE_MEMBER } from '../../constants/chat';
import { POSTGRES_ERROR_CODES } from '../../constants/errors';
import { logger } from '../../utils/logger';
import {
  isRlsError,
  isPolicyRecursion,
  formatErrorMessage,
  handleSupabaseError,
  handleUnknownError,
} from '../helpers';
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
  retryCount = 0,
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

    // Check if direct chat already exists between these two users
    // Optimized: query chat_participants first to find chats where both users participate
    const { data: user1Chats, error: user1Error } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId1);

    const { data: user2Chats, error: user2Error } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId2);

    const skipExistingCheck =
      isPolicyRecursion(user1Error) ||
      isPolicyRecursion(user2Error) ||
      isRlsError(user1Error) ||
      isRlsError(user2Error);

    if (user1Error || user2Error) {
      if (!skipExistingCheck) {
        logger.error(
          'createDirectChat',
          'Error checking existing chats:',
          user1Error || user2Error,
        );
      }
    } else if (
      !skipExistingCheck &&
      user1Chats &&
      user2Chats &&
      user1Chats.length > 0 &&
      user2Chats.length > 0
    ) {
      // Find common chat IDs
      const user1ChatIds = new Set(user1Chats.map((c) => c.chat_id));
      const commonChatIds = user2Chats
        .map((c) => c.chat_id)
        .filter((chatId) => user1ChatIds.has(chatId));

      if (commonChatIds.length > 0) {
        // Check if any of these chats is a direct chat
        const { data: existingDirectChats, error: chatError } = await supabase
          .from('chats')
          .select('id, type, title, created_by, created_at, updated_at, deleted_at')
          .eq('type', 'direct')
          .in('id', commonChatIds)
          .is('deleted_at', null)
          .limit(1);

        if (!chatError && existingDirectChats && existingDirectChats.length > 0) {
          // Direct chat already exists
          const chat = existingDirectChats[0];
          return {
            success: true,
            chat: {
              id: chat.id,
              type: chat.type,
              title: chat.title,
              created_by: chat.created_by,
              created_at: chat.created_at,
              updated_at: chat.updated_at,
              deleted_at: chat.deleted_at || null,
            } as ChatRoom,
          };
        }
      }
    }

    // Create new direct chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({
        type: 'direct',
        title: null, // Direct chats don't have titles
        created_by: userId1,
      })
      .select()
      .single();

    if (createError) {
      if (isRlsError(createError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      logger.error('createDirectChat', 'Error creating chat:', createError);
      // Check if it's a duplicate (race condition)
      if (
        createError.code === POSTGRES_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION &&
        retryCount < MAX_RETRY_COUNT
      ) {
        // Unique constraint violation - retry with limit
        // Wait a bit before retry to avoid immediate race condition
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return createDirectChat(userId1, userId2, retryCount + 1);
      }
      const errorResponse = handleSupabaseError(createError, 'Failed to create chat room');
      return {
        success: false,
        error: errorResponse.error,
        errorCode: errorResponse.errorCode,
      };
    }

    // Add both users as participants
    const { error: participantsError } = await supabase.from('chat_participants').insert([
      {
        chat_id: newChat.id,
        user_id: userId1,
        role: PARTICIPANT_ROLE_MEMBER,
      },
      {
        chat_id: newChat.id,
        user_id: userId2,
        role: PARTICIPANT_ROLE_MEMBER,
      },
    ]);

    if (participantsError) {
      if (isRlsError(participantsError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      logger.error('createDirectChat', 'Error adding participants:', participantsError);
      // Try to clean up the chat if participants failed
      await supabase.from('chats').delete().eq('id', newChat.id);
      return {
        success: false,
        error: 'Failed to add participants to chat',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: true,
      chat: newChat as ChatRoom,
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

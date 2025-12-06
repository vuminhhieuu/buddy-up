/**
 * Chat Messages
 * Functions for sending and managing chat messages
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { isRlsError, handleSupabaseError, handleUnknownError } from '../helpers';
import type { Message, SendMessageResponse, FetchMessagesResponse } from './types';

/**
 * Fetch messages for a chat room
 * @param chatId - Chat room ID
 * @param limit - Maximum number of messages to fetch (default: 50)
 * @returns Response with messages or error
 */
export async function fetchMessages(chatId: string, limit = 50): Promise<FetchMessagesResponse> {
  try {
    // Verify chat exists and is not deleted
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .is('deleted_at', null)
      .single();

    if (chatError || !chat) {
      if (isRlsError(chatError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      return {
        success: false,
        error: 'Chat room not found',
        errorCode: 'INVALID_CHAT',
      };
    }

    // Fetch messages ordered by created_at DESC (newest first)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (messagesError) {
      if (isRlsError(messagesError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      logger.error('fetchMessages', 'Error fetching messages:', messagesError);
      const errorResponse = handleSupabaseError(messagesError, 'Failed to fetch messages');
      return {
        success: false,
        error: errorResponse.error,
        errorCode: errorResponse.errorCode,
      };
    }

    // Reverse to get chronological order (oldest first)
    const orderedMessages = (messages || []).reverse() as Message[];

    return {
      success: true,
      messages: orderedMessages,
    };
  } catch (error) {
    logger.error('fetchMessages', 'Error in fetchMessages:', error);
    const errorResponse = handleUnknownError(error, 'Failed to fetch messages');
    return {
      success: false,
      error: errorResponse.error,
      errorCode: errorResponse.errorCode,
    };
  }
}

/**
 * Send a text message to a chat room
 * @param chatId - Chat room ID
 * @param senderId - User ID of the sender
 * @param content - Message text content
 * @returns Response with message or error
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
): Promise<SendMessageResponse> {
  try {
    // Validate content is not empty
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'Message content cannot be empty',
        errorCode: 'INVALID_CHAT',
      };
    }

    // Verify chat exists and is not deleted (check existence first)
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .is('deleted_at', null)
      .single();

    if (chatError || !chat) {
      if (isRlsError(chatError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      return {
        success: false,
        error: 'Chat room not found',
        errorCode: 'INVALID_CHAT',
      };
    }

    // Verify user is a participant (check after chat existence)
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', senderId);

    if (participantsError || !participants || participants.length === 0) {
      if (isRlsError(participantsError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      return {
        success: false,
        error: 'You are not a participant in this chat',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content: content.trim(),
        attachments: [],
      })
      .select()
      .single();

    if (messageError) {
      if (isRlsError(messageError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      logger.error('sendMessage', 'Error sending message:', messageError);
      const errorResponse = handleSupabaseError(messageError, 'Failed to send message');
      return {
        success: false,
        error: errorResponse.error,
        errorCode: errorResponse.errorCode,
      };
    }

    // Update chat's updated_at timestamp
    const { error: updateError } = await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    if (updateError) {
      logger.error('sendMessage', 'Failed to update chat updated_at:', updateError);
      // Continue execution - message was sent successfully, this is a non-critical update
    }

    return {
      success: true,
      message: message as Message,
    };
  } catch (error) {
    logger.error('sendMessage', 'Error in sendMessage:', error);
    const errorResponse = handleUnknownError(error, 'Failed to send message');
    return {
      success: false,
      error: errorResponse.error,
      errorCode: errorResponse.errorCode,
    };
  }
}

/**
 * Send a quick message to a chat room
 * @param chatId - Chat room ID
 * @param senderId - User ID of the sender
 * @param messageTemplate - Message template text (from i18n)
 * @returns Response with message or error
 */
export async function sendQuickMessage(
  chatId: string,
  senderId: string,
  messageTemplate: string,
): Promise<SendMessageResponse> {
  try {
    // Verify chat exists and is not deleted (check existence first)
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .is('deleted_at', null)
      .single();

    if (chatError || !chat) {
      if (isRlsError(chatError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      return {
        success: false,
        error: 'Chat room not found',
        errorCode: 'INVALID_CHAT',
      };
    }

    // Verify user is a participant (check after chat existence)
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', senderId);

    if (participantsError || !participants || participants.length === 0) {
      if (isRlsError(participantsError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      return {
        success: false,
        error: 'You are not a participant in this chat',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content: messageTemplate,
        attachments: [],
      })
      .select()
      .single();

    if (messageError) {
      if (isRlsError(messageError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      logger.error('sendQuickMessage', 'Error sending message:', messageError);
      const errorResponse = handleSupabaseError(messageError, 'Failed to send message');
      return {
        success: false,
        error: errorResponse.error,
        errorCode: errorResponse.errorCode,
      };
    }

    // Update chat's updated_at timestamp
    const { error: updateError } = await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    if (updateError) {
      logger.error('sendQuickMessage', 'Failed to update chat updated_at:', updateError);
      // Continue execution - message was sent successfully, this is a non-critical update
    }

    return {
      success: true,
      message: message as Message,
    };
  } catch (error) {
    logger.error('sendQuickMessage', 'Error in sendQuickMessage:', error);
    const errorResponse = handleUnknownError(error, 'Failed to send message');
    return {
      success: false,
      error: errorResponse.error,
      errorCode: errorResponse.errorCode,
    };
  }
}

/**
 * Mark messages as read for the current user in a chat
 * @param chatId - Chat room ID
 * @param userId - Current user ID
 */
export async function markMessagesRead(chatId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', userId);

    if (error && !isRlsError(error)) {
      logger.warn('markMessagesRead', 'Failed to update last_read_at', error);
    }
  } catch (error) {
    logger.warn('markMessagesRead', 'Unexpected error', error);
  }
}

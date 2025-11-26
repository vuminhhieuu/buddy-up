/**
 * Chat Messages
 * Functions for sending and managing chat messages
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import {
  isRlsError,
  formatErrorMessage,
  handleSupabaseError,
  handleUnknownError,
} from '../helpers';
import type { Message, SendMessageResponse } from './types';

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
    // Verify chat exists and user is a participant
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

    // Verify chat exists and is not deleted
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .is('deleted_at', null)
      .single();

    if (chatError || !chat) {
      return {
        success: false,
        error: 'Chat room not found',
        errorCode: 'INVALID_CHAT',
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
    await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);

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

/**
 * Chat Service
 * Functions for creating chat rooms and sending messages
 */

import { supabase } from '../config/supabase';

/**
 * Chat room data
 */
export interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Chat participant data
 */
export interface ChatParticipant {
  chat_id: string;
  user_id: string;
  role: 'member' | 'admin' | 'owner';
  joined_at: string;
  last_read_at: string | null;
}

/**
 * Message data
 */
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string | null;
  content: string | null;
  attachments: Array<{
    url: string;
    type: string;
    name: string;
    size: number;
  }>;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

/**
 * Response from creating a chat room
 */
export interface CreateDirectChatResponse {
  success: boolean;
  chat?: ChatRoom;
  error?: string;
  errorCode?: 'ALREADY_EXISTS' | 'INVALID_USERS' | 'NETWORK_ERROR';
}

/**
 * Response from sending a message
 */
export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
  errorCode?: 'INVALID_CHAT' | 'UNAUTHORIZED' | 'NETWORK_ERROR';
}

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

    if (user1Error || user2Error) {
      console.error('Error checking existing chats:', user1Error || user2Error);
      // Continue to create new chat
    } else if (user1Chats && user2Chats && user1Chats.length > 0 && user2Chats.length > 0) {
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
      console.error('Error creating chat:', createError);
      // Check if it's a duplicate (race condition)
      if (createError.code === '23505' && retryCount < 3) {
        // Unique constraint violation - retry with limit
        // Wait a bit before retry to avoid immediate race condition
        await new Promise((resolve) => setTimeout(resolve, 100));
        return createDirectChat(userId1, userId2, retryCount + 1);
      }
      return {
        success: false,
        error: createError.message || 'Failed to create chat room',
        errorCode: 'NETWORK_ERROR',
      };
    }

    // Add both users as participants
    const { error: participantsError } = await supabase.from('chat_participants').insert([
      {
        chat_id: newChat.id,
        user_id: userId1,
        role: 'member',
      },
      {
        chat_id: newChat.id,
        user_id: userId2,
        role: 'member',
      },
    ]);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
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
    console.error('Error in createDirectChat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'NETWORK_ERROR',
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
    // Verify chat exists and user is a participant
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', senderId);

    if (participantsError || !participants || participants.length === 0) {
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
      console.error('Error sending message:', messageError);
      return {
        success: false,
        error: messageError.message || 'Failed to send message',
        errorCode: 'NETWORK_ERROR',
      };
    }

    // Update chat's updated_at timestamp
    await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);

    return {
      success: true,
      message: message as Message,
    };
  } catch (error) {
    console.error('Error in sendQuickMessage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

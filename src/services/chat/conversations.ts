/**
 * Chat Conversations
 * Functions for fetching user conversations and participant information
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import {
  isRlsError,
  formatErrorMessage,
  handleSupabaseError,
  handleUnknownError,
} from '../helpers';
import type {
  ChatConversation,
  FetchConversationsResponse,
  ChatParticipantInfo,
  GetParticipantInfoResponse,
  Message,
} from './types';

/**
 * Fetch all conversations for a user
 * Returns conversations with last message, unread count, and participant info
 * @param userId - Current user ID
 * @returns Response with conversations or error
 */
export async function fetchUserConversations(userId: string): Promise<FetchConversationsResponse> {
  try {
    // Fetch all chats where user is a participant
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('chat_id, last_read_at')
      .eq('user_id', userId);

    if (participantsError) {
      if (isRlsError(participantsError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      logger.error('fetchUserConversations', 'Error fetching participants:', participantsError);
      const errorResponse = handleSupabaseError(participantsError, 'Failed to fetch conversations');
      return {
        success: false,
        error: errorResponse.error,
        errorCode: errorResponse.errorCode,
      };
    }

    if (!participants || participants.length === 0) {
      return {
        success: true,
        conversations: [],
      };
    }

    const chatIds = participants.map((p) => p.chat_id);
    const lastReadMap = new Map(participants.map((p) => [p.chat_id, p.last_read_at]));

    // Fetch chat details
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id, type, title, created_by, updated_at')
      .in('id', chatIds)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (chatsError) {
      if (isRlsError(chatsError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      logger.error('fetchUserConversations', 'Error fetching chats:', chatsError);
      const errorResponse = handleSupabaseError(chatsError, 'Failed to fetch conversations');
      return {
        success: false,
        error: errorResponse.error,
        errorCode: errorResponse.errorCode,
      };
    }

    if (!chats || chats.length === 0) {
      return {
        success: true,
        conversations: [],
      };
    }

    // Fetch last message for each chat in a single query (avoiding N+1)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('chat_id', chatIds)
      .is('deleted_at', null)
      .order('chat_id', { ascending: true })
      .order('created_at', { ascending: false });

    if (messagesError && !isRlsError(messagesError)) {
      logger.warn(
        'fetchUserConversations',
        'Error fetching last messages for chats:',
        messagesError,
      );
    }

    // Map: chatId -> last message (first message per chat when ordered by created_at DESC)
    const lastMessageMap = new Map<string, Message | null>();
    if (messages && messages.length > 0) {
      // Group messages by chat_id and get the first (latest) message for each chat
      const messagesByChat = new Map<string, Message[]>();
      for (const msg of messages) {
        const existing = messagesByChat.get(msg.chat_id) || [];
        existing.push(msg as Message);
        messagesByChat.set(msg.chat_id, existing);
      }

      // Get the first (latest) message for each chat
      for (const [chatId, chatMessages] of messagesByChat.entries()) {
        if (chatMessages.length > 0) {
          // Messages are already ordered by created_at DESC, so first is latest
          lastMessageMap.set(chatId, chatMessages[0]);
        }
      }
    }

    // Ensure all chatIds have an entry (null if no messages)
    for (const chatId of chatIds) {
      if (!lastMessageMap.has(chatId)) {
        lastMessageMap.set(chatId, null);
      }
    }

    // For direct chats, fetch participant info in batch to avoid N+1 queries
    const directChats = chats.filter((chat) => chat.type === 'direct');
    const directChatIds = directChats.map((chat) => chat.id);

    // Get all other participants for these chats (excluding current user)
    const { data: otherParticipantsData, error: otherParticipantsError } = await supabase
      .from('chat_participants')
      .select('chat_id, user_id')
      .in('chat_id', directChatIds)
      .neq('user_id', userId);

    if (otherParticipantsError && !isRlsError(otherParticipantsError)) {
      logger.warn(
        'fetchUserConversations',
        'Error fetching other participants:',
        otherParticipantsError,
      );
    }

    // Map chat_id to other participant user_id
    const chatIdToOtherUserId = new Map<string, string>();
    if (otherParticipantsData) {
      for (const row of otherParticipantsData) {
        // Only set if not already set (to handle multiple participants per chat)
        if (!chatIdToOtherUserId.has(row.chat_id)) {
          chatIdToOtherUserId.set(row.chat_id, row.user_id);
        }
      }
    }

    // Get all unique other user IDs
    const otherUserIds = Array.from(new Set(Array.from(chatIdToOtherUserId.values())));

    // Fetch all profiles in a single query
    let profilesData: Array<{
      user_id: string;
      display_name: string | null;
      avatar_url: string | null;
    }> = [];
    if (otherUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', otherUserIds)
        .is('deleted_at', null);

      if (profilesError && !isRlsError(profilesError)) {
        logger.warn(
          'fetchUserConversations',
          'Error fetching participant profiles:',
          profilesError,
        );
      } else if (profiles) {
        profilesData = profiles;
      }
    }

    // Map user_id to profile
    const userIdToProfile = new Map<
      string,
      { user_id: string; display_name: string | null; avatar_url: string | null }
    >();
    for (const profile of profilesData) {
      userIdToProfile.set(profile.user_id, profile);
    }

    // Build participantMap: chatId -> participant info
    const participantMap = new Map<string, ChatParticipantInfo | null>();
    for (const chat of directChats) {
      const otherUserId = chatIdToOtherUserId.get(chat.id);
      const profile = otherUserId ? userIdToProfile.get(otherUserId) : null;
      if (profile) {
        participantMap.set(chat.id, {
          userId: profile.user_id,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        });
      } else {
        participantMap.set(chat.id, null);
      }
    }

    // Calculate unread count for each chat using a single batched query
    // Fetch all relevant messages for all chats at once
    const { data: unreadMessages, error: unreadError } = await supabase
      .from('messages')
      .select('chat_id, sender_id, created_at, deleted_at')
      .in('chat_id', chatIds)
      .is('deleted_at', null)
      .neq('sender_id', userId);

    if (unreadError && !isRlsError(unreadError)) {
      logger.warn('fetchUserConversations', 'Error fetching unread messages:', unreadError);
    }

    // Count unread messages per chat according to lastReadAt
    const unreadCountMap = new Map<string, number>();
    for (const chatId of chatIds) {
      const lastReadAt = lastReadMap.get(chatId);
      let count = 0;

      if (unreadMessages) {
        count = unreadMessages.filter((msg) => {
          if (msg.chat_id !== chatId) return false;
          // If never read, count all messages
          if (!lastReadAt) return true;
          // Count messages after last_read_at
          return msg.created_at > lastReadAt;
        }).length;
      }

      unreadCountMap.set(chatId, count);
    }

    // Build conversations array
    const conversations: ChatConversation[] = chats.map((chat) => {
      const lastMessage = lastMessageMap.get(chat.id) || null;
      const participant = participantMap.get(chat.id) || null;

      return {
        chatId: chat.id,
        type: chat.type,
        title: chat.title,
        lastMessage,
        lastMessageAt: lastMessage?.created_at || null,
        unreadCount: unreadCountMap.get(chat.id) || 0,
        participantId: participant?.userId || null,
        participantName: participant?.displayName || null,
        participantAvatar: participant?.avatarUrl || null,
        updatedAt: chat.updated_at,
      };
    });

    return {
      success: true,
      conversations,
    };
  } catch (error) {
    logger.error('fetchUserConversations', 'Error in fetchUserConversations:', error);
    const errorResponse = handleUnknownError(error, 'Failed to fetch conversations');
    return {
      success: false,
      error: errorResponse.error,
      errorCode: errorResponse.errorCode,
    };
  }
}

/**
 * Get participant information for a direct chat
 * Returns the other participant's info (not the current user)
 * @param chatId - Chat room ID
 * @param currentUserId - Current user ID
 * @returns Response with participant info or error
 */
export async function getChatParticipantInfo(
  chatId: string,
  currentUserId: string,
): Promise<GetParticipantInfoResponse> {
  try {
    // Verify chat exists and is direct type
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id, type')
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

    if (chat.type !== 'direct') {
      return {
        success: false,
        error: 'This function only works for direct chats',
        errorCode: 'INVALID_CHAT',
      };
    }

    // Verify current user is a participant
    const { data: currentParticipant, error: participantError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (participantError || !currentParticipant) {
      if (isRlsError(participantError)) {
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

    // Get the other participant (not the current user)
    const { data: otherParticipant, error: otherError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .neq('user_id', currentUserId)
      .limit(1)
      .maybeSingle();

    if (otherError || !otherParticipant) {
      if (isRlsError(otherError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      return {
        success: false,
        error: 'Other participant not found',
        errorCode: 'INVALID_CHAT',
      };
    }

    // Fetch profile of the other participant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .eq('user_id', otherParticipant.user_id)
      .is('deleted_at', null)
      .single();

    if (profileError || !profile) {
      if (isRlsError(profileError)) {
        return {
          success: false,
          error: 'RLS_VIOLATION',
          errorCode: 'PERMISSION_DENIED',
        };
      }
      logger.error('getChatParticipantInfo', 'Error fetching profile:', profileError);
      const errorResponse = handleSupabaseError(profileError, 'Failed to fetch participant info');
      return {
        success: false,
        error: errorResponse.error,
        errorCode: errorResponse.errorCode,
      };
    }

    const participant: ChatParticipantInfo = {
      userId: profile.user_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    };

    return {
      success: true,
      participant,
    };
  } catch (error) {
    logger.error('getChatParticipantInfo', 'Error in getChatParticipantInfo:', error);
    const errorResponse = handleUnknownError(error, 'Failed to fetch participant info');
    return {
      success: false,
      error: errorResponse.error,
      errorCode: errorResponse.errorCode,
    };
  }
}

/**
 * Hook for listening to realtime messages via Supabase Realtime
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addMessage, incrementUnreadCount, selectActiveChatId } from '../store/slices/chatSlice';
import type { Message } from '../services/chat';
import { logger } from '../utils/logger';

/**
 * Type guard to validate Message payload from Supabase Realtime
 */
const isValidMessage = (data: unknown): data is Message => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const msg = data as Record<string, unknown>;

  return (
    typeof msg.id === 'string' &&
    msg.id.length > 0 &&
    typeof msg.chat_id === 'string' &&
    msg.chat_id.length > 0 &&
    typeof msg.created_at === 'string' &&
    msg.created_at.length > 0 &&
    (msg.sender_id === null || (typeof msg.sender_id === 'string' && msg.sender_id.length > 0)) &&
    (msg.content === null || typeof msg.content === 'string') &&
    Array.isArray(msg.attachments) &&
    msg.attachments.every((att: unknown) => {
      if (!att || typeof att !== 'object') {
        return false;
      }
      const attachment = att as Record<string, unknown>;
      return (
        typeof attachment.url === 'string' &&
        typeof attachment.type === 'string' &&
        typeof attachment.name === 'string' &&
        typeof attachment.size === 'number' &&
        attachment.size >= 0
      );
    }) &&
    (msg.edited_at === null || typeof msg.edited_at === 'string') &&
    (msg.deleted_at === null || typeof msg.deleted_at === 'string')
  );
};

/**
 * Hook to subscribe to realtime messages for a specific chat
 * @param chatId - Chat room ID to subscribe to
 * @param currentUserId - Current user ID (to determine if message is from current user)
 */
export const useChatRealtime = (chatId: string | null, currentUserId: string | null) => {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector(selectActiveChatId);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Use ref to store current activeChatId to avoid stale closure in subscription callback
  const activeChatIdRef = useRef<string | null>(activeChatId);

  // Update ref whenever activeChatId changes
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    // Skip if no chatId or userId
    if (!chatId || !currentUserId) {
      logger.debug('useChatRealtime', 'No chatId or userId, skipping subscription', {
        chatId,
        currentUserId,
      });
      return;
    }

    logger.debug('useChatRealtime', `Setting up Realtime subscription for chat: ${chatId}`);

    // Create channel for this chat
    const channelName = `messages:${chatId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Only listen for messages in this chat
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          logger.debug('useChatRealtime', 'Received INSERT event:', {
            messageId: payload.new?.id,
            chatId: payload.new?.chat_id,
            senderId: payload.new?.sender_id,
          });

          try {
            // Validate payload structure before processing
            if (!payload.new) {
              logger.error('useChatRealtime', 'Missing payload.new');
              return;
            }

            // Type guard validation to ensure payload has expected shape
            if (!isValidMessage(payload.new)) {
              logger.error('useChatRealtime', 'Invalid message payload:', payload.new);
              return;
            }

            const message = payload.new as Message;

            // Skip if message is deleted
            if (message.deleted_at) {
              logger.debug('useChatRealtime', 'Skipping deleted message:', message.id);
              return;
            }

            logger.debug('useChatRealtime', 'Processing new message:', {
              messageId: message.id,
              chatId: message.chat_id,
              senderId: message.sender_id,
              isFromCurrentUser: message.sender_id === currentUserId,
            });

            // Add message to Redux state
            dispatch(
              addMessage({
                chatId: message.chat_id,
                message,
              }),
            );

            logger.debug('useChatRealtime', 'Added message to Redux state:', {
              messageId: message.id,
              chatId: message.chat_id,
            });

            // Increment unread count if message is not from current user
            // and chat is not currently active
            // Use ref to get current activeChatId value to avoid stale closure
            const currentActiveChatId = activeChatIdRef.current;
            if (message.sender_id !== currentUserId && currentActiveChatId !== chatId) {
              dispatch(incrementUnreadCount(chatId));
              logger.debug('useChatRealtime', 'Incremented unread count for chat:', chatId);
            }
          } catch (error) {
            logger.error('useChatRealtime', 'Error processing new message:', error);
          }
        },
      )
      .subscribe((status, err) => {
        logger.debug('useChatRealtime', `Subscription status changed: ${status}`, {
          channelName,
          chatId,
          userId: currentUserId,
          error: err,
        });

        if (status === 'SUBSCRIBED') {
          logger.info('useChatRealtime', '✅ Successfully subscribed to messages', { chatId });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('useChatRealtime', '❌ Channel error:', err);
          logger.warn('useChatRealtime', 'Attempting to reconnect...');
          // Supabase SDK will automatically attempt to reconnect
        } else if (status === 'TIMED_OUT') {
          logger.warn('useChatRealtime', '⚠️ Channel timed out, attempting to reconnect...');
        } else if (status === 'CLOSED') {
          logger.debug('useChatRealtime', 'Channel closed');
        } else {
          logger.debug('useChatRealtime', `Unknown status: ${status}`);
        }
      });

    subscriptionRef.current = channel;

    // Cleanup: unsubscribe when component unmounts or chatId/userId changes
    // Capture channel in closure to prevent race condition when chatId changes rapidly
    return () => {
      logger.debug('useChatRealtime', `Cleaning up subscription for chat: ${chatId}`);
      // Use channel from closure instead of subscriptionRef.current to avoid race condition
      supabase.removeChannel(channel);
      // Only clear ref if this is still the current channel
      if (subscriptionRef.current === channel) {
        subscriptionRef.current = null;
      }
    };
  }, [chatId, currentUserId, dispatch, activeChatId]);
};

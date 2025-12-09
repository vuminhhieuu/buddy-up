/**
 * useChatInboxRealtime
 * Subscribe to incoming messages for the current user to update unread counts globally.
 */

import { useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { incrementUnreadCount, selectActiveChatId } from '../../store/slices/chatSlice';
import { fetchConversationsAsync } from '../../store/slices/chatSlice';
import type { Message } from '../../services/chat';
import { logger } from '../../utils/logger';

export const useChatInboxRealtime = (currentUserId: string | null | undefined) => {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector(selectActiveChatId);

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to all messages visible to the current user (RLS will filter)
    const channel = supabase
      .channel(`chat-inbox-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          try {
            const newMessage = payload.new as Message | undefined;
            if (!newMessage) return;

            // Ignore messages from current user
            if (newMessage.sender_id === currentUserId) return;

            // If user is not viewing this chat, increment unread and refresh conversations
            if (activeChatId !== newMessage.chat_id) {
              dispatch(incrementUnreadCount(newMessage.chat_id));
              dispatch(fetchConversationsAsync());
            }
          } catch (error) {
            logger.warn('useChatInboxRealtime', 'Failed to process inbox payload', error);
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('useChatInboxRealtime', 'Subscribed to inbox messages');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          logger.warn('useChatInboxRealtime', `Channel ${status} for inbox`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeChatId, dispatch]);
};

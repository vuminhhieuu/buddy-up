import { useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  addMessage,
  fetchMessagesAsync,
  incrementUnreadCount,
  selectActiveChatId,
} from '../../store/slices/chatSlice';
import type { Message } from '../../services/chat';
import { logger } from '../../utils/logger';

const FALLBACK_REFRESH_MS = 8000;

/**
 * Subscribe to realtime messages for a specific chat.
 * Falls back to re-fetching the latest messages to avoid missing payloads because of RLS.
 */
export const useChatRealtime = (
  chatId: string | null | undefined,
  currentUserId: string | null | undefined,
) => {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector(selectActiveChatId);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!chatId) return;

    let isMounted = true;

    const channel = supabase
      .channel(`chat-room-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          try {
            const newMessage = payload.new as Message | undefined;
            if (newMessage) {
              dispatch(addMessage({ chatId, message: newMessage }));

              if (newMessage.sender_id !== currentUserId && activeChatIdRef.current !== chatId) {
                dispatch(incrementUnreadCount(chatId));
              }
            }
          } catch (error) {
            logger.warn('useChatRealtime', 'Failed to process realtime payload', error);
          } finally {
            dispatch(fetchMessagesAsync({ chatId, limit: 100 }));
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('useChatRealtime', `Subscribed to chat ${chatId}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          logger.warn('useChatRealtime', `Channel ${status} for chat ${chatId}`);
          dispatch(fetchMessagesAsync({ chatId, limit: 100 }));
        }
      });

    const fallbackInterval = setInterval(() => {
      if (isMounted) {
        dispatch(fetchMessagesAsync({ chatId, limit: 100 }));
      }
    }, FALLBACK_REFRESH_MS);

    return () => {
      isMounted = false;
      clearInterval(fallbackInterval);
      supabase.removeChannel(channel);
    };
  }, [chatId, dispatch, currentUserId]);
};

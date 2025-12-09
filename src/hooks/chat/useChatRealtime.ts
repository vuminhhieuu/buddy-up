import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
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
import { sendChatNotification } from '../../services/notifications/handlers/chatHandler';
import { notificationService } from '../../services/notifications';

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
  const { t } = useTranslation('chat');

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

              // Send notification if message is not from current user
              if (newMessage.sender_id !== currentUserId) {
                const appState = notificationService.getAppState();
                const isViewingChat = activeChatIdRef.current === chatId;

                // Only send notification if:
                // 1. User is not viewing this chat, OR
                // 2. App is in background/quit
                if (!isViewingChat || appState !== 'active') {
                  // Get chat participants and sender info
                  try {
                    const { data: participants } = await supabase
                      .from('chat_participants')
                      .select('user_id')
                      .eq('chat_id', chatId)
                      .neq('user_id', newMessage.sender_id);

                    const { data: senderProfile } = await supabase
                      .from('profiles')
                      .select('display_name')
                      .eq('user_id', newMessage.sender_id)
                      .is('deleted_at', null)
                      .maybeSingle();

                    if (participants && participants.length > 0) {
                      const recipientIds = participants.map((p) => p.user_id);
                      const senderName = senderProfile?.display_name || 'Someone';
                      const messageContent = newMessage.content || '[Attachment]';

                      await sendChatNotification({
                        chatId,
                        senderId: newMessage.sender_id,
                        senderName,
                        messageContent,
                        recipientIds,
                        title: t('notification.newMessageTitle'),
                      });
                    }
                  } catch (notificationError) {
                    logger.warn(
                      'useChatRealtime',
                      'Failed to send notification:',
                      notificationError,
                    );
                  }
                }
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

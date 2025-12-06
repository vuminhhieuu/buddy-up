/**
 * Hook for listening to incoming connection requests via Supabase Realtime
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAppDispatch } from '../store/hooks';
import { addIncomingRequest, fetchIncomingRequestsAsync } from '../store/slices/buddySlice';
import type { ConnectionRequest, BuddyProfile } from '../types/buddy';
import { showSuccessToast, showInfoToast } from '../utils/toast';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';

const SYNC_INTERVAL_MS = 10000;

/**
 * Type guard to validate ConnectionRequest payload from Supabase Realtime
 */
const isValidConnectionRequest = (data: unknown): data is ConnectionRequest => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const conn = data as Record<string, unknown>;

  return (
    typeof conn.id === 'string' &&
    typeof conn.user_id_1 === 'string' &&
    typeof conn.user_id_2 === 'string' &&
    typeof conn.status === 'string' &&
    typeof conn.requested_by === 'string' &&
    typeof conn.created_at === 'string' &&
    typeof conn.updated_at === 'string' &&
    (conn.deleted_at === null || typeof conn.deleted_at === 'string')
  );
};

/**
 * Minimal fields required for status updates (UPDATE events)
 */
const hasStatusUpdateFields = (
  data: unknown,
): data is {
  id: string;
  status: string;
  requested_by: string;
  user_id_1: string;
  user_id_2: string;
} => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const conn = data as Record<string, unknown>;
  return (
    typeof conn.id === 'string' &&
    typeof conn.status === 'string' &&
    typeof conn.requested_by === 'string' &&
    typeof conn.user_id_1 === 'string' &&
    typeof conn.user_id_2 === 'string'
  );
};

export const useBuddyRequests = (userId: string | null) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation('buddy');
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) {
      logger.debug('useBuddyRequests', 'No userId, skipping subscription');
      return;
    }

    logger.debug('useBuddyRequests', `Setting up Realtime subscription for user: ${userId}`);

    const syncIncomingRequests = () => {
      void dispatch(fetchIncomingRequestsAsync());
    };

    syncIncomingRequests();

    // Create channel for this user
    const channelName = `connections:${userId}`;
    const channel = supabase
      .channel(channelName)
      // Listen for INSERT events: new requests sent TO this user (receiver)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections',
          // Only listen for requests sent TO this user (receiver)
          filter: `user_id_2=eq.${userId}`,
        },
        async (payload) => {
          logger.debug('useBuddyRequests', 'Received INSERT event:', {
            connectionId: payload.new?.id,
            status: payload.new?.status,
            user_id_1: payload.new?.user_id_1,
            user_id_2: payload.new?.user_id_2,
          });

          try {
            // Validate payload structure before processing
            if (!payload.new) {
              logger.error('useBuddyRequests', 'Missing payload.new');
              return;
            }

            // Type guard validation to ensure payload has expected shape
            if (!isValidConnectionRequest(payload.new)) {
              logger.error('useBuddyRequests', 'Invalid connection request payload:', payload.new);
              return;
            }

            const connection = payload.new;

            // Validate required fields are present (additional safety check)
            if (!connection.id || !connection.created_at || !connection.requested_by) {
              logger.error('useBuddyRequests', 'Missing required fields:', {
                id: connection.id,
                created_at: connection.created_at,
                requested_by: connection.requested_by,
              });
              return;
            }

            // Only process pending requests
            if (connection.status !== 'pending') {
              logger.debug('useBuddyRequests', 'Skipping non-pending request:', connection.status);
              return;
            }

            logger.debug(
              'useBuddyRequests',
              'Processing pending request from:',
              connection.requested_by,
            );

            // Fetch sender profile information
            const { data: senderProfile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', connection.requested_by)
              .is('deleted_at', null)
              .single();

            if (profileError || !senderProfile) {
              logger.error('useBuddyRequests', 'Error fetching sender profile:', profileError);
              return;
            }

            logger.debug('useBuddyRequests', 'Fetched sender profile:', senderProfile.display_name);

            // Convert sender profile to BuddyProfile format
            // Map all required fields with defaults for missing ones
            const sender: BuddyProfile = {
              user_id: senderProfile.user_id,
              display_name: senderProfile.display_name,
              avatar_url: senderProfile.avatar_url || null,
              bio: senderProfile.bio || null,
              interests: senderProfile.interests || [],
              learning_goals: senderProfile.learning_goals || [],
              available_times: senderProfile.available_times || [],
              available_times_detail: senderProfile.available_times_detail || [],
              learning_style: senderProfile.learning_style || null,
              age: senderProfile.age || null,
              level: senderProfile.level || null,
              is_online: senderProfile.is_online ?? false,
              is_verified: senderProfile.is_verified ?? false,
              location: senderProfile.location || null,
              main_learning_goal: senderProfile.main_learning_goal || null,
              learning_interests: senderProfile.learning_interests || [],
              created_at: senderProfile.created_at,
              updated_at: senderProfile.updated_at,
            };

            // Add to Redux state
            dispatch(
              addIncomingRequest({
                id: connection.id,
                connection,
                sender,
                createdAt: connection.created_at,
              }),
            );

            logger.debug('useBuddyRequests', 'Added request to Redux state:', {
              connectionId: connection.id,
              senderName: sender.display_name,
            });

            // Show toast notification
            const toastMessage = t('notifications.newRequestMessage', {
              name: sender.display_name,
            });
            logger.debug('useBuddyRequests', 'Showing toast with message:', toastMessage);
            showSuccessToast(toastMessage);
            logger.debug('useBuddyRequests', 'Toast.show() called');
            syncIncomingRequests();
          } catch (error) {
            logger.error('useBuddyRequests', 'Error processing incoming request:', error);
          }
        },
      )
      // Listen for UPDATE events: when requests sent BY this user are accepted/rejected
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'connections',
          // Only listen for requests sent BY this user (sender)
          filter: `requested_by=eq.${userId}`,
        },
        async (payload) => {
          logger.debug('useBuddyRequests', 'Received UPDATE event:', {
            connectionId: payload.new?.id,
            oldStatus: payload.old?.status,
            newStatus: payload.new?.status,
            requested_by: payload.new?.requested_by,
          });

          try {
            // Validate payload structure (only minimal fields required)
            if (!payload.new || !hasStatusUpdateFields(payload.new)) {
              logger.error(
                'useBuddyRequests',
                'Missing minimal fields for status update:',
                payload.new,
              );
              return;
            }

            const newConnection = payload.new;
            const previousStatus =
              payload.old && typeof payload.old === 'object'
                ? (payload.old as { status?: string }).status
                : undefined;

            // Only process if status is accepted/rejected
            if (newConnection.status !== 'accepted' && newConnection.status !== 'rejected') {
              logger.debug(
                'useBuddyRequests',
                'Status changed to non-accepted/rejected:',
                newConnection.status,
              );
              return;
            }

            // If we have previous status info, skip duplicate updates unless it was pending
            if (previousStatus && previousStatus !== 'pending') {
              logger.debug('useBuddyRequests', 'Skipping status update from:', previousStatus);
              return;
            }

            // Fetch receiver profile to show in toast
            const receiverId =
              newConnection.user_id_1 === userId
                ? newConnection.user_id_2
                : newConnection.user_id_1;

            const { data: receiverProfile, error: profileError } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', receiverId)
              .is('deleted_at', null)
              .single();

            if (profileError || !receiverProfile) {
              logger.error('useBuddyRequests', 'Error fetching receiver profile:', profileError);
              // Still show toast without name
              if (newConnection.status === 'accepted') {
                showSuccessToast(t('notifications.requestAccepted'));
              } else {
                showInfoToast(t('notifications.requestRejected'));
              }
              return;
            }

            // Show toast notification
            if (newConnection.status === 'accepted') {
              showSuccessToast(
                t('notifications.requestAcceptedMessage', {
                  name: receiverProfile.display_name,
                }),
              );
            } else {
              showInfoToast(
                t('notifications.requestRejectedMessage', {
                  name: receiverProfile.display_name,
                }),
              );
            }

            syncIncomingRequests();
            logger.debug('useBuddyRequests', 'Toast notification shown for status update');
          } catch (error) {
            logger.error('useBuddyRequests', 'Error processing status update:', error);
          }
        },
      )
      .subscribe((status, err) => {
        logger.debug('useBuddyRequests', `Subscription status changed: ${status}`, {
          channelName,
          userId,
          error: err,
        });

        if (status === 'SUBSCRIBED') {
          logger.info('useBuddyRequests', '✅ Successfully subscribed to connection requests');
          syncIncomingRequests();
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('useBuddyRequests', '❌ Channel error:', err);
          logger.warn('useBuddyRequests', 'Attempting to reconnect...');
          syncIncomingRequests();
          // Supabase SDK will automatically attempt to reconnect
        } else if (status === 'TIMED_OUT') {
          logger.warn('useBuddyRequests', '⚠️ Channel timed out, attempting to reconnect...');
          syncIncomingRequests();
        } else if (status === 'CLOSED') {
          logger.debug('useBuddyRequests', 'Channel closed');
        } else {
          logger.debug('useBuddyRequests', `Unknown status: ${status}`);
        }
      });

    subscriptionRef.current = channel;

    const intervalId = setInterval(syncIncomingRequests, SYNC_INTERVAL_MS);

    // Cleanup: unsubscribe when component unmounts or userId changes
    // Capture channel in closure to prevent race condition when userId changes rapidly
    return () => {
      logger.debug('useBuddyRequests', `Cleaning up subscription for user: ${userId}`);
      // Use channel from closure instead of subscriptionRef.current to avoid race condition
      clearInterval(intervalId);
      supabase.removeChannel(channel);
      // Only clear ref if this is still the current channel
      if (subscriptionRef.current === channel) {
        subscriptionRef.current = null;
      }
    };
  }, [userId, dispatch, t]);
};

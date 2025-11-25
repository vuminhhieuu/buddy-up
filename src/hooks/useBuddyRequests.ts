/**
 * Hook for listening to incoming connection requests via Supabase Realtime
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAppDispatch } from '../store/hooks';
import { addIncomingRequest } from '../store/slices/buddySlice';
import type { ConnectionRequest, BuddyProfile } from '../types/buddy';
import { showSuccessToast, showInfoToast } from '../utils/toast';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log('[useBuddyRequests] No userId, skipping subscription');
      return;
    }

    console.log(`[useBuddyRequests] Setting up Realtime subscription for user: ${userId}`);

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
          console.log('[useBuddyRequests] Received INSERT event:', {
            connectionId: payload.new?.id,
            status: payload.new?.status,
            user_id_1: payload.new?.user_id_1,
            user_id_2: payload.new?.user_id_2,
          });

          try {
            // Validate payload structure before processing
            if (!payload.new) {
              console.error('[useBuddyRequests] Missing payload.new');
              return;
            }

            // Type guard validation to ensure payload has expected shape
            if (!isValidConnectionRequest(payload.new)) {
              console.error('[useBuddyRequests] Invalid connection request payload:', payload.new);
              return;
            }

            const connection = payload.new;

            // Validate required fields are present (additional safety check)
            if (!connection.id || !connection.created_at || !connection.requested_by) {
              console.error('[useBuddyRequests] Missing required fields:', {
                id: connection.id,
                created_at: connection.created_at,
                requested_by: connection.requested_by,
              });
              return;
            }

            // Only process pending requests
            if (connection.status !== 'pending') {
              console.log('[useBuddyRequests] Skipping non-pending request:', connection.status);
              return;
            }

            console.log(
              '[useBuddyRequests] Processing pending request from:',
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
              console.error('[useBuddyRequests] Error fetching sender profile:', profileError);
              return;
            }

            console.log('[useBuddyRequests] Fetched sender profile:', senderProfile.display_name);

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

            console.log('[useBuddyRequests] Added request to Redux state');

            // Show toast notification
            showSuccessToast(
              t('buddy.notifications.newRequestMessage', {
                name: sender.display_name,
              }),
            );

            console.log('[useBuddyRequests] Toast notification shown');
          } catch (error) {
            console.error('[useBuddyRequests] Error processing incoming request:', error);
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
          console.log('[useBuddyRequests] Received UPDATE event:', {
            connectionId: payload.new?.id,
            oldStatus: payload.old?.status,
            newStatus: payload.new?.status,
            requested_by: payload.new?.requested_by,
          });

          try {
            // Validate payload structure (only minimal fields required)
            if (!payload.new || !hasStatusUpdateFields(payload.new)) {
              console.error(
                '[useBuddyRequests] Missing minimal fields for status update:',
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
              console.log(
                '[useBuddyRequests] Status changed to non-accepted/rejected:',
                newConnection.status,
              );
              return;
            }

            // If we have previous status info, skip duplicate updates unless it was pending
            if (previousStatus && previousStatus !== 'pending') {
              console.log('[useBuddyRequests] Skipping status update from:', previousStatus);
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
              console.error('[useBuddyRequests] Error fetching receiver profile:', profileError);
              // Still show toast without name
              if (newConnection.status === 'accepted') {
                showSuccessToast(t('buddy.notifications.requestAccepted'));
              } else {
                showInfoToast(t('buddy.notifications.requestRejected'));
              }
              return;
            }

            // Show toast notification
            if (newConnection.status === 'accepted') {
              showSuccessToast(
                t('buddy.notifications.requestAcceptedMessage', {
                  name: receiverProfile.display_name,
                }),
              );
            } else {
              showInfoToast(
                t('buddy.notifications.requestRejectedMessage', {
                  name: receiverProfile.display_name,
                }),
              );
            }

            console.log('[useBuddyRequests] Toast notification shown for status update');
          } catch (error) {
            console.error('[useBuddyRequests] Error processing status update:', error);
          }
        },
      )
      .subscribe((status, err) => {
        console.log(`[useBuddyRequests] Subscription status changed: ${status}`, {
          channelName,
          userId,
          error: err,
        });

        if (status === 'SUBSCRIBED') {
          console.log('[useBuddyRequests] ✅ Successfully subscribed to connection requests');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useBuddyRequests] ❌ Channel error:', err);
          console.error('[useBuddyRequests] Attempting to reconnect...');
          // Supabase SDK will automatically attempt to reconnect
        } else if (status === 'TIMED_OUT') {
          console.warn('[useBuddyRequests] ⚠️ Channel timed out, attempting to reconnect...');
        } else if (status === 'CLOSED') {
          console.log('[useBuddyRequests] Channel closed');
        } else {
          console.log(`[useBuddyRequests] Unknown status: ${status}`);
        }
      });

    subscriptionRef.current = channel;

    // Cleanup: unsubscribe when component unmounts or userId changes
    // Capture channel in closure to prevent race condition when userId changes rapidly
    return () => {
      console.log(`[useBuddyRequests] Cleaning up subscription for user: ${userId}`);
      // Use channel from closure instead of subscriptionRef.current to avoid race condition
      supabase.removeChannel(channel);
      // Only clear ref if this is still the current channel
      if (subscriptionRef.current === channel) {
        subscriptionRef.current = null;
      }
    };
  }, [userId, dispatch, t]);
};

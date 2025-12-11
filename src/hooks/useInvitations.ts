import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  fetchPendingInvitations,
  getPendingInvitationsCount,
  acceptInvitation,
  declineInvitation,
  SessionInvitation,
} from '../services/invitations';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export function useInvitations() {
  const userId = useAppSelector((state) => state.auth.userId);
  const [invitations, setInvitations] = useState<SessionInvitation[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPendingInvitations(userId);
      setInvitations(result);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải lời mời');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadPendingCount = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await getPendingInvitationsCount(userId);
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, [userId]);

  useEffect(() => {
    loadInvitations();
    loadPendingCount();
  }, [loadInvitations, loadPendingCount]);

  // Realtime subscription for invitation changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`invitations-${userId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: userId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_session_participants',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.debug('useInvitations', 'Realtime update:', payload);
          // Reload invitations cho INSERT và UPDATE (Accept/Decline)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            void loadInvitations();
          }
          void loadPendingCount();
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('useInvitations', 'Realtime subscription active');
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, loadInvitations, loadPendingCount]);

  const handleAccept = useCallback(
    async (sessionId: string) => {
      if (!userId) return false;
      const ok = await acceptInvitation(sessionId, userId);
      if (ok) {
        await loadInvitations();
        await loadPendingCount();
      }
      return ok;
    },
    [userId, loadInvitations, loadPendingCount],
  );

  const handleDecline = useCallback(
    async (sessionId: string) => {
      if (!userId) return false;
      const ok = await declineInvitation(sessionId, userId);
      if (ok) {
        await loadInvitations();
        await loadPendingCount();
      }
      return ok;
    },
    [userId, loadInvitations, loadPendingCount],
  );

  return {
    invitations,
    pendingCount,
    loading,
    error,
    loadInvitations,
    loadPendingCount,
    acceptInvitation: handleAccept,
    declineInvitation: handleDecline,
  };
}

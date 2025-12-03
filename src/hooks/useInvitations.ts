import { useState, useCallback, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  fetchPendingInvitations,
  getPendingInvitationsCount,
  acceptInvitation as acceptInvitationAPI,
  declineInvitation as declineInvitationAPI,
  type SessionInvitation,
} from '../services/invitations';
import { logger } from '../utils/logger';

export const useInvitations = () => {
  const userId = useAppSelector((state) => state.auth.userId);
  const [invitations, setInvitations] = useState<SessionInvitation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchPendingInvitations(userId);
      setInvitations(data);
      setPendingCount(data.length);
    } catch (err: any) {
      logger.error('useInvitations.loadInvitations', err.message, err);
      setError(err.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadPendingCount = useCallback(async () => {
    if (!userId) return;

    try {
      const count = await getPendingInvitationsCount(userId);
      setPendingCount(count);
    } catch (err: any) {
      logger.error('useInvitations.loadPendingCount', err.message, err);
    }
  }, [userId]);

  const acceptInvitation = useCallback(
    async (sessionId: string) => {
      if (!userId) return;

      try {
        await acceptInvitationAPI(sessionId, userId);
        await loadInvitations();
      } catch (err: any) {
        logger.error('useInvitations.acceptInvitation', err.message, err);
        throw err;
      }
    },
    [userId, loadInvitations],
  );

  const declineInvitation = useCallback(
    async (sessionId: string) => {
      if (!userId) return;

      try {
        await declineInvitationAPI(sessionId, userId);
        await loadInvitations();
      } catch (err: any) {
        logger.error('useInvitations.declineInvitation', err.message, err);
        throw err;
      }
    },
    [userId, loadInvitations],
  );

  return {
    invitations,
    pendingCount,
    loading,
    error,
    loadInvitations,
    loadPendingCount,
    acceptInvitation,
    declineInvitation,
  };
};

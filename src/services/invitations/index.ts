import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';

export type SessionInvitation = {
  session_id: string;
  session_title: string;
  session_subject: string | null;
  scheduled_start: string;
  scheduled_end: string | null;
  creator_id: string;
  creator_name: string | null;
  creator_avatar: string | null;
  status: 'invited' | 'accepted' | 'declined';
};

/**
 * Fetch pending invitations for a user
 */
export async function fetchPendingInvitations(userId: string): Promise<SessionInvitation[]> {
  try {
    // Step 1: fetch participant rows for pending invitations only
    const { data: parts, error: partsError } = await supabase
      .from('study_session_participants')
      .select('session_id, status')
      .eq('user_id', userId)
      .eq('status', 'invited')
      .order('joined_at', { ascending: false });

    if (partsError) {
      logger.error('fetchPendingInvitations', partsError.message, partsError);
      throw partsError;
    }

    if (!parts || parts.length === 0) return [];

    // Step 2: fetch sessions for those ids (exclude canceled sessions)
    const sessionIds = [...new Set(parts.map((p) => p.session_id))];
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('id, title, subject, scheduled_start, scheduled_end, creator_id, status')
      .in('id', sessionIds)
      .neq('status', 'canceled');

    if (sessionsError) {
      logger.error('fetchPendingInvitations.sessions', sessionsError.message, sessionsError);
      throw sessionsError;
    }
    if (!sessions || sessions.length === 0) return [];

    // Step 3: fetch creator profiles
    const creatorIds = [...new Set(sessions.map((s: any) => s.creator_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', creatorIds);

    if (profilesError) {
      logger.warn('fetchPendingInvitations.profiles', profilesError.message, profilesError);
    }

    const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

    // Build a map of session by id
    const sessionMap = new Map<string, any>();
    sessions.forEach((s: any) => sessionMap.set(s.id, s));

    return parts.map((p: any) => {
      const s = sessionMap.get(p.session_id);
      const creator = s ? profileMap.get(s.creator_id) : undefined;
      return {
        session_id: p.session_id,
        session_title: s?.title ?? '',
        session_subject: s?.subject ?? null,
        scheduled_start: s?.scheduled_start ?? new Date().toISOString(),
        scheduled_end: s?.scheduled_end ?? null,
        creator_id: s?.creator_id ?? '',
        creator_name: creator?.display_name ?? null,
        creator_avatar: creator?.avatar_url ?? null,
        status: p.status as 'invited' | 'accepted' | 'declined',
      } as SessionInvitation;
    });
  } catch (err: any) {
    logger.error('fetchPendingInvitations', 'Unexpected error', err);
    throw err;
  }
}

/**
 * Get count of pending invitations
 */
export async function getPendingInvitationsCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('study_session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'invited');

    if (error) {
      logger.error('getPendingInvitationsCount', error.message, error);
      throw error;
    }

    return count ?? 0;
  } catch (err: any) {
    logger.error('getPendingInvitationsCount', 'Unexpected error', err);
    return 0;
  }
}

/**
 * Accept a session invitation
 */
export async function acceptInvitation(sessionId: string, userId: string): Promise<void> {
  try {
    // Validate session is not cancelled and not in the past
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('scheduled_end, status')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      logger.error('acceptInvitation.validation', sessionError.message, sessionError);
      throw new Error('Không thể tìm thấy buổi học');
    }

    if (session.status === 'canceled') {
      throw new Error('Buổi học này đã bị hủy');
    }

    // Check if session has ended
    if (session.scheduled_end && new Date(session.scheduled_end) < new Date()) {
      throw new Error('Buổi học này đã kết thúc');
    }

    const { error } = await supabase
      .from('study_session_participants')
      .update({ status: 'accepted' })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      logger.error('acceptInvitation', error.message, error);
      throw error;
    }

    logger.info('acceptInvitation', `User ${userId} accepted session ${sessionId}`);
  } catch (err: any) {
    logger.error('acceptInvitation', 'Unexpected error', err);
    throw err;
  }
}

/**
 * Decline a session invitation
 */
export async function declineInvitation(sessionId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('study_session_participants')
      .update({ status: 'declined' })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      logger.error('declineInvitation', error.message, error);
      throw error;
    }

    logger.info('declineInvitation', `User ${userId} declined session ${sessionId}`);
  } catch (err: any) {
    logger.error('declineInvitation', 'Unexpected error', err);
    throw err;
  }
}

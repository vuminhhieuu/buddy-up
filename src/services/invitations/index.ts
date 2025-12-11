import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { createOrUpdateSessionReminders, deleteSessionReminderForUser } from '../session/reminders';

export type SessionInvitation = {
  session_id: string;
  title: string | null;
  subject: string | null;
  scheduled_start: string;
  scheduled_end: string | null;
  creator_id: string;
  creator_name: string | null;
  creator_avatar: string | null;
  status: 'invited' | 'accepted' | 'declined';
};

export async function fetchPendingInvitations(userId: string): Promise<SessionInvitation[]> {
  // Step 1: Get all invited sessions for user
  const { data: participants, error: participantsError } = await supabase
    .from('study_session_participants')
    .select('session_id, status')
    .eq('user_id', userId)
    .eq('status', 'invited');
  if (participantsError) {
    logger.warn(
      'fetchPendingInvitations.participants',
      participantsError.message,
      participantsError,
    );
    return [];
  }
  if (!participants || participants.length === 0) return [];
  const sessionIds = participants.map((p) => p.session_id);

  // Step 2: Get session info
  const { data: sessions, error: sessionsError } = await supabase
    .from('study_sessions')
    .select('id, title, subject, scheduled_start, scheduled_end, creator_id')
    .in('id', sessionIds);
  if (sessionsError) {
    logger.warn('fetchPendingInvitations.sessions', sessionsError.message, sessionsError);
    return [];
  }
  if (!sessions || sessions.length === 0) return [];
  const creatorIds = Array.from(new Set(sessions.map((s) => s.creator_id)));

  // Step 3: Get creator profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', creatorIds);
  if (profilesError) {
    logger.warn('fetchPendingInvitations.profiles', profilesError.message, profilesError);
    return [];
  }
  const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  profiles?.forEach((profile) => {
    profileMap.set(profile.user_id, {
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    });
  });

  // Compose result
  return sessions.map((session) => {
    const creator = profileMap.get(session.creator_id);
    return {
      session_id: session.id,
      title: session.title,
      subject: session.subject,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      creator_id: session.creator_id,
      creator_name: creator?.display_name ?? null,
      creator_avatar: creator?.avatar_url ?? null,
      status: 'invited',
    };
  });
}

export async function getPendingInvitationsCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('study_session_participants')
    .select('session_id')
    .eq('user_id', userId)
    .eq('status', 'invited');
  if (error) {
    logger.warn('getPendingInvitationsCount', error.message, error);
    return 0;
  }
  return data ? data.length : 0;
}

export async function acceptInvitation(sessionId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('study_session_participants')
    .update({ status: 'accepted' })
    .eq('session_id', sessionId)
    .eq('user_id', userId);
  if (error) {
    logger.warn('acceptInvitation', error.message, error);
    return false;
  }
  // Ensure reminder exists for the user who accepted
  try {
    await createOrUpdateSessionReminders(sessionId);
  } catch (e) {
    logger.warn('acceptInvitation', 'Failed to create/update reminders after accept', e);
  }
  return true;
}

export async function declineInvitation(sessionId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('study_session_participants')
    .update({ status: 'declined' })
    .eq('session_id', sessionId)
    .eq('user_id', userId);
  if (error) {
    logger.warn('declineInvitation', error.message, error);
    return false;
  }
  // Remove any reminder for this user to avoid sending notifications
  try {
    await deleteSessionReminderForUser(sessionId, userId);
  } catch (e) {
    logger.warn('declineInvitation', 'Failed to delete user reminder after decline', e);
  }
  return true;
}

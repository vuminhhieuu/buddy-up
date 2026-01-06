import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { NotificationType } from '../../types/notifications';
import { SessionAttachment } from '../../types/sessionAttachment';

export interface SessionParticipant {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  status: 'invited' | 'accepted' | 'declined' | 'completed';
  is_creator: boolean;
}

export interface SessionDetail {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string | null;
  title: string;
  subject: string | null;
  description?: string | null;
  scheduled_start: string;
  scheduled_end: string | null;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  location: string | null;
  offline_location?: string | null;
  participants: SessionParticipant[];
  attachments: SessionAttachment[];
}

export async function fetchSessionDetail(sessionId: string): Promise<{
  data: SessionDetail | null;
  error: any;
}> {
  try {
    logger.debug('fetchSessionDetail', 'Fetching session:', sessionId);

    // Fetch session details
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('id', sessionId)
      .is('deleted_at', null)
      .single();

    if (sessionError || !session) {
      logger.error('fetchSessionDetail', 'Session error:', sessionError);
      return { data: null, error: sessionError };
    }

    // Fetch creator profile
    logger.debug('fetchSessionDetail', 'Creator ID:', session.creator_id);
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .eq('user_id', session.creator_id)
      .single();

    if (creatorError) {
      logger.error('fetchSessionDetail', 'Creator profile error:', creatorError);
    }
    logger.debug('fetchSessionDetail', 'Creator profile:', creatorProfile);

    // Fetch participants
    const { data: participants, error: participantsError } = await supabase
      .from('study_session_participants')
      .select('user_id, status')
      .eq('session_id', sessionId);

    if (participantsError) {
      logger.error('fetchSessionDetail', 'Participants error:', participantsError);
    }

    logger.debug('fetchSessionDetail', 'Participants:', participants);

    // Fetch profiles for participants
    const participantIds = (participants || []).map((p: any) => p.user_id);
    const { data: participantProfiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', participantIds);

    const profileMap = new Map<string, any>();
    (participantProfiles || []).forEach((p: any) => {
      profileMap.set(p.user_id, p);
    });

    const participantsList: SessionParticipant[] = (participants || []).map((p: any) => {
      const profile = profileMap.get(p.user_id);
      return {
        user_id: p.user_id,
        display_name: profile?.display_name || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        status: p.status,
        is_creator: p.user_id === session.creator_id,
      };
    });

    // Always include creator as a participant with 'accepted' status
    const creatorInList = participantsList.find((p) => p.user_id === session.creator_id);
    if (!creatorInList && session.creator_id) {
      participantsList.unshift({
        user_id: session.creator_id,
        display_name: creatorProfile?.display_name || 'Unknown',
        avatar_url: creatorProfile?.avatar_url || null,
        status: 'accepted',
        is_creator: true,
      });
    }

    // Fetch attachments
    const { data: attachments, error: attachmentsError } = await supabase
      .from('study_session_attachments')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (attachmentsError) {
      logger.error('fetchSessionDetail', 'Attachments error:', attachmentsError);
    }

    const result: SessionDetail = {
      id: session.id,
      creator_id: session.creator_id,
      creator_name: creatorProfile?.display_name || 'Unknown',
      creator_avatar: creatorProfile?.avatar_url || null,
      title: session.title,
      subject: session.subject,
      description: session.description ?? null,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      status: session.status,
      location: session.location,
      offline_location: session.offline_location ?? null,
      participants: participantsList,
      attachments: attachments || [],
    };

    logger.debug('fetchSessionDetail', 'Session loaded:', result);
    return { data: result, error: null };
  } catch (err) {
    logger.error('fetchSessionDetail', 'Unexpected error:', err);
    return { data: null, error: err };
  }
}

export async function updateSessionStatus(
  sessionId: string,
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('study_sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    // If the session is cancelled, remove any scheduled reminders to avoid sending
    if (!error && status === 'cancelled') {
      try {
        const { error: delErr } = await supabase
          .from('session_reminders')
          .delete()
          .eq('session_id', sessionId);
        if (delErr) {
          logger.warn(
            'updateSessionStatus',
            'Failed to delete session_reminders on cancel',
            delErr,
          );
        }
      } catch (e) {
        logger.error('updateSessionStatus', 'Unexpected error deleting reminders', e);
      }
    }

    return { error };
  } catch (err) {
    logger.error('updateSessionStatus', 'Error:', err);
    return { error: err };
  }
}

export async function deleteSession(sessionId: string): Promise<{ error: any }> {
  try {
    logger.debug('deleteSession', 'Deleting session and related data:', sessionId);

    // Fetch session details and accepted participants before deleting
    const { data: session, error: sessionFetchError } = await supabase
      .from('study_sessions')
      .select('title, subject')
      .eq('id', sessionId)
      .single();

    if (sessionFetchError) {
      logger.error('deleteSession', 'Error fetching session:', sessionFetchError);
    }

    const { data: participants, error: participantsFetchError } = await supabase
      .from('study_session_participants')
      .select('user_id, status')
      .eq('session_id', sessionId)
      .eq('status', 'accepted');

    if (participantsFetchError) {
      logger.error('deleteSession', 'Error fetching participants:', participantsFetchError);
    }

    logger.debug('deleteSession', 'Found participants:', participants?.length || 0);

    // Send notifications to accepted participants about session cancellation
    if (participants && participants.length > 0) {
      try {
        const acceptedUserIds = participants.map((p: any) => p.user_id);
        const sessionTitle = session?.title || session?.subject || 'Session';

        logger.debug('deleteSession', 'Sending notifications to:', acceptedUserIds);

        // Dynamically import to avoid circular dependencies
        const { sendNotification } = await import('../notifications/sendNotification');

        // Send push notifications
        const notificationResult = await sendNotification({
          type: NotificationType.SESSION_CANCELLED,
          userIds: acceptedUserIds,
          title: 'Session cancelled', // Will be localized on client side
          body: `"${sessionTitle}" was cancelled by the creator`, // Will be localized on client side
          data: {
            type: NotificationType.SESSION_CANCELLED,
            sessionId,
            sessionTitle,
          },
        });

        if (notificationResult.success) {
          logger.debug(
            'deleteSession',
            'Sent cancellation notifications to participants:',
            notificationResult.sent || 0,
          );
          // Note: In-app notifications are now saved automatically by the edge function
        } else {
          logger.warn('deleteSession', 'Failed to send notifications:', notificationResult.error);
        }
      } catch (notifError) {
        logger.error('deleteSession', 'Failed to send notifications:', notifError);
        // Continue with deletion even if notifications fail
      }
    } else {
      logger.debug('deleteSession', 'No accepted participants to notify');
    }

    // First, delete all participants from study_session_participants
    const { error: participantsError } = await supabase
      .from('study_session_participants')
      .delete()
      .eq('session_id', sessionId);

    if (participantsError) {
      logger.error('deleteSession', 'Error deleting participants:', participantsError);
      return { error: participantsError };
    }

    // Then delete the session from study_sessions
    const { error: sessionError } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) {
      logger.error('deleteSession', 'Error deleting session:', sessionError);
      return { error: sessionError };
    }

    logger.debug('deleteSession', 'Session and participants deleted successfully');
    return { error: null };
  } catch (err) {
    logger.error('deleteSession', 'Unexpected error:', err);
    return { error: err };
  }
}

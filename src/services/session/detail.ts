import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';

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
  scheduled_start: string;
  scheduled_end: string | null;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  location: string | null;
  participants: SessionParticipant[];
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

    const result: SessionDetail = {
      id: session.id,
      creator_id: session.creator_id,
      creator_name: creatorProfile?.display_name || 'Unknown',
      creator_avatar: creatorProfile?.avatar_url || null,
      title: session.title,
      subject: session.subject,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      status: session.status,
      location: session.location,
      participants: participantsList,
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

    return { error };
  } catch (err) {
    logger.error('updateSessionStatus', 'Error:', err);
    return { error: err };
  }
}

export async function deleteSession(sessionId: string): Promise<{ error: any }> {
  try {
    logger.debug('deleteSession', 'Deleting session and related data:', sessionId);

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

import { supabase } from '../config/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import {
  WEEKLY_STREAK_GOAL,
  HOURS_FALLBACK,
  MS_PER_HOUR,
  MONDAY_OFFSET,
  WEEK_END_OFFSET,
  UPCOMING_DAYS_AHEAD,
  RECENT_SESSIONS_LIMIT,
  UPCOMING_SESSIONS_DISPLAY_LIMIT,
} from '../constants/profile';
import { logger } from '../utils/logger';
import { safeMaybeSingle, safeList, type MaybeSingleResult, type ListResult } from './helpers';

type SupabaseSession = {
  id: string;
  title: string | null;
  subject: string | null;
  scheduled_start: string;
  scheduled_end: string | null;
  status: 'scheduled' | 'ongoing' | 'completed' | 'canceled';
  creator_id: string;
};

type SessionParticipant = {
  session_id: string;
  user_id: string;
  status: string;
};

type ProfilePreview = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type HomeSession = {
  id: string;
  title?: string | null;
  subject?: string | null;
  scheduledStart: string;
  scheduledEnd?: string | null;
  buddyName?: string;
  buddyAvatar?: string | null;
};

export type HomeDashboardData = {
  profileName: string;
  avatarUrl?: string | null;
  streak: number;
  xp: number;
  weeklyStudyHours: number;
  completedSessions: number;
  weeklyGoalDays: number;
  sessionGoal: number;
  sessions: HomeSession[];
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + MONDAY_OFFSET) % 7; // Monday = start
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + WEEK_END_OFFSET);
  end.setHours(23, 59, 59, 999);
  return end;
}

function calculateDurationHours(session: SupabaseSession) {
  const start = new Date(session.scheduled_start).getTime();
  const end = session.scheduled_end ? new Date(session.scheduled_end).getTime() : NaN;
  if (!Number.isNaN(end) && end > start) {
    return (end - start) / MS_PER_HOUR;
  }
  return HOURS_FALLBACK;
}

const isRelevantSession = (
  session: SupabaseSession,
  participantsMap: Map<string, SessionParticipant[]>,
  userId: string,
) => {
  if (session.creator_id === userId) return true;
  const participants = participantsMap.get(session.id) || [];
  return participants.some((participant) => participant.user_id === userId);
};

const selectBuddyUserId = (
  session: SupabaseSession,
  participantsMap: Map<string, SessionParticipant[]>,
  userId: string,
) => {
  if (session.creator_id !== userId) {
    return session.creator_id;
  }
  const participants = participantsMap.get(session.id) || [];
  const acceptedParticipant = participants.find(
    (participant) => participant.user_id !== userId && participant.status === 'accepted',
  );
  if (acceptedParticipant) return acceptedParticipant.user_id;
  const anyParticipant = participants.find((participant) => participant.user_id !== userId);
  return anyParticipant?.user_id;
};

type ProfileRow = {
  display_name: string | null;
  avatar_url: string | null;
};

type ProgressRow = {
  streak: number;
  xp: number;
};

export async function fetchHomeDashboard(userId: string): Promise<HomeDashboardData> {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const upcomingEnd = new Date(now);
  upcomingEnd.setDate(upcomingEnd.getDate() + UPCOMING_DAYS_AHEAD);

  // Using shared helpers from services/helpers/queryHelpers.ts

  const [profileResult, progressResult, weekSessionsResult, upcomingSessionsResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.from('user_progress').select('streak, xp').eq('user_id', userId).maybeSingle(),
      supabase
        .from('study_sessions')
        .select('id, title, subject, scheduled_start, scheduled_end, status, creator_id')
        .gte('scheduled_start', weekStart.toISOString())
        .lte('scheduled_start', weekEnd.toISOString())
        .order('scheduled_start', { ascending: true }),
      supabase
        .from('study_sessions')
        .select('id, title, subject, scheduled_start, scheduled_end, status, creator_id')
        .gte('scheduled_start', now.toISOString())
        .lte('scheduled_start', upcomingEnd.toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(RECENT_SESSIONS_LIMIT),
    ]);

  const profileData = safeMaybeSingle<ProfileRow>(
    profileResult as MaybeSingleResult<ProfileRow>,
    'profile',
  );
  const progressData = safeMaybeSingle<ProgressRow>(
    progressResult as MaybeSingleResult<ProgressRow>,
    'progress',
  );
  const weekSessionsAll = safeList<SupabaseSession>(
    weekSessionsResult as ListResult<SupabaseSession>,
    'weekSessions',
  );
  const upcomingSessionsAll = safeList<SupabaseSession>(
    upcomingSessionsResult as ListResult<SupabaseSession>,
    'upcomingSessions',
  );

  const combinedSessions = [...weekSessionsAll, ...upcomingSessionsAll] as SupabaseSession[];

  const uniqueSessions = new Map<string, SupabaseSession>();
  combinedSessions.forEach((session) => {
    uniqueSessions.set(session.id, session);
  });

  const sessionIds = Array.from(uniqueSessions.keys());
  const participantsMap = new Map<string, SessionParticipant[]>();

  if (sessionIds.length > 0) {
    const { data: participantsData, error: participantsError } = await supabase
      .from('study_session_participants')
      .select('session_id, user_id, status')
      .in('session_id', sessionIds);

    if (participantsError) {
      logger.warn('participants', participantsError.message, participantsError);
    }

    participantsData?.forEach((participant) => {
      const list = participantsMap.get(participant.session_id) || [];
      list.push(participant);
      participantsMap.set(participant.session_id, list);
    });
  }

  const userWeekSessions = weekSessionsAll.filter((session) =>
    isRelevantSession(session as SupabaseSession, participantsMap, userId),
  ) as SupabaseSession[];

  const userUpcomingSessions = upcomingSessionsAll
    .filter((session) => isRelevantSession(session as SupabaseSession, participantsMap, userId))
    .sort(
      (a: SupabaseSession, b: SupabaseSession) =>
        new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime(),
    ) as SupabaseSession[];

  const buddyUserIds = new Set<string>();

  const collectBuddyIds = (sessions: SupabaseSession[]) => {
    sessions.forEach((session) => {
      const buddyId = selectBuddyUserId(session, participantsMap, userId);
      if (buddyId) {
        buddyUserIds.add(buddyId);
      }
    });
  };

  collectBuddyIds(userWeekSessions);
  collectBuddyIds(userUpcomingSessions);

  const buddyProfiles = new Map<string, ProfilePreview>();
  if (buddyUserIds.size > 0) {
    const { data: buddyProfilesData, error: buddyProfilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', Array.from(buddyUserIds));

    if (buddyProfilesError) {
      logger.warn('buddyProfiles', buddyProfilesError.message, buddyProfilesError);
    }

    buddyProfilesData?.forEach((profile) => {
      buddyProfiles.set(profile.user_id, profile);
    });
  }

  const toHomeSession = (session: SupabaseSession): HomeSession => {
    const buddyId = selectBuddyUserId(session, participantsMap, userId);
    const buddyProfile = buddyId ? buddyProfiles.get(buddyId) : undefined;
    return {
      id: session.id,
      title: session.title,
      subject: session.subject,
      scheduledStart: session.scheduled_start,
      scheduledEnd: session.scheduled_end,
      buddyName: buddyProfile?.display_name || undefined,
      buddyAvatar: buddyProfile?.avatar_url || undefined,
    };
  };

  const weeklyStudyHours = userWeekSessions.reduce(
    (hours, session) => hours + calculateDurationHours(session),
    0,
  );

  const completedSessions = userWeekSessions.filter(
    (session) => session.status === 'completed',
  ).length;
  const sessionGoal = userUpcomingSessions.length;

  return {
    profileName: profileData?.display_name ?? '',
    avatarUrl: profileData?.avatar_url ?? undefined,
    streak: progressData?.streak ?? 0,
    xp: progressData?.xp ?? 0,
    weeklyStudyHours,
    completedSessions,
    weeklyGoalDays: WEEKLY_STREAK_GOAL,
    sessionGoal,
    sessions: userUpcomingSessions.slice(0, UPCOMING_SESSIONS_DISPLAY_LIMIT).map(toHomeSession),
  };
}

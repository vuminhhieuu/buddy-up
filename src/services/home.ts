import { supabase } from '../config/supabase';
import {
  MS_PER_HOUR,
  MONDAY_OFFSET,
  WEEK_END_OFFSET,
  UPCOMING_DAYS_AHEAD,
  UPCOMING_SESSIONS_DISPLAY_LIMIT,
  WEEKLY_STREAK_GOAL,
  HOURS_FALLBACK,
  RECENT_SESSIONS_LIMIT,
} from '../constants/profile';
import { logger } from '../utils/logger';
import { safeList, safeMaybeSingle, type MaybeSingleResult, type ListResult } from './helpers';

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

// Extended session info with raw status from DB
export type HomeSessionFull = HomeSession & {
  status: 'scheduled' | 'ongoing' | 'completed' | 'canceled' | 'cancelled';
};

export type HomeDashboardData = {
  profileName: string;
  avatarUrl?: string | null;
  streak: number;
  xp: number;
  weeklyStudyHours: number;
  completedSessions: number;
  weeklyGoalDays: number;
  weeklyActiveDays: number;
  sessionGoal: number;
  sessions: HomeSession[];
};

const STREAK_LOOKBACK_DAYS = 30;
const MS_PER_DAY = 86_400_000;
const loggedWarningScopes = new Set<string>();

const logWarning = (scope: string, error: { message: string }) => {
  if (error.message?.toLowerCase().includes('infinite recursion detected')) {
    return;
  }
  if (loggedWarningScopes.has(scope)) return;
  loggedWarningScopes.add(scope);
  console.warn(`[HomeDashboard] ${scope}: ${error.message}`);
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
    const rawHours = (end - start) / MS_PER_HOUR;
    // Nếu buổi học < 1h thì làm tròn tối thiểu 1/3h
    if (rawHours < 1) {
      return Math.max(rawHours, 1 / 3);
    }
    return rawHours;
  }
  return HOURS_FALLBACK;
}

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSessionDateKey = (isoDate: string | null | undefined) => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return getDateKey(date);
};

const calculateStreakFromSessions = (sessions: SupabaseSession[], now: Date) => {
  if (!sessions.length) return 0;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const activityDays = new Set<string>();

  sessions.forEach((session) => {
    if (session.status === 'canceled') return;
    const dateKey = getSessionDateKey(session.scheduled_start);
    if (dateKey) {
      activityDays.add(dateKey);
    }
  });

  let streak = 0;
  const cursor = new Date(today);
  while (activityDays.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const toStartOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const ensureDailyLoginStreak = async (
  userId: string,
  progressRow: ProgressRow | null,
  now: Date,
  lastSignInAt?: string | null,
): Promise<ProgressRow | null> => {
  const today = toStartOfDay(now);
  const todayKey = today.getTime();

  const resolveLastLogin = () => {
    if (progressRow?.last_login_at) {
      const parsed = toStartOfDay(new Date(progressRow.last_login_at));
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    if (lastSignInAt) {
      const parsed = toStartOfDay(new Date(lastSignInAt));
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
  };

  const lastLoginDate = resolveLastLogin();
  const currentStreak = progressRow?.streak ?? 0;
  let nextStreak = currentStreak > 0 ? currentStreak : 1;

  if (lastLoginDate) {
    const diffDays = Math.floor((today.getTime() - lastLoginDate.getTime()) / MS_PER_DAY);
    if (diffDays <= 0) {
      nextStreak = currentStreak > 0 ? currentStreak : 1;
    } else if (diffDays === 1) {
      nextStreak = currentStreak > 0 ? currentStreak + 1 : Math.max(currentStreak, 1) + 1;
    } else {
      nextStreak = 1;
    }
  } else {
    nextStreak = currentStreak > 0 ? currentStreak : 1;
  }

  if (!progressRow) {
    const { data, error } = await supabase
      .from('user_progress')
      .insert({ user_id: userId, streak: nextStreak, last_login_at: now.toISOString() })
      .select('streak, xp, updated_at, last_login_at')
      .single();

    if (error) {
      if (error.code !== '23505') {
        logWarning('progressInsert', error);
        return null;
      }
      const { data: fallback } = await supabase
        .from('user_progress')
        .select('streak, xp, updated_at, last_login_at')
        .eq('user_id', userId)
        .maybeSingle();
      return (fallback as ProgressRow | null) ?? null;
    }

    return data as ProgressRow;
  }

  const lastLoginMatchesToday =
    progressRow.last_login_at &&
    toStartOfDay(new Date(progressRow.last_login_at)).getTime() === todayKey;
  const requiresUpdate = progressRow.streak !== nextStreak || !lastLoginMatchesToday;

  if (!requiresUpdate) {
    return progressRow;
  }

  const { data, error } = await supabase
    .from('user_progress')
    .update({ streak: nextStreak, last_login_at: now.toISOString() })
    .eq('user_id', userId)
    .select('streak, xp, updated_at, last_login_at')
    .single();

  if (error) {
    logWarning('progressUpdate', error);
    return progressRow;
  }

  return data as ProgressRow;
};

const isRelevantSession = (
  session: SupabaseSession,
  participantsMap: Map<string, SessionParticipant[]>,
  userId: string,
) => {
  if (session.creator_id === userId) return true;
  const participants = participantsMap.get(session.id) || [];
  return participants.some(
    (participant) => participant.user_id === userId && participant.status === 'accepted',
  );
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
  updated_at?: string | null;
  last_login_at?: string | null;
};

export async function fetchHomeDashboard(userId: string): Promise<HomeDashboardData> {
  const now = new Date();
  const streakWindowStart = new Date(now);
  streakWindowStart.setDate(streakWindowStart.getDate() - STREAK_LOOKBACK_DAYS);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const upcomingEnd = new Date(now);
  upcomingEnd.setDate(upcomingEnd.getDate() + UPCOMING_DAYS_AHEAD);

  const [
    profileResult,
    progressResult,
    recentSessionsResult,
    upcomingSessionsResult,
    authUserResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_progress')
      .select('streak, xp, updated_at, last_login_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('study_sessions')
      .select('id, title, subject, scheduled_start, scheduled_end, status, creator_id')
      .gte('scheduled_start', streakWindowStart.toISOString())
      .lte('scheduled_start', now.toISOString())
      .order('scheduled_start', { ascending: true }),
    supabase
      .from('study_sessions')
      .select('id, title, subject, scheduled_start, scheduled_end, status, creator_id')
      .gte('scheduled_start', now.toISOString())
      .lte('scheduled_start', upcomingEnd.toISOString())
      .order('scheduled_start', { ascending: true })
      .limit(RECENT_SESSIONS_LIMIT),
    supabase.auth.getUser(),
  ]);

  const profileData = safeMaybeSingle<ProfileRow>(
    profileResult as MaybeSingleResult<ProfileRow>,
    'profile',
  );
  const progressData = safeMaybeSingle<ProgressRow>(
    progressResult as MaybeSingleResult<ProgressRow>,
    'progress',
  );
  const recentSessionsAll = safeList<SupabaseSession>(
    recentSessionsResult as unknown as ListResult<SupabaseSession>,
    'recentSessions',
  );
  const upcomingSessionsAll = safeList<SupabaseSession>(
    upcomingSessionsResult as unknown as ListResult<SupabaseSession>,
    'upcomingSessions',
  );

  const authUserData = (authUserResult as Awaited<ReturnType<typeof supabase.auth.getUser>>).data;
  const lastSignInAt =
    authUserData?.user?.last_sign_in_at ??
    // @ts-expect-error Supabase SDK might expose camelCase in some versions
    authUserData?.user?.lastSignInAt ??
    null;

  const syncedProgress = await ensureDailyLoginStreak(userId, progressData, now, lastSignInAt);

  const combinedSessions = [...recentSessionsAll, ...upcomingSessionsAll] as SupabaseSession[];

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

  const userRecentSessions = recentSessionsAll.filter((session) =>
    isRelevantSession(session as SupabaseSession, participantsMap, userId),
  ) as SupabaseSession[];

  const userWeekSessions = userRecentSessions.filter((session) => {
    if (!session.scheduled_start) return false;
    const sessionDate = new Date(session.scheduled_start);
    if (Number.isNaN(sessionDate.getTime())) return false;
    return (
      sessionDate.getTime() >= weekStart.getTime() && sessionDate.getTime() <= weekEnd.getTime()
    );
  });

  const calculatedStreak = calculateStreakFromSessions(userRecentSessions, now);
  const resolvedStreak = Math.max(syncedProgress?.streak ?? 0, calculatedStreak);

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

  // Only count hours for sessions where this user has marked completed
  const weeklyStudyHours = userWeekSessions.reduce((hours, session) => {
    const participants = participantsMap.get(session.id) || [];
    const userParticipant = participants.find((p) => p.user_id === userId);
    if (userParticipant?.status === 'completed') {
      return hours + calculateDurationHours(session);
    }
    return hours;
  }, 0);

  // Count completed sessions based on user's participant status, not session status
  const completedSessions = userWeekSessions.filter((session) => {
    const participants = participantsMap.get(session.id) || [];
    const userParticipant = participants.find((p) => p.user_id === userId);
    return userParticipant?.status === 'completed';
  }).length;

  // Count all accepted sessions (both recent and upcoming) as the goal
  // Use a Map to deduplicate sessions by ID before counting
  const allUserSessionsMap = new Map<string, SupabaseSession>();
  [...userRecentSessions, ...userUpcomingSessions].forEach((session) => {
    allUserSessionsMap.set(session.id, session);
  });
  const allUserSessions = Array.from(allUserSessionsMap.values());

  const sessionGoal = allUserSessions.filter((session) => {
    const participants = participantsMap.get(session.id) || [];
    const userParticipant = participants.find((p) => p.user_id === userId);
    // Count if user is creator or has accepted
    return session.creator_id === userId || userParticipant?.status === 'accepted';
  }).length;

  const normalizedWeekStart = toStartOfDay(weekStart);
  const normalizedNow = toStartOfDay(now);
  const daysIntoWeek = Math.min(
    WEEKLY_STREAK_GOAL,
    Math.floor((normalizedNow.getTime() - normalizedWeekStart.getTime()) / MS_PER_DAY) + 1,
  );
  const weeklyActiveDays = Math.min(resolvedStreak, daysIntoWeek);

  // Filter out completed sessions and sort by priority: ongoing → upcoming
  const nowTime = now.getTime();
  const DEFAULT_SESSION_DURATION_MS = 60 * 60 * 1000;
  const activeSessions = allUserSessions.filter((session) => {
    const start = new Date(session.scheduled_start).getTime();
    const end = session.scheduled_end
      ? new Date(session.scheduled_end).getTime()
      : start + DEFAULT_SESSION_DURATION_MS;
    // Only show sessions that haven't ended yet
    return nowTime < end;
  });

  const sortedSessions = activeSessions.sort((a, b) => {
    const aStart = new Date(a.scheduled_start).getTime();
    const bStart = new Date(b.scheduled_start).getTime();
    const aEnd = a.scheduled_end
      ? new Date(a.scheduled_end).getTime()
      : aStart + DEFAULT_SESSION_DURATION_MS;
    const bEnd = b.scheduled_end
      ? new Date(b.scheduled_end).getTime()
      : bStart + DEFAULT_SESSION_DURATION_MS;

    // Determine status: ongoing (0), upcoming (1)
    const getStatusPriority = (start: number, end: number) => {
      if (nowTime >= start && nowTime < end) return 0; // ongoing
      return 1; // upcoming
    };

    const aPriority = getStatusPriority(aStart, aEnd);
    const bPriority = getStatusPriority(bStart, bEnd);

    // Sort by status priority first
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Within same status, sort by closest time to now
    if (aPriority === 0) {
      // ongoing: sort by start time (most recent first)
      return bStart - aStart;
    } else {
      // upcoming: sort by start time (soonest first)
      return aStart - bStart;
    }
  });

  return {
    profileName: profileData?.display_name ?? '',
    avatarUrl: profileData?.avatar_url ?? undefined,
    streak: resolvedStreak,
    xp: syncedProgress?.xp ?? 0,
    weeklyStudyHours,
    completedSessions,
    weeklyGoalDays: WEEKLY_STREAK_GOAL,
    weeklyActiveDays,
    sessionGoal,
    sessions: sortedSessions.slice(0, UPCOMING_SESSIONS_DISPLAY_LIMIT).map(toHomeSession),
  };
}

// Fetch all upcoming sessions for the user (no display limit)
export async function fetchUpcomingSessionsAll(userId: string): Promise<HomeSession[]> {
  const now = new Date();
  const upcomingEnd = new Date(now.getTime() + UPCOMING_DAYS_AHEAD * MS_PER_DAY);

  const { data: upcomingSessionsResult, error: upcomingError } = await supabase
    .from('study_sessions')
    .select('id, title, subject, scheduled_start, scheduled_end, status, creator_id')
    .gte('scheduled_start', now.toISOString())
    .lte('scheduled_start', upcomingEnd.toISOString())
    .order('scheduled_start', { ascending: true });

  if (upcomingError) {
    logger.warn('fetchUpcomingSessionsAll', upcomingError.message, upcomingError);
  }

  const upcomingSessionsAll = safeList<SupabaseSession>(
    { data: upcomingSessionsResult, error: upcomingError } as ListResult<SupabaseSession>,
    'upcomingSessionsAll',
  );

  const sessionIds = upcomingSessionsAll.map((s) => s.id);
  const participantsMap = new Map<string, SessionParticipant[]>();
  if (sessionIds.length > 0) {
    const { data: participantsData } = await supabase
      .from('study_session_participants')
      .select('session_id, user_id, status')
      .in('session_id', sessionIds);
    participantsData?.forEach((participant) => {
      const list = participantsMap.get(participant.session_id) || [];
      list.push(participant);
      participantsMap.set(participant.session_id, list);
    });
  }

  const filtered = upcomingSessionsAll
    .filter((session) => isRelevantSession(session as SupabaseSession, participantsMap, userId))
    .sort(
      (a: SupabaseSession, b: SupabaseSession) =>
        new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime(),
    ) as SupabaseSession[];

  const buddyUserIds = new Set<string>();
  filtered.forEach((session) => {
    const buddyId = selectBuddyUserId(session, participantsMap, userId);
    if (buddyId) buddyUserIds.add(buddyId);
  });

  const buddyProfiles = new Map<string, ProfilePreview>();
  if (buddyUserIds.size > 0) {
    const { data: buddyProfilesData, error: buddyProfilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', Array.from(buddyUserIds));
    if (buddyProfilesError) {
      logger.warn(
        'fetchUpcomingSessionsAll.profiles',
        buddyProfilesError.message,
        buddyProfilesError,
      );
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

  return filtered.map(toHomeSession);
}

// Fetch recent (past) and upcoming sessions (future) combined for the user, without display limit
export async function fetchAllSessionsForUser(userId: string): Promise<HomeSessionFull[]> {
  const now = new Date();
  const upcomingEnd = new Date(now.getTime() + UPCOMING_DAYS_AHEAD * MS_PER_DAY);
  const streakWindowStart = new Date(now.getTime() - WEEK_END_OFFSET * MS_PER_DAY);

  // Recent sessions up to now
  const { data: recentSessionsResult, error: recentError } = await supabase
    .from('study_sessions')
    .select('id, title, subject, scheduled_start, scheduled_end, status, creator_id')
    .gte('scheduled_start', streakWindowStart.toISOString())
    .lte('scheduled_start', now.toISOString())
    .order('scheduled_start', { ascending: true });

  if (recentError) {
    logger.warn('fetchAllSessionsForUser.recent', recentError.message, recentError);
  }

  // Upcoming sessions from now to upcomingEnd
  const { data: upcomingSessionsResult, error: upcomingError } = await supabase
    .from('study_sessions')
    .select('id, title, subject, scheduled_start, scheduled_end, status, creator_id')
    .gte('scheduled_start', now.toISOString())
    .lte('scheduled_start', upcomingEnd.toISOString())
    .order('scheduled_start', { ascending: true });

  if (upcomingError) {
    logger.warn('fetchAllSessionsForUser.upcoming', upcomingError.message, upcomingError);
  }

  const recentSessionsAll = safeList<SupabaseSession>(
    { data: recentSessionsResult, error: recentError },
    { data: recentSessionsResult, error: recentError },
    'recentSessionsAll',
  );
  const upcomingSessionsAll = safeList<SupabaseSession>(
    { data: upcomingSessionsResult, error: upcomingError },
    { data: upcomingSessionsResult, error: upcomingError },
    'upcomingSessionsAllFull',
  );

  const combined = [...recentSessionsAll, ...upcomingSessionsAll] as SupabaseSession[];
  const sessionIds = combined.map((s) => s.id);

  // Build participants map
  const participantsMap = new Map<string, SessionParticipant[]>();
  if (sessionIds.length > 0) {
    const { data: participantsData } = await supabase
      .from('study_session_participants')
      .select('session_id, user_id, status')
      .in('session_id', sessionIds);
    participantsData?.forEach((participant) => {
      const list = participantsMap.get(participant.session_id) || [];
      list.push(participant);
      participantsMap.set(participant.session_id, list);
    });
  }

  // Filter sessions relevant to the user
  const filtered = combined
    .filter((session) => isRelevantSession(session as SupabaseSession, participantsMap, userId))
    .sort(
      (a: SupabaseSession, b: SupabaseSession) =>
        new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime(),
    ) as SupabaseSession[];

  // Collect buddy profiles
  const buddyUserIds = new Set<string>();
  filtered.forEach((session) => {
    const buddyId = selectBuddyUserId(session, participantsMap, userId);
    if (buddyId) buddyUserIds.add(buddyId);
  });

  const buddyProfiles = new Map<string, ProfilePreview>();
  if (buddyUserIds.size > 0) {
    const { data: buddyProfilesData, error: buddyProfilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', Array.from(buddyUserIds));
    if (buddyProfilesError) {
      logger.warn(
        'fetchAllSessionsForUser.profiles',
        buddyProfilesError.message,
        buddyProfilesError,
      );
    }
    buddyProfilesData?.forEach((profile) => {
      buddyProfiles.set(profile.user_id, profile);
    });
  }

  const toHomeSessionFull = (session: SupabaseSession): HomeSessionFull => {
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
      status: (session.status as any) ?? 'scheduled',
    };
  };

  return filtered.map(toHomeSessionFull);
}

/**
 * Fetch ALL sessions for user without time limits
 * Returns sessions ordered by scheduled_start descending (newest first)
 */
export async function fetchAllUserSessionsUnfiltered(userId: string): Promise<HomeSessionFull[]> {
  // Get ALL sessions from database
  const { data: allSessionsResult, error: sessionsError } = await supabase
    .from('study_sessions')
    .select('id, title, subject, scheduled_start, scheduled_end, status, creator_id')
    .order('scheduled_start', { ascending: false });

  if (sessionsError) {
    logger.warn('fetchAllUserSessionsUnfiltered.sessions', sessionsError.message, sessionsError);
    return [];
  }

  const allSessions = (allSessionsResult || []) as SupabaseSession[];

  const sessionIds = allSessions.map((s) => s.id);

  // Build participants map
  const participantsMap = new Map<string, SessionParticipant[]>();
  if (sessionIds.length > 0) {
    const { data: participantsData } = await supabase
      .from('study_session_participants')
      .select('session_id, user_id, status')
      .in('session_id', sessionIds);
    participantsData?.forEach((participant) => {
      const list = participantsMap.get(participant.session_id) || [];
      list.push(participant);
      participantsMap.set(participant.session_id, list);
    });
  }

  // Filter sessions relevant to the user
  const filtered = allSessions.filter((session) =>
    isRelevantSession(session as SupabaseSession, participantsMap, userId),
  ) as SupabaseSession[];

  // Collect buddy profiles
  const buddyUserIds = new Set<string>();
  filtered.forEach((session) => {
    const buddyId = selectBuddyUserId(session, participantsMap, userId);
    if (buddyId) buddyUserIds.add(buddyId);
  });

  const buddyProfiles = new Map<string, ProfilePreview>();
  if (buddyUserIds.size > 0) {
    const { data: buddyProfilesData, error: buddyProfilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', Array.from(buddyUserIds));
    if (buddyProfilesError) {
      logger.warn(
        'fetchAllUserSessionsUnfiltered.profiles',
        buddyProfilesError.message,
        buddyProfilesError,
      );
    }
    buddyProfilesData?.forEach((profile) => {
      buddyProfiles.set(profile.user_id, profile);
    });
  }

  const toHomeSessionFull = (session: SupabaseSession): HomeSessionFull => {
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
      status: (session.status as any) ?? 'scheduled',
    };
  };

  return filtered.map(toHomeSessionFull);
}

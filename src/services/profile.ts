import { supabase } from '../config/supabase';
import type { Achievement, Subject, StudyStats, UserProfile } from '../types/profile';

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const BADGE_EMOJI_MAP: Record<string, string> = {
  streak_master: '🔥',
  night_owl: '🦉',
  team_player: '🤝',
  speed_learner: '⚡',
};

const SUBJECT_COLORS: Subject['badgeColor'][] = ['blue', 'orange', 'green'];

const FALLBACK_PROFILE: UserProfile = {
  id: 'unknown',
  name: 'Learner',
  level: 1,
  subtitle: undefined,
  streak: 0,
  totalTime: 0,
  xp: 0,
};

const FALLBACK_STUDY_STATS: StudyStats = {
  weeklyActivity: WEEK_DAYS.map((day) => ({ day, value: 0 })),
  completedSessions: 0,
  averagePerDay: '0h',
};

const FALLBACK_SUBJECTS: Subject[] = [];
const FALLBACK_ACHIEVEMENTS: Achievement[] = [];

const HOURS_PER_SUBJECT_GOAL = 40;

const safeNumber = (value: number | null | undefined) =>
  Number.isFinite(value) ? Number(value) : 0;

/**
 * Calculate session duration in hours
 * @param start - Session start time (ISO string)
 * @param end - Session end time (ISO string). If null, returns 0 to avoid inflating statistics.
 * @param status - Optional session status. If 'ongoing', uses current time as end time.
 * @returns Duration in hours, or 0 if invalid, incomplete, or end time is before start time
 */
const calculateSessionHours = (
  start?: string | null,
  end?: string | null,
  status?: string | null,
) => {
  if (!start) return 0;
  const startDate = new Date(start);
  if (isNaN(startDate.getTime())) return 0;

  let endDate: Date;
  if (end) {
    endDate = new Date(end);
    if (isNaN(endDate.getTime())) return 0;
    if (endDate.getTime() <= startDate.getTime()) return 0;
  } else if (status === 'ongoing') {
    endDate = new Date();
    if (endDate.getTime() <= startDate.getTime()) return 0;
  } else {
    return 0;
  }

  const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  return diff > 0 ? diff : 0;
};

const mapBadgeToEmoji = (badgeId: string, index: number) =>
  BADGE_EMOJI_MAP[badgeId] || ['🏅', '🎖️', '⭐️'][index % 3];

export type ProfileScreenData = {
  profile: UserProfile;
  achievements: Achievement[];
  subjects: Subject[];
  studyStats: StudyStats;
};

export async function fetchProfileOverview(userId: string): Promise<UserProfile> {
  try {
    const [{ data: profileRow, error: profileError }, { data: progressRow, error: progressError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('display_name,bio,avatar_url')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_progress')
          .select('level,xp,streak')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('[fetchProfileOverview] profile error:', profileError);
    }
    if (progressError && progressError.code !== 'PGRST116') {
      console.warn('[fetchProfileOverview] progress error:', progressError);
    }

    const sessionsResponse = await supabase
      .from('study_sessions')
      .select('scheduled_start,scheduled_end,status')
      .eq('creator_id', userId);

    if (sessionsResponse.error) {
      console.warn('[fetchProfileOverview] sessions error:', sessionsResponse.error);
    }

    const sessions = sessionsResponse.data ?? [];
    const totalHours = sessions.reduce(
      (sum, session) =>
        sum + calculateSessionHours(session.scheduled_start, session.scheduled_end, session.status),
      0,
    );

    return {
      id: userId,
      name: profileRow?.display_name ?? '',
      email: undefined,
      avatarUri: profileRow?.avatar_url ?? undefined,
      level: progressRow?.level ?? 1,
      subtitle: profileRow?.bio || undefined,
      streak: progressRow?.streak ?? 0,
      totalTime: Number(totalHours.toFixed(1)),
      xp: progressRow?.xp ?? 0,
    };
  } catch (error) {
    console.warn('[fetchProfileOverview] Failed:', error);
    return {
      ...FALLBACK_PROFILE,
      id: userId,
      name: '',
    };
  }
}

export async function fetchAchievements(userId: string): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_id,obtained_at,badges(name,description)')
      .eq('user_id', userId)
      .order('obtained_at', { ascending: false });

    if (error) throw error;
    if (!data) return FALLBACK_ACHIEVEMENTS;

    return data.map((row, index) => {
      const badge = Array.isArray(row.badges) ? row.badges[0] : row.badges;
      return {
        id: row.badge_id,
        name: badge?.name || row.badge_id,
        description: badge?.description || '',
        emoji: mapBadgeToEmoji(row.badge_id, index),
        progress: 100,
        completed: true,
        completedAt: row.obtained_at ? new Date(row.obtained_at) : undefined,
      };
    });
  } catch (error) {
    console.error('[fetchAchievements] Failed:', error);
    return FALLBACK_ACHIEVEMENTS;
  }
}

export async function fetchSubjects(userId: string): Promise<Subject[]> {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('subject,scheduled_start,scheduled_end,status')
      .eq('creator_id', userId)
      .not('subject', 'is', null);

    if (error) throw error;
    if (!data) return FALLBACK_SUBJECTS;

    const subjectMap = new Map<
      string,
      {
        totalHours: number;
      }
    >();

    data.forEach((session) => {
      if (!session.subject) return;
      const hours = calculateSessionHours(
        session.scheduled_start,
        session.scheduled_end,
        session.status,
      );
      const current = subjectMap.get(session.subject) ?? { totalHours: 0 };
      current.totalHours += hours;
      subjectMap.set(session.subject, current);
    });

    return Array.from(subjectMap.entries()).map(([name, info], index) => ({
      id: `${userId}-${name}`,
      name,
      badgeColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
      totalHours: Number(info.totalHours.toFixed(1)),
      progress: Math.min(100, Math.round((info.totalHours / HOURS_PER_SUBJECT_GOAL) * 100)),
    }));
  } catch (error) {
    console.warn('[fetchSubjects] Failed:', error);
    return FALLBACK_SUBJECTS;
  }
}

export async function fetchStudyStats(userId: string): Promise<StudyStats> {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('scheduled_start,scheduled_end,status')
      .eq('creator_id', userId);

    if (error) {
      if (error.code === '42P17') {
        console.warn('[fetchStudyStats] Policy prevented access, returning fallback');
        return FALLBACK_STUDY_STATS;
      }
      throw error;
    }
    if (!data) return FALLBACK_STUDY_STATS;

    const activityMap = new Map<string, number>();
    WEEK_DAYS.forEach((day) => activityMap.set(day, 0));

    let completedSessions = 0;
    let totalHours = 0;

    data.forEach((session) => {
      const hours = calculateSessionHours(
        session.scheduled_start,
        session.scheduled_end,
        session.status,
      );
      totalHours += hours;
      if (session.status === 'completed') completedSessions += 1;
      if (!session.scheduled_start) return;

      const startDate = new Date(session.scheduled_start);
      if (isNaN(startDate.getTime())) return;

      const weekday = startDate.getDay();
      const mappedDay = WEEK_DAYS[(weekday + 6) % 7];
      activityMap.set(mappedDay, safeNumber(activityMap.get(mappedDay)) + hours);
    });

    const activityEntries = Array.from(activityMap.entries());
    const maxActivity = Math.max(...activityEntries.map(([, value]) => value), 1);

    return {
      weeklyActivity: WEEK_DAYS.map((day) => ({
        day,
        value: Math.min(100, Math.round((safeNumber(activityMap.get(day)) / maxActivity) * 100)),
      })),
      completedSessions,
      averagePerDay: `${(totalHours / 7).toFixed(1)}h`,
    };
  } catch (error) {
    console.warn('[fetchStudyStats] Failed:', error);
    return FALLBACK_STUDY_STATS;
  }
}

export async function fetchProfileScreenData(userId: string): Promise<ProfileScreenData> {
  const [profile, achievements, subjects, studyStats] = await Promise.all([
    fetchProfileOverview(userId),
    fetchAchievements(userId),
    fetchSubjects(userId),
    fetchStudyStats(userId),
  ]);

  return {
    profile,
    achievements,
    subjects,
    studyStats,
  };
}

export async function updateProfileAvatar(userId: string, avatarUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) {
    throw error;
  }
}

/**
 * Upload avatar image to Supabase Storage
 * @param userId - User ID
 * @param imageUri - Local image URI
 * @returns avatarUrl - Public URL of uploaded image
 */
export async function uploadAvatarToStorage(userId: string, imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const fileName = `${userId}_${Date.now()}.jpg`;
    const { error, data } = await supabase.storage.from('avatars').upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    throw new Error(
      `Failed to upload avatar: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

/**
 * Update user profile in database
 * @param userId - User ID
 * @param displayName - User display name
 * @param studyGoal - User study goal
 * @param avatarUrl - Avatar public URL
 */
export async function updateProfileStep1(
  userId: string,
  displayName: string,
  studyGoal: string,
  avatarUrl?: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio: studyGoal,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
  } catch (err) {
    throw new Error(
      `Failed to update profile: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

/**
 * Get user profile data
 * @param userId - User ID
 */
export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Fetch failed: ${error.message}`);
    }

    return data;
  } catch (err) {
    throw new Error(
      `Failed to fetch profile: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

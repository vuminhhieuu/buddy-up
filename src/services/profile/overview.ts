/**
 * Profile Overview
 * Functions for fetching profile overview data
 */

import { supabase } from '../../config/supabase';
import type { UserProfile, Achievement, Subject, StudyStats } from '../../types/profile';
import { logger } from '../../utils/logger';
import { FALLBACK_PROFILE } from '../../constants/profile';
import { isPgrst116Error, formatErrorMessage } from '../helpers';
import { calculateSessionHours } from './utils';
import { fetchAchievements } from './achievements';
import { fetchSubjects } from './subjects';
import { fetchStudyStats } from './stats';

export type ProfileScreenData = {
  profile: UserProfile;
  achievements: Achievement[];
  subjects: Subject[];
  studyStats: StudyStats;
};

/**
 * Fetch profile overview data
 */
export async function fetchProfileOverview(userId: string): Promise<UserProfile> {
  try {
    const [{ data: profileRow, error: profileError }, { data: progressRow, error: progressError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('display_name,bio,avatar_url,interests')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_progress')
          .select('level,xp,streak')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

    if (profileError && !isPgrst116Error(profileError)) {
      logger.warn('fetchProfileOverview', 'profile error:', profileError);
    }
    if (progressError && !isPgrst116Error(progressError)) {
      logger.warn('fetchProfileOverview', 'progress error:', progressError);
    }

    const sessionsResponse = await supabase
      .from('study_sessions')
      .select('scheduled_start,scheduled_end,status')
      .eq('creator_id', userId);

    if (sessionsResponse.error) {
      logger.warn('fetchProfileOverview', 'sessions error:', sessionsResponse.error);
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
      interests: profileRow?.interests ?? [],
    };
  } catch (error) {
    logger.warn('fetchProfileOverview', 'Failed:', error);
    return {
      ...FALLBACK_PROFILE,
      id: userId,
      name: '',
    };
  }
}

/**
 * Fetch all profile screen data (overview, achievements, subjects, stats)
 */
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

/**
 * Get user profile data
 */
export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Fetch failed: ${formatErrorMessage(error)}`);
    }

    return data;
  } catch (err) {
    throw new Error(`Failed to fetch profile: ${formatErrorMessage(err)}`);
  }
}

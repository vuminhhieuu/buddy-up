/**
 * Profile Study Stats
 * Functions for fetching user study statistics
 */

import { supabase } from '../../config/supabase';
import type { StudyStats } from '../../types/profile';
import { logger } from '../../utils/logger';
import {
  FALLBACK_STUDY_STATS,
  WEEK_DAYS,
  PROGRESS_MAX_PERCENTAGE,
  MONDAY_OFFSET,
  DAYS_IN_WEEK,
  TIME_FORMAT_HOURS,
} from '../../constants/profile';
import { isPolicyRecursion } from '../helpers';
import { calculateSessionHours, safeNumber } from './utils';

/**
 * Fetch user study statistics
 */
export async function fetchStudyStats(userId: string): Promise<StudyStats> {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('scheduled_start,scheduled_end,status')
      .eq('creator_id', userId);

    if (error) {
      if (isPolicyRecursion(error)) {
        logger.warn('fetchStudyStats', 'Policy prevented access, returning fallback');
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
      const mappedDay = WEEK_DAYS[(weekday + MONDAY_OFFSET) % WEEK_DAYS.length];
      activityMap.set(mappedDay, safeNumber(activityMap.get(mappedDay)) + hours);
    });

    const activityEntries = Array.from(activityMap.entries());
    const maxActivity = Math.max(...activityEntries.map(([, value]) => value), 1);

    return {
      weeklyActivity: WEEK_DAYS.map((day) => ({
        day,
        value: Math.min(
          PROGRESS_MAX_PERCENTAGE,
          Math.round((safeNumber(activityMap.get(day)) / maxActivity) * PROGRESS_MAX_PERCENTAGE),
        ),
      })),
      completedSessions,
      averagePerDay: `${(totalHours / DAYS_IN_WEEK).toFixed(1)}${TIME_FORMAT_HOURS}`,
    };
  } catch (error) {
    logger.warn('fetchStudyStats', 'Failed:', error);
    return FALLBACK_STUDY_STATS;
  }
}

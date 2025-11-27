/**
 * Profile Subjects
 * Functions for fetching user study subjects
 */

import { supabase } from '../../config/supabase';
import type { Subject } from '../../types/profile';
import { logger } from '../../utils/logger';
import {
  FALLBACK_SUBJECTS,
  SUBJECT_COLORS,
  HOURS_PER_SUBJECT_GOAL,
  PROGRESS_MAX_PERCENTAGE,
} from '../../constants/profile';
import { calculateSessionHours } from './utils';

/**
 * Fetch user subjects with study hours
 */
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
      progress: Math.min(
        PROGRESS_MAX_PERCENTAGE,
        Math.round((info.totalHours / HOURS_PER_SUBJECT_GOAL) * PROGRESS_MAX_PERCENTAGE),
      ),
    }));
  } catch (error) {
    logger.warn('fetchSubjects', 'Failed:', error);
    return FALLBACK_SUBJECTS;
  }
}

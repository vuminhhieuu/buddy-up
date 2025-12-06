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

    // Use a normalized key (trim + lowercase) to avoid duplicated subjects
    // that differ only by whitespace or case (e.g., "Toán" vs " Toán ").
    const subjectMap = new Map<
      string,
      {
        displayName: string;
        totalHours: number;
      }
    >();

    data.forEach((session) => {
      if (!session.subject) return;
      const raw = String(session.subject ?? '').trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      const hours = calculateSessionHours(
        session.scheduled_start,
        session.scheduled_end,
        session.status,
      );
      const current = subjectMap.get(key) ?? { displayName: raw, totalHours: 0 };
      current.totalHours += hours;
      subjectMap.set(key, current);
    });

    return Array.from(subjectMap.entries()).map(([key, info], index) => ({
      id: `${userId}-${key}`,
      name: info.displayName,
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

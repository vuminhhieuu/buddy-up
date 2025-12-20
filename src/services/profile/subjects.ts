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
    // Fetch all sessions and participant data
    const [
      { data: sessionsData, error: sessionsError },
      { data: participantsData, error: participantsError },
    ] = await Promise.all([
      supabase
        .from('study_sessions')
        .select('id,subject,scheduled_start,scheduled_end,status,creator_id')
        .not('subject', 'is', null),
      supabase
        .from('study_session_participants')
        .select('session_id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
    ]);

    if (sessionsError) throw sessionsError;
    if (participantsError) throw participantsError;
    if (!sessionsData) return FALLBACK_SUBJECTS;

    const attendedSessionIds = new Set((participantsData || []).map((p: any) => p.session_id));

    // Use a normalized key (trim + lowercase) to avoid duplicated subjects
    // that differ only by whitespace or case (e.g., "Toán" vs " Toán ").
    const subjectMap = new Map<
      string,
      {
        displayName: string;
        totalHours: number;
        attendedHours: number;
      }
    >();

    sessionsData
      .filter((session) => session.creator_id === userId || attendedSessionIds.has(session.id))
      .forEach((session) => {
        if (!session.subject) return;
        const raw = String(session.subject ?? '').trim();
        if (!raw) return;
        const key = raw.toLowerCase();
        const hours = calculateSessionHours(
          session.scheduled_start,
          session.scheduled_end,
          session.status,
        );
        const current = subjectMap.get(key) ?? {
          displayName: raw,
          totalHours: 0,
          attendedHours: 0,
        };
        current.totalHours += hours;

        // If user attended this session, add to attendedHours
        if (attendedSessionIds.has(session.id)) {
          current.attendedHours += hours;
        }
        subjectMap.set(key, current);
      });

    return Array.from(subjectMap.entries()).map(([key, info], index) => {
      // Progress here reflects % giờ đã tham gia trên tổng giờ của các buổi liên quan đến người dùng.
      const progress =
        info.totalHours > 0
          ? Math.min(
              PROGRESS_MAX_PERCENTAGE,
              Math.round((info.attendedHours / info.totalHours) * 100),
            )
          : 0;

      return {
        id: `${userId}-${key}`,
        name: info.displayName,
        badgeColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
        totalHours: Number(info.totalHours.toFixed(1)),
        attendedHours: Number(info.attendedHours.toFixed(1)),
        progress,
      };
    });
  } catch (error) {
    logger.warn('fetchSubjects', 'Failed:', error);
    return FALLBACK_SUBJECTS;
  }
}

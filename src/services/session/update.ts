import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { updateSessionRemindersSchedule } from './reminders';

export type UpdateSessionPayload = {
  title?: string;
  subject?: string | null;
  scheduled_start?: string;
  scheduled_end?: string | null;
  location?: string | null;
  description?: string | null;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
};

/**
 * Update a session. If scheduled_start changed, trigger RPC to recompute reminders schedule.
 */
export async function updateSession(
  sessionId: string,
  payload: UpdateSessionPayload,
): Promise<{ data: any | null; error: any | null }> {
  try {
    // Fetch current session to detect scheduled_start change
    const { data: existing, error: fetchErr } = await supabase
      .from('study_sessions')
      .select('scheduled_start')
      .eq('id', sessionId)
      .single();
    if (fetchErr) {
      logger.warn('updateSession', 'Failed to fetch existing session', fetchErr);
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      logger.error('updateSession', 'Error updating session', error);
      return { data: null, error };
    }

    // If scheduled_start changed, call RPC to update reminders schedule
    try {
      if (
        payload.scheduled_start &&
        existing &&
        existing.scheduled_start !== payload.scheduled_start
      ) {
        await updateSessionRemindersSchedule(sessionId);
      }
    } catch (e) {
      logger.warn('updateSession', 'Failed to update session reminders schedule', e);
    }

    return { data, error: null };
  } catch (err) {
    logger.error('updateSession', 'Unexpected error', err);
    return { data: null, error: err };
  }
}

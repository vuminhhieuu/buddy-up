import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';

/**
 * Create or update session reminders server-side (calls RPC)
 */
export async function createOrUpdateSessionReminders(sessionId: string) {
  try {
    const { data, error } = await supabase.rpc('insert_session_reminders', {
      p_session_id: sessionId,
    });
    if (error) {
      logger.warn('createOrUpdateSessionReminders', 'RPC error:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    logger.error('createOrUpdateSessionReminders', 'Unexpected error:', err);
    return { success: false, error: err };
  }
}

export async function updateSessionRemindersSchedule(sessionId: string) {
  try {
    const { data, error } = await supabase.rpc('update_session_reminders_schedule', {
      p_session_id: sessionId,
    });
    if (error) {
      logger.warn('updateSessionRemindersSchedule', 'RPC error:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    logger.error('updateSessionRemindersSchedule', 'Unexpected error:', err);
    return { success: false, error: err };
  }
}

export async function deleteSessionReminders(sessionId: string) {
  try {
    const { error } = await supabase.from('session_reminders').delete().eq('session_id', sessionId);
    if (error) {
      logger.warn('deleteSessionReminders', 'Delete error:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    logger.error('deleteSessionReminders', 'Unexpected error:', err);
    return { success: false, error: err };
  }
}

export async function deleteSessionReminderForUser(sessionId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('session_reminders')
      .delete()
      .eq('session_id', sessionId)
      .eq('recipient_id', userId);
    if (error) {
      logger.warn('deleteSessionReminderForUser', 'Delete error:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    logger.error('deleteSessionReminderForUser', 'Unexpected error:', err);
    return { success: false, error: err };
  }
}

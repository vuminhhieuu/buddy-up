import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';

export type CreateStudySessionPayload = {
  title: string;
  subject?: string | null;
  scheduled_start: string;
  scheduled_end?: string | null;
  creator_id: string;
  location?: string | null;
  description?: string | null;
};

/**
 * Result returned from createStudySession.
 * - `data` is the created session row when the session insert succeeded.
 * - `error` is the error from attempting to create the session itself (fatal).
 * - `participantError` is an optional warning-level error describing any
 *   failure that happened while inserting participants. The function will
 *   still return the created session in `data` when participant insertion
 *   fails; callers should check `participantError` to detect this partial
 *   failure.
 */
export type CreateStudySessionResult = {
  data: any | null;
  error: any | null;
  participantError?: any | null;
};

export async function createStudySession(
  payload: CreateStudySessionPayload,
  participantIds?: string[],
): Promise<CreateStudySessionResult> {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        title: payload.title,
        subject: payload.subject ?? null,
        scheduled_start: payload.scheduled_start,
        scheduled_end: payload.scheduled_end ?? null,
        creator_id: payload.creator_id,
        location: payload.location ?? null,
        description: payload.description ?? null,
      })
      .select('*')
      .single();

    if (error) {
      logger.error('createStudySession', error.message, error);
      console.error('createStudySession returned error payload:', error);
      return { data: null, error } as const;
    }

    let participantError: any | null = null;
    if (participantIds && participantIds.length > 0) {
      const items = participantIds.map((user_id) => ({
        session_id: (data as any).id,
        user_id,
        status: 'invited',
      }));
      const { error: partsError } = await supabase.from('study_session_participants').insert(items);
      if (partsError) {
        participantError = partsError;
        logger.warn('createStudySession.participants', partsError.message, partsError);
      }
    }

    // Create session reminders server-side via RPC to ensure scheduled_at
    // is computed by the database (scheduled_start - interval '10 minutes').
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('insert_session_reminders', {
        p_session_id: (data as any).id,
      });
      if (rpcErr) {
        logger.warn('createStudySession.reminders.rpc', rpcErr.message, rpcErr);
      }
    } catch (rErr) {
      logger.error(
        'createStudySession.reminders',
        'Unexpected error creating reminders via RPC',
        rErr,
      );
    }

    // Return the created session. If participant insertion failed we return
    // the session in `data` but include `participantError` so callers can
    // detect the partial failure and react accordingly.
    return { data, error: null, participantError } as CreateStudySessionResult;
  } catch (err: any) {
    logger.error('createStudySession', 'Unexpected error', err);
    return { data: null, error: err } as const;
  }
}

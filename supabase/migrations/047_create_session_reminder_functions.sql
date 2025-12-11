-- ============================================================================
-- Migration: 047_create_session_reminder_functions.sql
-- Description: Create helper RPC functions to manage session_reminders
-- ============================================================================

-- Function: insert_session_reminders(p_session_id UUID)
-- Inserts reminders for all participants of a session and the creator.
-- Upserts (on conflict) to update scheduled_at when needed.
CREATE OR REPLACE FUNCTION public.insert_session_reminders(p_session_id uuid)
RETURNS void AS $$
DECLARE
  s RECORD;
BEGIN
  SELECT id, creator_id, scheduled_start INTO s FROM public.study_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE NOTICE 'Session % not found', p_session_id;
    RETURN;
  END IF;

  -- Insert/Upsert reminders for participants
  INSERT INTO public.session_reminders (session_id, recipient_id, scheduled_at, created_at, updated_at)
  SELECT
    p_session_id AS session_id,
    usp.user_id AS recipient_id,
    (s.scheduled_start - INTERVAL '10 minutes') AS scheduled_at,
    now() AS created_at,
    now() AS updated_at
  FROM public.study_session_participants usp
  WHERE usp.session_id = p_session_id
  ON CONFLICT (session_id, recipient_id)
  DO UPDATE SET scheduled_at = EXCLUDED.scheduled_at, updated_at = now();

  -- Ensure creator has a reminder as well
  INSERT INTO public.session_reminders (session_id, recipient_id, scheduled_at, created_at, updated_at)
  VALUES (p_session_id, s.creator_id, (s.scheduled_start - INTERVAL '10 minutes'), now(), now())
  ON CONFLICT (session_id, recipient_id)
  DO UPDATE SET scheduled_at = EXCLUDED.scheduled_at, updated_at = now();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: update_session_reminders_schedule(p_session_id UUID)
-- Recomputes scheduled_at for all reminders of the session based on session start.
CREATE OR REPLACE FUNCTION public.update_session_reminders_schedule(p_session_id uuid)
RETURNS void AS $$
DECLARE
  s RECORD;
BEGIN
  SELECT id, scheduled_start INTO s FROM public.study_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE NOTICE 'Session % not found', p_session_id;
    RETURN;
  END IF;

  UPDATE public.session_reminders
  SET scheduled_at = (s.scheduled_start - INTERVAL '10 minutes'), updated_at = now()
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add processing columns and create an atomic reservation RPC for due reminders
-- 1) Add columns to session_reminders
-- 2) Provide a plpgsql function `reserve_due_reminders(p_limit integer)`

BEGIN;

ALTER TABLE IF EXISTS public.session_reminders
  ADD COLUMN IF NOT EXISTS processing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

CREATE OR REPLACE FUNCTION public.reserve_due_reminders(p_limit integer)
RETURNS TABLE(id uuid, session_id uuid, recipient_id uuid, scheduled_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH cte AS (
    SELECT id
    FROM public.session_reminders
    WHERE sent = false AND processing = false AND scheduled_at <= now()
    ORDER BY scheduled_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.session_reminders s
  SET processing = true, locked_at = now()
  FROM cte
  WHERE s.id = cte.id
  RETURNING s.id, s.session_id, s.recipient_id, s.scheduled_at;
END;
$$;

COMMIT;

-- ============================================================================
-- Migration: 048_add_session_reminder_triggers.sql
-- Description: Add triggers to auto-manage session reminders
-- Purpose:
--   - Auto-create reminders when new session is created
--   - Auto-update reminders when session time changes (with sent flag reset)
--   - Auto-cleanup reminders when session is deleted
-- Dependencies:
--   - public.study_sessions (table)
--   - public.session_reminders (table from migration 046)
--   - public.insert_session_reminders() (function from migration 047)
-- ============================================================================

-- ============================================================================
-- Trigger 1: Auto create reminders when INSERT session
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_create_reminders_on_session_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if session starts more than 10 minutes from now
  IF NEW.scheduled_start > (now() + INTERVAL '10 minutes') THEN
    -- Call existing helper function to create reminders for creator + accepted participants
    PERFORM public.insert_session_reminders(NEW.id);
    RAISE NOTICE 'Created reminders for session % (scheduled at %)', NEW.id, NEW.scheduled_start;
  ELSE
    RAISE NOTICE 'Session % starts too soon (%), skipping reminder creation', NEW.id, NEW.scheduled_start;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.trigger_create_reminders_on_session_insert() 
  IS 'Trigger function: Auto-creates reminders when new session is inserted (if scheduled_start > now + 10 min)';

-- Create trigger
DROP TRIGGER IF EXISTS session_insert_create_reminders ON public.study_sessions;

CREATE TRIGGER session_insert_create_reminders
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_reminders_on_session_insert();

COMMENT ON TRIGGER session_insert_create_reminders ON public.study_sessions 
  IS 'Auto-creates reminders when new session is created';


-- ============================================================================
-- Trigger 2: Auto update reminders when UPDATE session time
-- IMPORTANT: Resets sent flag to allow resending notification at new time
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_update_reminders_on_session_update()
RETURNS TRIGGER AS $$
DECLARE
  new_scheduled_at timestamptz;
  affected_count INTEGER;
BEGIN
  -- Only run if scheduled_start changed
  IF NEW.scheduled_start IS DISTINCT FROM OLD.scheduled_start THEN
    RAISE NOTICE 'Session % time changed from % to %', NEW.id, OLD.scheduled_start, NEW.scheduled_start;
    
    -- Calculate new scheduled_at (10 minutes before session start)
    new_scheduled_at := NEW.scheduled_start - INTERVAL '10 minutes';
    
    -- Check if new time is valid (more than 10 minutes from now)
    IF NEW.scheduled_start > (now() + INTERVAL '10 minutes') THEN
      -- Update existing reminders: reset sent flag and update scheduled_at
      UPDATE public.session_reminders
      SET 
        scheduled_at = new_scheduled_at,
        sent = false,  -- Reset sent flag to allow resending
        sent_at = NULL,  -- Clear sent timestamp
        updated_at = now()
      WHERE session_id = NEW.id;
      
      GET DIAGNOSTICS affected_count = ROW_COUNT;
      
      RAISE NOTICE 'Updated and reset % reminders for session % (new time: %)', 
        affected_count, NEW.id, new_scheduled_at;
    ELSE
      -- New time is too soon (< 10 minutes), mark reminders as sent (won't send)
      UPDATE public.session_reminders
      SET 
        sent = true,
        updated_at = now()
      WHERE session_id = NEW.id AND sent = false;
      
      GET DIAGNOSTICS affected_count = ROW_COUNT;
      
      RAISE NOTICE 'Session % starts too soon, marked % reminders as sent (will not send)', 
        NEW.id, affected_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.trigger_update_reminders_on_session_update() 
  IS 'Trigger function: Auto-updates reminder times and resets sent flag when session scheduled_start changes';

-- Create trigger
DROP TRIGGER IF EXISTS session_update_reschedule_reminders ON public.study_sessions;

CREATE TRIGGER session_update_reschedule_reminders
  AFTER UPDATE OF scheduled_start ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_reminders_on_session_update();

COMMENT ON TRIGGER session_update_reschedule_reminders ON public.study_sessions 
  IS 'Auto-updates reminder times when session time changes';


-- ============================================================================
-- Trigger 3: Mark reminders as sent when DELETE session (to prevent sending)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_cleanup_reminders_on_session_delete()
RETURNS TRIGGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Mark all pending reminders as sent (to prevent sending)
  -- We use sent=true instead of deleting because:
  -- 1. Preserve audit trail
  -- 2. Foreign key constraint allows ON DELETE CASCADE, but we want explicit control
  UPDATE public.session_reminders
  SET 
    sent = true, 
    sent_at = now(), 
    updated_at = now()
  WHERE session_id = OLD.id 
    AND sent = false;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  IF affected_count > 0 THEN
    RAISE NOTICE 'Marked % pending reminders as sent for deleted session %', affected_count, OLD.id;
  ELSE
    RAISE NOTICE 'No pending reminders found for deleted session %', OLD.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.trigger_cleanup_reminders_on_session_delete() 
  IS 'Trigger function: Marks pending reminders as sent when session is deleted to prevent sending';

-- Create trigger
DROP TRIGGER IF EXISTS session_delete_cleanup_reminders ON public.study_sessions;

CREATE TRIGGER session_delete_cleanup_reminders
  BEFORE DELETE ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cleanup_reminders_on_session_delete();

COMMENT ON TRIGGER session_delete_cleanup_reminders ON public.study_sessions 
  IS 'Marks reminders as sent when session is deleted to prevent sending';


-- ============================================================================
-- Verification queries (commented out - for manual testing)
-- ============================================================================

-- To test trigger 1 (create):
-- INSERT INTO public.study_sessions (creator_id, title, scheduled_start, status)
-- VALUES ('YOUR_USER_ID', 'Test Session', now() + INTERVAL '15 minutes', 'scheduled');
-- SELECT * FROM public.session_reminders ORDER BY created_at DESC LIMIT 5;

-- To test trigger 2 (update):
-- 1. Create session and wait for reminder to be sent (or manually mark sent = true)
-- UPDATE public.session_reminders SET sent = true, sent_at = now() WHERE session_id = 'YOUR_SESSION_ID';
-- 2. Update session time
-- UPDATE public.study_sessions SET scheduled_start = now() + INTERVAL '30 minutes' WHERE id = 'YOUR_SESSION_ID';
-- 3. Check reminder reset
-- SELECT sent, sent_at, scheduled_at FROM public.session_reminders WHERE session_id = 'YOUR_SESSION_ID';
-- Expected: sent = false, sent_at = NULL

-- To test trigger 3 (delete):
-- DELETE FROM public.study_sessions WHERE id = 'YOUR_SESSION_ID';
-- SELECT * FROM public.session_reminders WHERE session_id = 'YOUR_SESSION_ID';

-- ============================================================================
-- End of migration
-- ============================================================================

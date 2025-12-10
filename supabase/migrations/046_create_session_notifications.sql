-- ============================================================================
-- Migration: 046_create_session_notifications.sql
-- Description: Create tables for session reminders, reminder send logs and in-app
--              notifications.
-- Purpose:
--   - `session_reminders`: one reminder row per (study_session, recipient) with
--     scheduled_at = study_sessions.scheduled_start - interval '10 minutes'.
--   - `session_reminder_logs`: records send attempts (sent/failed) for auditing.
--   - `notifications`: generic in-app notifications stored per user (read/unread).
-- Dependencies:
--   - public.study_sessions (table created in 007_create_study_sessions.sql)
--   - public.profiles (uses profiles.user_id as PK)
-- Notes:
--   - Uses timestamptz for timezone-safe scheduling.
--   - Adds indexes on scheduled_at and created_at for efficient scheduling & listing.
--   - If DB uses Row-Level Security (RLS), add appropriate policies for these tables.
--   - This migration does NOT implement sending logic; scheduler/edge function will
--     insert logs/notifications and mark reminders as sent.
-- ============================================================================

-- Table: session_reminders
CREATE TABLE public.session_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT session_reminders_session_fkey FOREIGN KEY (session_id) REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  CONSTRAINT session_reminders_recipient_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

-- Ensure no duplicate reminder per user per session
CREATE UNIQUE INDEX session_reminders_session_recipient_uniq ON public.session_reminders(session_id, recipient_id);

-- Index to efficiently query upcoming reminders
CREATE INDEX session_reminders_scheduled_at_idx ON public.session_reminders(scheduled_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_session_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_reminders_updated_at
  BEFORE UPDATE ON public.session_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_reminders_updated_at();


-- Table: session_reminder_logs
CREATE TABLE public.session_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NULL,
  session_id uuid NULL,
  recipient_id uuid NULL,
  status text NOT NULL,
  payload jsonb,
  error_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT session_reminder_logs_reminder_fkey FOREIGN KEY (reminder_id) REFERENCES public.session_reminders(id) ON DELETE SET NULL
);

CREATE INDEX session_reminder_logs_session_idx ON public.session_reminder_logs(session_id);
CREATE INDEX session_reminder_logs_recipient_idx ON public.session_reminder_logs(recipient_id);


-- Table: notifications (generic in-app notifications)
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text,
  body text,
  data jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX notifications_user_read_idx ON public.notifications(user_id, read);
CREATE INDEX notifications_created_idx ON public.notifications(created_at);

-- Trigger to update updated_at for notifications
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notifications_updated_at();

-- Comments
COMMENT ON TABLE public.session_reminders IS 'Scheduled reminders for sessions (one row per recipient)';
COMMENT ON TABLE public.session_reminder_logs IS 'Logs of reminder send attempts';
COMMENT ON TABLE public.notifications IS 'Generic in-app notifications stored for users';
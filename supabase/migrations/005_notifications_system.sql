-- ============================================================================
-- Migration: 005_notifications_system.sql
-- Description: Complete notification system with push tokens, preferences, session reminders, and triggers
-- Dependencies: 001_core_database_schema.sql, 002_row_level_security.sql, 003_profiles_extensions.sql, 004_study_groups_system.sql
-- ============================================================================

-- ============================================================================
-- PUSH TOKENS TABLE
-- ============================================================================

-- Push tokens table
-- Stores Expo push tokens for each user device
CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  device_id text, -- Optional: để identify device (có thể dùng để update token thay vì tạo mới)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.push_tokens IS 'Stores Expo push tokens for user devices';
COMMENT ON COLUMN public.push_tokens.user_id IS 'User who owns this device';
COMMENT ON COLUMN public.push_tokens.token IS 'Expo push token (ExponentPushToken[...])';
COMMENT ON COLUMN public.push_tokens.platform IS 'Platform: ios or android';
COMMENT ON COLUMN public.push_tokens.device_id IS 'Optional device identifier';

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================

-- Notification preferences table
-- Stores user preferences for different notification types
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_enabled boolean NOT NULL DEFAULT true,
  buddy_enabled boolean NOT NULL DEFAULT true,
  session_enabled boolean NOT NULL DEFAULT true,
  achievement_enabled boolean NOT NULL DEFAULT true,
  sound_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.notification_preferences IS 'User notification preferences';
COMMENT ON COLUMN public.notification_preferences.chat_enabled IS 'Enable chat message notifications';
COMMENT ON COLUMN public.notification_preferences.buddy_enabled IS 'Enable buddy request notifications';
COMMENT ON COLUMN public.notification_preferences.session_enabled IS 'Enable session reminder notifications';
COMMENT ON COLUMN public.notification_preferences.achievement_enabled IS 'Enable achievement notifications';
COMMENT ON COLUMN public.notification_preferences.sound_enabled IS 'Enable notification sounds';

-- ============================================================================
-- SESSION REMINDERS TABLE
-- ============================================================================

-- Table: session_reminders
-- One reminder row per (study_session, recipient) with scheduled_at = study_sessions.scheduled_start - interval '10 minutes'
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

-- Comments
COMMENT ON TABLE public.session_reminders IS 'Session reminder notifications scheduled for participants';
COMMENT ON COLUMN public.session_reminders.session_id IS 'Reference to study session';
COMMENT ON COLUMN public.session_reminders.recipient_id IS 'User who will receive the reminder';
COMMENT ON COLUMN public.session_reminders.scheduled_at IS 'When the reminder should be sent (session start - 10 minutes)';
COMMENT ON COLUMN public.session_reminders.sent IS 'Whether the reminder has been sent';
COMMENT ON COLUMN public.session_reminders.sent_at IS 'When the reminder was actually sent';

-- ============================================================================
-- SESSION REMINDER LOGS TABLE
-- ============================================================================

-- Table: session_reminder_logs
-- Records send attempts (sent/failed) for auditing
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

-- Comments
COMMENT ON TABLE public.session_reminder_logs IS 'Log of session reminder sending attempts';
COMMENT ON COLUMN public.session_reminder_logs.reminder_id IS 'Reference to session reminder (nullable)';
COMMENT ON COLUMN public.session_reminder_logs.session_id IS 'Reference to study session (for logging)';
COMMENT ON COLUMN public.session_reminder_logs.recipient_id IS 'User who was target of notification';
COMMENT ON COLUMN public.session_reminder_logs.status IS 'Send status (sent/failed/error)';
COMMENT ON COLUMN public.session_reminder_logs.payload IS 'Notification payload data';
COMMENT ON COLUMN public.session_reminder_logs.error_text IS 'Error message if sending failed';

-- ============================================================================
-- IN-APP NOTIFICATIONS TABLE
-- ============================================================================

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

-- Comments
COMMENT ON TABLE public.notifications IS 'Generic in-app notifications for users';
COMMENT ON COLUMN public.notifications.user_id IS 'User who will receive the notification';
COMMENT ON COLUMN public.notifications.type IS 'Notification type (chat, buddy, session, achievement, etc.)';
COMMENT ON COLUMN public.notifications.title IS 'Notification title';
COMMENT ON COLUMN public.notifications.body IS 'Notification body text';
COMMENT ON COLUMN public.notifications.data IS 'Additional notification data (JSON)';
COMMENT ON COLUMN public.notifications.read IS 'Whether user has read the notification';

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Push tokens indexes
CREATE INDEX push_tokens_user_id_idx ON public.push_tokens(user_id);
CREATE INDEX push_tokens_token_idx ON public.push_tokens(token);
CREATE UNIQUE INDEX push_tokens_user_platform_device_idx 
  ON public.push_tokens(user_id, platform, device_id) 
  WHERE device_id IS NOT NULL;

-- Session reminders indexes
CREATE UNIQUE INDEX session_reminders_session_recipient_uniq ON public.session_reminders(session_id, recipient_id);
CREATE INDEX session_reminders_scheduled_at_idx ON public.session_reminders(scheduled_at);

-- Session reminder logs indexes
CREATE INDEX session_reminder_logs_session_idx ON public.session_reminder_logs(session_id);
CREATE INDEX session_reminder_logs_recipient_idx ON public.session_reminder_logs(recipient_id);

-- Notifications indexes
CREATE INDEX notifications_user_read_idx ON public.notifications(user_id, read);
CREATE INDEX notifications_created_idx ON public.notifications(created_at);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Push tokens updated_at trigger
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_updated_at();

-- Notification preferences updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Session reminders updated_at trigger
CREATE OR REPLACE FUNCTION update_session_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_reminders_updated_at
  BEFORE UPDATE ON public.session_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_session_reminders_updated_at();

-- Notifications updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- ============================================================================
-- NOTIFICATION TRIGGERS
-- ============================================================================

-- Function to prepare notification data when new message is inserted
-- This function will be called by the trigger and can be extended to call Edge Function
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  chat_participants uuid[];
  sender_profile RECORD;
  message_preview text;
BEGIN
  -- Get all participants except sender
  SELECT ARRAY_AGG(user_id)
  INTO chat_participants
  FROM chat_participants
  WHERE chat_id = NEW.chat_id
    AND user_id != NEW.sender_id;

  -- If no other participants, return
  IF chat_participants IS NULL OR array_length(chat_participants, 1) = 0 THEN
    RETURN NEW;
  END IF;

  -- Get sender profile info
  SELECT display_name
  INTO sender_profile
  FROM profiles
  WHERE user_id = NEW.sender_id
    AND deleted_at IS NULL;

  -- Prepare message preview (truncate if too long)
  message_preview := COALESCE(NEW.content, '[Attachment]');
  IF length(message_preview) > 100 THEN
    message_preview := left(message_preview, 97) || '...';
  END IF;

  -- Note: Actual notification sending will be implemented in application layer
  -- This trigger prepares the data but doesn't send notifications directly
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
CREATE TRIGGER on_message_insert_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL)
  EXECUTE FUNCTION notify_new_message();

COMMENT ON FUNCTION notify_new_message() IS 'Trigger function to prepare notification data when new message is inserted. Actual sending will be handled in application layer.';

-- ============================================================================
-- SESSION REMINDER HELPER FUNCTIONS
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

COMMENT ON FUNCTION public.insert_session_reminders IS 'Create session reminders for all participants and creator';
COMMENT ON FUNCTION public.update_session_reminders_schedule IS 'Update scheduled times for existing session reminders';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all notification tables
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR NOTIFICATION SYSTEM
-- ============================================================================

-- Push tokens policies
CREATE POLICY "push_tokens_select_own"
  ON public.push_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_insert_own"
  ON public.push_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_tokens_update_own"
  ON public.push_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_tokens_delete_own"
  ON public.push_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "notification_preferences_select_own"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_insert_own"
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences_update_own"
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences_delete_own"
  ON public.notification_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Session reminders policies
CREATE POLICY "session_reminders_select_own"
  ON public.session_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

-- Session reminders are managed by system/functions, not direct user access
-- Users can only view their own reminders

-- Session reminder logs policies (read-only for users)
CREATE POLICY "session_reminder_logs_select_own"
  ON public.session_reminder_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

-- Notifications policies
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
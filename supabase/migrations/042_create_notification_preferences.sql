-- ============================================================================
-- Migration: 042_create_notification_preferences.sql
-- Description: Create notification_preferences table for user notification settings
-- Dependencies: auth.users
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

-- Updated_at trigger
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


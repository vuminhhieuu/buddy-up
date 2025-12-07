-- ============================================================================
-- Migration: 045_create_message_notification_trigger.sql
-- Description: Create trigger function for sending notifications when new message is inserted
-- Dependencies: messages, push_tokens, notification_preferences, Edge Function
-- Note: This trigger is a placeholder. Actual notification sending will be handled
--       in PR #5 (Chat Notification Feature) via application layer or pg_net extension
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
    AND user_id != NEW.sender_id
    AND deleted_at IS NULL;

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

  -- Note: Actual notification sending will be implemented in PR #5
  -- This can be done via:
  -- 1. Application layer (call Edge Function from useChatRealtime)
  -- 2. pg_net extension (call Edge Function from trigger)
  -- 3. Webhook (if Supabase webhooks are configured)
  
  -- For now, this function just returns NEW
  -- The actual notification sending logic will be added in PR #5
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_message_insert_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL)
  EXECUTE FUNCTION notify_new_message();

-- Comment
COMMENT ON FUNCTION notify_new_message() IS 'Trigger function to prepare notification data when new message is inserted. Actual sending will be handled in application layer or via pg_net extension.';


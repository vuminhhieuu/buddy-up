-- ============================================================================
-- Migration: 041_create_push_tokens.sql
-- Description: Create push_tokens table for storing device push tokens
-- Dependencies: auth.users
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

-- Indexes
CREATE INDEX push_tokens_user_id_idx ON public.push_tokens(user_id);
CREATE INDEX push_tokens_token_idx ON public.push_tokens(token);
CREATE UNIQUE INDEX push_tokens_user_platform_device_idx 
  ON public.push_tokens(user_id, platform, device_id) 
  WHERE device_id IS NOT NULL;

-- Updated_at trigger
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


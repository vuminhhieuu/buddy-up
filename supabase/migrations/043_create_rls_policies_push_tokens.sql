-- ============================================================================
-- Migration: 043_create_rls_policies_push_tokens.sql
-- Description: RLS policies for push_tokens table
-- Dependencies: 041_create_push_tokens.sql
-- ============================================================================

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view own push tokens"
  ON public.push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own push tokens"
  ON public.push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own push tokens"
  ON public.push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own push tokens"
  ON public.push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);


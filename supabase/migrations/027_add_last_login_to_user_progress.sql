-- ============================================================================
-- Migration: 027_add_last_login_to_user_progress.sql
-- Description: Add last_login_at column to track users' latest login date
-- Dependencies: 010_create_user_progress.sql
-- ============================================================================

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

COMMENT ON COLUMN public.user_progress.last_login_at IS 'Last recorded app login time (UTC)';


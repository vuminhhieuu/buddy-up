-- ============================================================================
-- Migration: 033_add_learning_time_column.sql
-- Description: Add learning_time column to profiles to store user's preferred single time slot
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learning_times text[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.learning_times IS
  'Array of preferred learning times (e.g., ["evening","weekend"])';

CREATE INDEX IF NOT EXISTS profiles_learning_times_idx
  ON public.profiles USING GIN(learning_times)
  WHERE deleted_at IS NULL;
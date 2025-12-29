-- ============================================================================
-- Migration: 051_create_saved_profiles.sql
-- Description: Create saved_profiles table for saving/liking buddy profiles
-- Dependencies: auth.users, profiles
-- ============================================================================

-- Saved profiles table
-- Allows users to save/bookmark profiles they're interested in
CREATE TABLE public.saved_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Ensure user cannot save their own profile
  CONSTRAINT saved_profiles_no_self_save CHECK (user_id <> saved_user_id)
);

-- Comments
COMMENT ON TABLE public.saved_profiles IS 'Saved/bookmarked profiles by users';
COMMENT ON COLUMN public.saved_profiles.user_id IS 'User who saved the profile';
COMMENT ON COLUMN public.saved_profiles.saved_user_id IS 'Profile that was saved';
COMMENT ON COLUMN public.saved_profiles.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Indexes
-- Index for querying saved profiles by user
CREATE INDEX saved_profiles_user_id_idx 
  ON public.saved_profiles(user_id) 
  WHERE deleted_at IS NULL;

-- Index for querying who saved a specific profile
CREATE INDEX saved_profiles_saved_user_id_idx 
  ON public.saved_profiles(saved_user_id) 
  WHERE deleted_at IS NULL;

-- Unique index to prevent duplicate saves
CREATE UNIQUE INDEX saved_profiles_unique_save_idx
  ON public.saved_profiles(user_id, saved_user_id)
  WHERE deleted_at IS NULL;

-- Composite index for common queries
CREATE INDEX saved_profiles_user_created_idx
  ON public.saved_profiles(user_id, created_at DESC)
  WHERE deleted_at IS NULL;


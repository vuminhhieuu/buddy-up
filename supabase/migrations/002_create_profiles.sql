-- ============================================================================
-- Migration: 002_create_profiles.sql
-- Description: Create profiles table to extend auth.users with additional info
-- Dependencies: auth.users (Supabase built-in)
-- ============================================================================

-- Profiles table
-- Extends Supabase auth.users with additional user profile information
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  interests text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Comments
COMMENT ON TABLE public.profiles IS 'Extended user profile information';
COMMENT ON COLUMN public.profiles.user_id IS 'References auth.users.id (1:1 relationship)';
COMMENT ON COLUMN public.profiles.display_name IS 'User display name shown in app';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image (Supabase Storage)';
COMMENT ON COLUMN public.profiles.bio IS 'User biography/description';
COMMENT ON COLUMN public.profiles.interests IS 'Array of user interests for matching';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Index on user_id (already PK, but explicit for clarity)
-- Note: Primary key automatically creates index


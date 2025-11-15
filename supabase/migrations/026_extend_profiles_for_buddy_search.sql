-- ============================================================================
-- Migration: 026_extend_profiles_for_buddy_search.sql
-- Description: Extend profiles table with columns for buddy search and matching
-- Dependencies: 002_create_profiles.sql
-- ============================================================================

-- Add columns for buddy search filters and matching
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learning_goals text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_times text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_times_detail text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning_style text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS main_learning_goal text,
  ADD COLUMN IF NOT EXISTS learning_interests text[] DEFAULT '{}';

-- Comments for new columns
COMMENT ON COLUMN public.profiles.learning_goals IS 
  'Array of learning goals (e.g., JLPT N3, React Native, TOEIC, IELTS, Python, Data Science, UI/UX, Marketing)';
COMMENT ON COLUMN public.profiles.available_times IS 
  'Array of available time slots (morning, afternoon, evening, late_night, weekend, flexible)';
COMMENT ON COLUMN public.profiles.available_times_detail IS 
  'Detailed available time descriptions (e.g., "Tối thứ 2, 4, 6 (19:00 - 21:00)")';
COMMENT ON COLUMN public.profiles.learning_style IS 
  'Learning style preference: serious, relaxed, balanced, not_important';
COMMENT ON COLUMN public.profiles.age IS 
  'User age for filtering';
COMMENT ON COLUMN public.profiles.level IS 
  'Learning level: beginner, intermediate, advanced';
COMMENT ON COLUMN public.profiles.is_online IS 
  'Whether user is currently online';
COMMENT ON COLUMN public.profiles.is_verified IS 
  'Whether user profile is verified';
COMMENT ON COLUMN public.profiles.location IS 
  'User location (city name or coordinates)';
COMMENT ON COLUMN public.profiles.main_learning_goal IS 
  'Main learning goal displayed on profile card (e.g., "JLPT N3 - Tháng 12/2024")';
COMMENT ON COLUMN public.profiles.learning_interests IS 
  'Array of learning interests/tags (e.g., "Từ vựng N3", "Đọc hiểu", "Nghe")';

-- Indexes for performance optimization
-- GIN indexes for array columns (efficient for array overlap queries)
CREATE INDEX IF NOT EXISTS profiles_learning_goals_idx 
  ON public.profiles USING GIN(learning_goals) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_available_times_idx 
  ON public.profiles USING GIN(available_times) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_learning_interests_idx 
  ON public.profiles USING GIN(learning_interests) 
  WHERE deleted_at IS NULL;

-- B-tree indexes for single value columns
CREATE INDEX IF NOT EXISTS profiles_learning_style_idx 
  ON public.profiles(learning_style) 
  WHERE deleted_at IS NULL AND learning_style IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_level_idx 
  ON public.profiles(level) 
  WHERE deleted_at IS NULL AND level IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_age_idx 
  ON public.profiles(age) 
  WHERE deleted_at IS NULL AND age IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_is_online_idx 
  ON public.profiles(is_online) 
  WHERE deleted_at IS NULL AND is_online = true;

CREATE INDEX IF NOT EXISTS profiles_is_verified_idx 
  ON public.profiles(is_verified) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_location_idx 
  ON public.profiles(location) 
  WHERE deleted_at IS NULL AND location IS NOT NULL;

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS profiles_buddy_search_idx 
  ON public.profiles(learning_style, level, is_online, is_verified) 
  WHERE deleted_at IS NULL;

-- Comments
COMMENT ON INDEX profiles_learning_goals_idx IS 
  'GIN index for efficient array overlap queries on learning_goals';
COMMENT ON INDEX profiles_available_times_idx IS 
  'GIN index for efficient array overlap queries on available_times';
COMMENT ON INDEX profiles_learning_interests_idx IS 
  'GIN index for efficient array overlap queries on learning_interests';
COMMENT ON INDEX profiles_buddy_search_idx IS 
  'Composite index for common buddy search filter combinations';


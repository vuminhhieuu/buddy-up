-- ============================================================================
-- Migration: 003_profiles_extensions.sql
-- Description: Extend profiles with buddy search, progress tracking, and academic fields
-- Dependencies: 001_core_database_schema.sql, 002_row_level_security.sql
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE EXTENSIONS FOR BUDDY SEARCH
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
  ADD COLUMN IF NOT EXISTS learning_interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning_times text[] DEFAULT '{}';

-- Comments for buddy search columns
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
COMMENT ON COLUMN public.profiles.learning_times IS
  'Array of preferred learning times (e.g., ["evening","weekend"])';

-- ============================================================================
-- ACADEMIC FIELDS EXTENSION
-- ============================================================================

-- Add academic columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS major text,
  ADD COLUMN IF NOT EXISTS current_subjects text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS current_projects text[] DEFAULT '{}';

-- Comments for academic columns
COMMENT ON COLUMN public.profiles.university IS 
  'University/School name (e.g., "Đại học Quốc gia TP.HCM", "UIT", "HCMUS")';
COMMENT ON COLUMN public.profiles.major IS 
  'Major/Field of study (e.g., "Công nghệ thông tin", "Khoa học máy tính", "Kỹ thuật phần mềm")';
COMMENT ON COLUMN public.profiles.current_subjects IS 
  'Array of current subjects/courses (e.g., ["Phát triển ứng dụng di động", "Lập trình hướng đối tượng"])';
COMMENT ON COLUMN public.profiles.current_projects IS 
  'Array of current projects (e.g., ["Đồ án môn học", "Đồ án tốt nghiệp"])';

-- ============================================================================
-- USER PROGRESS TABLE EXTENSIONS
-- ============================================================================

-- Add last login tracking to user progress
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

COMMENT ON COLUMN public.user_progress.last_login_at IS 'Last recorded app login time (UTC)';

-- ============================================================================
-- STUDY SESSIONS TABLE EXTENSIONS
-- ============================================================================

-- Add description column to study sessions
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.study_sessions.description IS 'Optional free-form description for the session (human readable)';

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS profiles_learning_times_idx
  ON public.profiles USING GIN(learning_times)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_current_subjects_idx 
  ON public.profiles USING GIN(current_subjects) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_current_projects_idx 
  ON public.profiles USING GIN(current_projects) 
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

CREATE INDEX IF NOT EXISTS profiles_university_idx 
  ON public.profiles(university) 
  WHERE deleted_at IS NULL AND university IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_major_idx 
  ON public.profiles(major) 
  WHERE deleted_at IS NULL AND major IS NOT NULL;

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS profiles_buddy_search_idx 
  ON public.profiles(learning_style, level, is_online, is_verified) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_academic_match_idx 
  ON public.profiles(university, major, level) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- INDEX COMMENTS
-- ============================================================================

COMMENT ON INDEX profiles_learning_goals_idx IS 
  'GIN index for efficient array overlap queries on learning_goals';
COMMENT ON INDEX profiles_available_times_idx IS 
  'GIN index for efficient array overlap queries on available_times';
COMMENT ON INDEX profiles_learning_interests_idx IS 
  'GIN index for efficient array overlap queries on learning_interests';
COMMENT ON INDEX profiles_learning_times_idx IS 
  'GIN index for efficient array overlap queries on learning_times';
COMMENT ON INDEX profiles_current_subjects_idx IS 
  'GIN index for efficient array overlap queries on current_subjects';
COMMENT ON INDEX profiles_current_projects_idx IS 
  'GIN index for efficient array overlap queries on current_projects';
COMMENT ON INDEX profiles_buddy_search_idx IS 
  'Composite index for common buddy search filter combinations';
COMMENT ON INDEX profiles_academic_match_idx IS 
  'Composite index for academic matching (university, major, level)';
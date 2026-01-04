-- ============================================================================
-- Migration: 053_add_academic_fields_to_profiles.sql
-- Description: Add academic fields for enhanced buddy matching
--              (university, major, subjects, projects)
-- Dependencies: 026_extend_profiles_for_buddy_search.sql
-- ============================================================================

-- Add academic columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS major text,
  ADD COLUMN IF NOT EXISTS current_subjects text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS current_projects text[] DEFAULT '{}';

-- Comments for new columns
COMMENT ON COLUMN public.profiles.university IS 
  'University/School name (e.g., "Đại học Quốc gia TP.HCM", "UIT", "HCMUS")';
COMMENT ON COLUMN public.profiles.major IS 
  'Major/Field of study (e.g., "Công nghệ thông tin", "Khoa học máy tính", "Kỹ thuật phần mềm")';
COMMENT ON COLUMN public.profiles.current_subjects IS 
  'Array of current subjects/courses (e.g., ["Phát triển ứng dụng di động", "Lập trình hướng đối tượng"])';
COMMENT ON COLUMN public.profiles.current_projects IS 
  'Array of current projects (e.g., ["Đồ án môn học", "Đồ án tốt nghiệp"])';

-- Indexes for performance optimization
-- GIN indexes for array columns (efficient for array overlap queries)
CREATE INDEX IF NOT EXISTS profiles_current_subjects_idx 
  ON public.profiles USING GIN(current_subjects) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_current_projects_idx 
  ON public.profiles USING GIN(current_projects) 
  WHERE deleted_at IS NULL;

-- B-tree indexes for single value columns
CREATE INDEX IF NOT EXISTS profiles_university_idx 
  ON public.profiles(university) 
  WHERE deleted_at IS NULL AND university IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_major_idx 
  ON public.profiles(major) 
  WHERE deleted_at IS NULL AND major IS NOT NULL;

-- Composite index for academic matching
CREATE INDEX IF NOT EXISTS profiles_academic_match_idx 
  ON public.profiles(university, major, level) 
  WHERE deleted_at IS NULL;

-- Comments
COMMENT ON INDEX profiles_current_subjects_idx IS 
  'GIN index for efficient array overlap queries on current_subjects';
COMMENT ON INDEX profiles_current_projects_idx IS 
  'GIN index for efficient array overlap queries on current_projects';
COMMENT ON INDEX profiles_academic_match_idx IS 
  'Composite index for academic matching (university + major + level)';



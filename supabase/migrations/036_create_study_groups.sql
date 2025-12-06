-- ============================================================================
-- Migration: 036_create_study_groups.sql
-- Description: Create study_groups table for public and private study groups
-- Dependencies: auth.users, 001_create_enums.sql
-- ============================================================================

-- Study groups table
-- Stores information about study groups (public and private)
CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  cover_image_url text,
  icon_emoji text,
  slug text UNIQUE NOT NULL, -- Đường dẫn nhóm (buddyup.vn/g/slug)
  privacy_type group_privacy_type NOT NULL DEFAULT 'public',
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Chủ đề & Lĩnh vực
  topics text[] DEFAULT '{}', -- Mảng các chủ đề (IELTS, TOEIC, etc.)
  student_level text CHECK (student_level IN ('all', 'beginner', 'intermediate', 'advanced')),
  main_language text DEFAULT 'vi',
  expected_activity_frequency text CHECK (expected_activity_frequency IN ('daily', 'few_times_week', 'weekly', 'flexible')),
  
  -- Cài đặt
  requires_approval boolean DEFAULT false,
  posting_permission text DEFAULT 'all_members' CHECK (posting_permission IN ('all_members', 'admin_moderator_only')),
  
  -- Metadata
  member_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Constraints
  CONSTRAINT study_groups_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT study_groups_description_length CHECK (char_length(description) >= 10 AND char_length(description) <= 500),
  CONSTRAINT study_groups_slug_format CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 50)
);

-- Comments
COMMENT ON TABLE public.study_groups IS 'Study groups (public and private)';
COMMENT ON COLUMN public.study_groups.name IS 'Group name (3-100 characters)';
COMMENT ON COLUMN public.study_groups.description IS 'Group description (10-500 characters)';
COMMENT ON COLUMN public.study_groups.cover_image_url IS 'URL to group cover image (Supabase Storage)';
COMMENT ON COLUMN public.study_groups.icon_emoji IS 'Emoji icon for the group';
COMMENT ON COLUMN public.study_groups.slug IS 'URL-friendly identifier (buddyup.vn/g/slug)';
COMMENT ON COLUMN public.study_groups.privacy_type IS 'Privacy type: public or private';
COMMENT ON COLUMN public.study_groups.creator_id IS 'User who created the group';
COMMENT ON COLUMN public.study_groups.topics IS 'Array of topics/subjects (max 3)';
COMMENT ON COLUMN public.study_groups.student_level IS 'Target student level: all, beginner, intermediate, advanced';
COMMENT ON COLUMN public.study_groups.main_language IS 'Main language used in the group';
COMMENT ON COLUMN public.study_groups.expected_activity_frequency IS 'Expected activity frequency';
COMMENT ON COLUMN public.study_groups.requires_approval IS 'Whether new members need approval';
COMMENT ON COLUMN public.study_groups.posting_permission IS 'Who can post: all_members or admin_moderator_only';
COMMENT ON COLUMN public.study_groups.member_count IS 'Current number of active members';
COMMENT ON COLUMN public.study_groups.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Indexes
-- Index for querying groups by creator
CREATE INDEX study_groups_creator_id_idx ON public.study_groups(creator_id) 
  WHERE deleted_at IS NULL;

-- Index for querying groups by privacy type
CREATE INDEX study_groups_privacy_type_idx ON public.study_groups(privacy_type) 
  WHERE deleted_at IS NULL;

-- Index for querying groups by slug (for public URLs)
CREATE UNIQUE INDEX study_groups_slug_idx ON public.study_groups(slug) 
  WHERE deleted_at IS NULL;

-- Index for searching groups by topics (using GIN index for array search)
CREATE INDEX study_groups_topics_idx ON public.study_groups USING GIN(topics) 
  WHERE deleted_at IS NULL;

-- Index for querying public groups (for discovery)
CREATE INDEX study_groups_public_idx ON public.study_groups(created_at DESC) 
  WHERE deleted_at IS NULL AND privacy_type = 'public';

-- Ensure function exists (created in migration 013, but create here if needed)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for automatic updated_at updates
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


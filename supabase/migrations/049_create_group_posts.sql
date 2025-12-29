-- ============================================================================
-- Migration: 049_create_group_posts.sql
-- Description: Create group_posts table for posts in study groups
-- Dependencies: study_groups, auth.users, 001_create_enums.sql
-- ============================================================================

-- Group posts table
-- Stores posts created by members in study groups
CREATE TABLE public.group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_urls text[] DEFAULT '{}', -- Array of image URLs (max 5 images)
  
  -- Metadata
  like_count int DEFAULT 0,
  comment_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Constraints
  CONSTRAINT group_posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
  CONSTRAINT group_posts_image_count CHECK (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 5)
);

-- Comments
COMMENT ON TABLE public.group_posts IS 'Posts created by members in study groups';
COMMENT ON COLUMN public.group_posts.group_id IS 'Reference to study group';
COMMENT ON COLUMN public.group_posts.author_id IS 'User who created the post';
COMMENT ON COLUMN public.group_posts.content IS 'Post content (1-5000 characters)';
COMMENT ON COLUMN public.group_posts.image_urls IS 'Array of image URLs (max 5 images)';
COMMENT ON COLUMN public.group_posts.like_count IS 'Number of likes on the post';
COMMENT ON COLUMN public.group_posts.comment_count IS 'Number of comments on the post';
COMMENT ON COLUMN public.group_posts.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Indexes
-- Index for querying posts by group
CREATE INDEX group_posts_group_id_idx ON public.group_posts(group_id) 
  WHERE deleted_at IS NULL;

-- Index for querying posts by author
CREATE INDEX group_posts_author_id_idx ON public.group_posts(author_id) 
  WHERE deleted_at IS NULL;

-- Index for querying posts by creation time (for feed ordering)
CREATE INDEX group_posts_created_at_idx ON public.group_posts(group_id, created_at DESC) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- RLS Policies for Group Posts
-- ============================================================================

-- Group posts: SELECT policy
-- Members can see posts in groups they belong to
CREATE POLICY "group_posts_select_member"
  ON public.group_posts
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1
      FROM public.study_groups
      WHERE study_groups.id = group_posts.group_id
        AND study_groups.deleted_at IS NULL
        AND (
          study_groups.privacy_type = 'public' OR
          EXISTS (
            SELECT 1
            FROM public.group_members
            WHERE group_members.group_id = study_groups.id
              AND group_members.user_id = auth.uid()
              AND group_members.status = 'active'
          )
        )
    )
  );

-- Group posts: INSERT policy
-- Members can create posts if they have permission
CREATE POLICY "group_posts_insert_member"
  ON public.group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1
      FROM public.study_groups
      WHERE study_groups.id = group_posts.group_id
        AND study_groups.deleted_at IS NULL
        AND (
          study_groups.posting_permission = 'all_members' OR
          EXISTS (
            SELECT 1
            FROM public.group_members
            WHERE group_members.group_id = study_groups.id
              AND group_members.user_id = auth.uid()
              AND group_members.role IN ('admin', 'moderator', 'owner')
              AND group_members.status = 'active'
          )
        )
        AND EXISTS (
          SELECT 1
          FROM public.group_members
          WHERE group_members.group_id = study_groups.id
            AND group_members.user_id = auth.uid()
            AND group_members.status = 'active'
        )
    )
  );

-- Group posts: UPDATE policy
-- Only author can update their own posts
CREATE POLICY "group_posts_update_author"
  ON public.group_posts
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    auth.uid() = author_id
  )
  WITH CHECK (
    deleted_at IS NULL AND
    auth.uid() = author_id
  );

-- Group posts: DELETE policy
-- Author or admins/moderators can delete posts
CREATE POLICY "group_posts_delete_author_or_admin"
  ON public.group_posts
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      auth.uid() = author_id OR
      EXISTS (
        SELECT 1
        FROM public.group_members
        WHERE group_members.group_id = group_posts.group_id
          AND group_members.user_id = auth.uid()
          AND group_members.role IN ('admin', 'moderator', 'owner')
          AND group_members.status = 'active'
      )
    )
  );

-- Comments on policies
COMMENT ON POLICY "group_posts_select_member" ON public.group_posts IS 
  'Public groups: Everyone can see posts. Private groups: Only members can see posts';
COMMENT ON POLICY "group_posts_insert_member" ON public.group_posts IS 
  'Members can create posts if they have permission based on group settings';
COMMENT ON POLICY "group_posts_update_author" ON public.group_posts IS 
  'Only author can update their own posts';
COMMENT ON POLICY "group_posts_delete_author_or_admin" ON public.group_posts IS 
  'Author or admins/moderators can delete posts';


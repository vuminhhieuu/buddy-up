-- ============================================================================
-- Migration: 050_add_file_urls_to_group_posts.sql
-- Description: Add file_urls column to group_posts table for PDF attachments
-- Dependencies: 049_create_group_posts.sql
-- ============================================================================

-- Add file_urls column for PDF and other file attachments
ALTER TABLE public.group_posts
  ADD COLUMN file_urls text[] DEFAULT '{}';

-- Add constraint for file count (max 5 files)
ALTER TABLE public.group_posts
  ADD CONSTRAINT group_posts_file_count CHECK (
    array_length(file_urls, 1) IS NULL OR array_length(file_urls, 1) <= 5
  );

-- Update comment
COMMENT ON COLUMN public.group_posts.file_urls IS 'Array of file URLs (PDF, etc.) - max 5 files';


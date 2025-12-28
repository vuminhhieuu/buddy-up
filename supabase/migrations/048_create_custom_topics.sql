-- ============================================================================
-- Migration: 048_create_custom_topics.sql
-- Description: Create custom_topics table for storing user-created custom topics
-- Dependencies: auth.users
-- ============================================================================

-- Custom topics table
-- Stores custom topics created by users for groups and sessions
CREATE TABLE IF NOT EXISTS public.custom_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id text NOT NULL UNIQUE, -- The topic ID (e.g., "custom-1234567890")
  topic_label text NOT NULL, -- The display label (e.g., "Tình nguyện")
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT custom_topics_topic_id_format CHECK (topic_id ~ '^custom-[0-9]+$'),
  CONSTRAINT custom_topics_label_length CHECK (char_length(topic_label) >= 2 AND char_length(topic_label) <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS custom_topics_topic_id_idx ON public.custom_topics(topic_id);
CREATE INDEX IF NOT EXISTS custom_topics_created_at_idx ON public.custom_topics(created_at DESC);

-- Comments
COMMENT ON TABLE public.custom_topics IS 'Custom topics created by users for groups and sessions';
COMMENT ON COLUMN public.custom_topics.topic_id IS 'Unique topic identifier (format: custom-{timestamp})';
COMMENT ON COLUMN public.custom_topics.topic_label IS 'Display label for the custom topic (2-100 characters)';
COMMENT ON COLUMN public.custom_topics.created_at IS 'When the custom topic was created';
COMMENT ON COLUMN public.custom_topics.updated_at IS 'When the custom topic was last updated';

-- Enable RLS (Row Level Security)
ALTER TABLE public.custom_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to read custom topics (so all users can see custom topics created by others)
CREATE POLICY "Anyone can read custom topics"
  ON public.custom_topics
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert custom topics
CREATE POLICY "Authenticated users can create custom topics"
  ON public.custom_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update custom topics
-- This allows updating topic labels if needed
CREATE POLICY "Authenticated users can update custom topics"
  ON public.custom_topics
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


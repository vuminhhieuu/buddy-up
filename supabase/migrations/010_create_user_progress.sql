-- ============================================================================
-- Migration: 010_create_user_progress.sql
-- Description: Create user_progress table for gamification and progress tracking
-- Dependencies: auth.users
-- ============================================================================

-- User progress table
-- Tracks user's learning progress, XP, level, and streak (1:1 with user)
CREATE TABLE public.user_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  streak int NOT NULL DEFAULT 0, -- Consecutive days of activity
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.user_progress IS 'User progress tracking for gamification (1:1 with user)';
COMMENT ON COLUMN public.user_progress.user_id IS 'Reference to user (1:1 relationship)';
COMMENT ON COLUMN public.user_progress.level IS 'User level (increases with XP)';
COMMENT ON COLUMN public.user_progress.xp IS 'Experience points accumulated';
COMMENT ON COLUMN public.user_progress.streak IS 'Consecutive days of activity';

-- Note: Badges are tracked separately in user_badges junction table
-- This keeps the schema normalized

-- Index on user_id (already PK, but explicit for clarity)
-- Note: Primary key automatically creates index


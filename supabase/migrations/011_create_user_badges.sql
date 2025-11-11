-- ============================================================================
-- Migration: 011_create_user_badges.sql
-- Description: Create user_badges junction table (N:M relationship)
-- Dependencies: auth.users, badges
-- ============================================================================

-- User badges table
-- Junction table for many-to-many relationship between users and badges
CREATE TABLE public.user_badges (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  obtained_at timestamptz NOT NULL DEFAULT now(),
  
  PRIMARY KEY (user_id, badge_id)
);

-- Comments
COMMENT ON TABLE public.user_badges IS 'Junction table: badges earned by users';
COMMENT ON COLUMN public.user_badges.user_id IS 'Reference to user';
COMMENT ON COLUMN public.user_badges.badge_id IS 'Reference to badge';
COMMENT ON COLUMN public.user_badges.obtained_at IS 'When the user earned this badge';

-- Indexes
-- Index for querying all badges a user has earned
CREATE INDEX user_badges_user_id_idx ON public.user_badges(user_id);

-- Index for querying all users who have a specific badge (optional, for analytics)
CREATE INDEX user_badges_badge_id_idx ON public.user_badges(badge_id);


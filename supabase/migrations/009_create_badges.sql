-- ============================================================================
-- Migration: 009_create_badges.sql
-- Description: Create badges table for gamification system
-- Dependencies: None (standalone table)
-- ============================================================================

-- Badges table
-- Master table for achievement badges in the gamification system
CREATE TABLE public.badges (
  id text PRIMARY KEY, -- e.g., 'early_bird', 'study_streak_7', 'first_session'
  name text NOT NULL,
  description text,
  icon_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.badges IS 'Master table for achievement badges';
COMMENT ON COLUMN public.badges.id IS 'Badge identifier (e.g., early_bird, study_streak_7)';
COMMENT ON COLUMN public.badges.name IS 'Display name of the badge';
COMMENT ON COLUMN public.badges.description IS 'Description of how to earn this badge';
COMMENT ON COLUMN public.badges.icon_url IS 'URL to badge icon image';

-- No additional indexes needed (id is already PK)


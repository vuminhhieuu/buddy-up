-- ============================================================================
-- Migration: 007_create_study_sessions.sql
-- Description: Create study_sessions table for scheduled study sessions
-- Dependencies: auth.users
-- ============================================================================

-- Study sessions table
-- Stores information about scheduled study sessions
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  subject text,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz,
  status session_status NOT NULL DEFAULT 'scheduled',
  location text, -- NULL for online sessions, address for in-person
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  -- Ensure scheduled_end is after scheduled_start if both provided
  CONSTRAINT study_sessions_valid_time_range CHECK (
    scheduled_end IS NULL OR scheduled_end > scheduled_start
  )
);

-- Comments
COMMENT ON TABLE public.study_sessions IS 'Scheduled study sessions';
COMMENT ON COLUMN public.study_sessions.creator_id IS 'User who created the session';
COMMENT ON COLUMN public.study_sessions.title IS 'Session title';
COMMENT ON COLUMN public.study_sessions.subject IS 'Subject/topic of the session';
COMMENT ON COLUMN public.study_sessions.scheduled_start IS 'When the session is scheduled to start';
COMMENT ON COLUMN public.study_sessions.scheduled_end IS 'When the session is scheduled to end (optional)';
COMMENT ON COLUMN public.study_sessions.status IS 'Current status of the session';
COMMENT ON COLUMN public.study_sessions.location IS 'Location (NULL for online, address for in-person)';
COMMENT ON COLUMN public.study_sessions.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Indexes
-- Index for querying sessions by creator
CREATE INDEX study_sessions_creator_id_idx ON public.study_sessions(creator_id) 
  WHERE deleted_at IS NULL;

-- Index for querying sessions by status
CREATE INDEX study_sessions_status_idx ON public.study_sessions(status) 
  WHERE deleted_at IS NULL;

-- Index for querying sessions by scheduled time (for upcoming sessions)
CREATE INDEX study_sessions_scheduled_start_idx ON public.study_sessions(scheduled_start) 
  WHERE deleted_at IS NULL AND status IN ('scheduled', 'ongoing');

